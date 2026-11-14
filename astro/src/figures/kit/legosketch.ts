import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  EdgesGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  LatheGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  Shape,
  Vector2,
} from 'three';
import type { NightKey } from '../../styles/tokens/palette';
import { hexOf } from './ink';
import { plastic } from './legoscene';

/** Reference sketches, for review only (`npm run lego:sheet -- <sketch> sketch | sketch3d`): the
 *  real object drawn as it is (airfoils, thin plates, posts), not in LEGO, in the model's own
 *  frame (studs; x along the car, y up, z across). The LEGO plan is then drawn against it
 *  (`compare`). A sketch says where its numbers come from. */

export type SketchPart = { tone: NightKey } & (
  | {
      /** A wing element: an inverted, cambered section from its leading edge to its trailing
       *  edge (x, y), across z0..z1. `spoon` raises the leading edge toward the tips. */
      kind: 'foil';
      le: [number, number];
      te: [number, number];
      z0: number;
      z1: number;
      t: number;
      camber: number;
      spoon?: number;
    }
  | { kind: 'plate'; outline: [number, number][]; z: number; t: number }
  | { kind: 'post'; x0: number; x1: number; y0: number; y1: number; z0: number; z1: number }
  | { kind: 'pod'; x0: number; x1: number; y: number; z: number; r: number }
  | { kind: 'wheel'; x: number; y: number; r: number; z0: number; z1: number }
);

/** A cambered section (unit chord): upper surface back, lower surface forward, camber below. */
function section(t: number, camber: number, n = 14): [number, number][] {
  const thick = (u: number): number => 5 * t * (0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u ** 2 + 0.2843 * u ** 3 - 0.1036 * u ** 4); // prettier-ignore
  const mid = (u: number): number => -camber * 4 * u * (1 - u);
  const us = Array.from({ length: n + 1 }, (_, k) => (1 - Math.cos((k / n) * Math.PI)) / 2);
  const top = us.map((u): [number, number] => [u, mid(u) + thick(u)]);
  const bottom = us.map((u): [number, number] => [u, mid(u) - thick(u)]).reverse();
  return [...top, ...bottom.slice(1, -1)];
}

/** Sections joined along z, the ends capped. */
function loft(rings: [number, number, number][][]): BufferGeometry {
  const pos: number[] = [];
  const tri = (a?: number[], b?: number[], c?: number[]): void => void (a && b && c && pos.push(...a, ...b, ...c));
  for (let s = 0; s + 1 < rings.length; s++) {
    const [p, q] = [rings[s] ?? [], rings[s + 1] ?? []];
    for (let k = 0; k < p.length; k++) {
      const k1 = (k + 1) % p.length;
      tri(p[k], q[k], q[k1]);
      tri(p[k], q[k1], p[k1]);
    }
  }
  for (const [ring, flip] of [
    [rings[0] ?? [], true],
    [rings[rings.length - 1] ?? [], false],
  ] as const) {
    const c = [0, 1, 2].map((i) => ring.reduce((sum, v) => sum + (v[i] ?? 0), 0) / ring.length);
    ring.forEach((v, k) => (flip ? tri(c, ring[(k + 1) % ring.length], v) : tri(c, v, ring[(k + 1) % ring.length])));
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

function geometryOf(p: SketchPart): BufferGeometry {
  switch (p.kind) {
    case 'foil': {
      const sec = section(p.t, p.camber);
      const rings = Array.from({ length: 17 }, (_, k) => {
        const z = p.z0 + ((p.z1 - p.z0) * k) / 16;
        const u = (2 * (z - p.z0)) / (p.z1 - p.z0) - 1;
        const le: [number, number] = [p.le[0], p.le[1] + (p.spoon ?? 0) * u * u];
        const [dx, dy] = [p.te[0] - le[0], p.te[1] - le[1]];
        return sec.map(([a, b]): [number, number, number] => [le[0] + a * dx - b * dy, le[1] + a * dy + b * dx, z]);
      });
      return loft(rings);
    }
    case 'plate': {
      const s = new Shape(p.outline.map(([x, y]) => new Vector2(x, y)));
      return new ExtrudeGeometry(s, { depth: p.t, bevelEnabled: false }).translate(0, 0, p.z - p.t / 2);
    }
    case 'post':
      return new BoxGeometry(p.x1 - p.x0, p.y1 - p.y0, p.z1 - p.z0).translate((p.x0 + p.x1) / 2, (p.y0 + p.y1) / 2, (p.z0 + p.z1) / 2); // prettier-ignore
    case 'pod': {
      const len = p.x1 - p.x0;
      const prof = Array.from({ length: 13 }, (_, k) => new Vector2(p.r * Math.sin((Math.PI * k) / 12) ** 0.8, (len * k) / 12)); // prettier-ignore
      return new LatheGeometry(prof, 20).rotateZ(-Math.PI / 2).translate(p.x0, p.y, p.z);
    }
    case 'wheel':
      return new CylinderGeometry(p.r, p.r, p.z1 - p.z0, 40).rotateX(Math.PI / 2).translate(p.x, p.y, (p.z0 + p.z1) / 2); // prettier-ignore
  }
}

/** The sketch as lines (its hard edges) or as solids. */
export function sketchModel(parts: SketchPart[], lines: boolean, own: (d: () => void) => void, tone?: NightKey): Group {
  const g = new Group();
  for (const p of parts) {
    const geo = geometryOf(p);
    own(() => geo.dispose());
    if (lines) {
      const mat = new LineBasicMaterial({ color: hexOf(tone ?? p.tone) });
      const e = new LineSegments(new EdgesGeometry(geo, 24), mat);
      own(() => {
        e.geometry.dispose();
        mat.dispose();
      });
      g.add(e);
    } else {
      const m = new Mesh(geo, plastic());
      m.material.color.set(hexOf(p.tone));
      m.material.side = DoubleSide;
      own(() => m.material.dispose());
      g.add(m);
    }
  }
  return g;
}
