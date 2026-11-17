import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
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
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';
import type { NightKey } from '../../styles/tokens/palette';
import { hexOf } from './ink';
import { plastic } from './legoscene';

/** Reference sketches, for review only (`npm run lego:sheet -- <sketch> sketch | sketch3d`): the
 *  real object drawn as it is (airfoils, thin plates, posts), not in LEGO, in the model's own
 *  frame (studs; x along the car, y up, z across). The LEGO plan is then drawn against it
 *  (`compare`). A sketch says where its numbers come from. */

/** `context`: a neighbour drawn to place the part (a tyre, a crash structure), left off its drawing.
 *  `explode`: how far the part moves (studs) in its drawing's exploded view. */
export type SketchPart = { tone: NightKey; context?: boolean; explode?: [number, number, number] } & (
  | {
      /** A wing element: an inverted, cambered section from its leading edge to its trailing
       *  edge (x, y), across z0..z1. `spoon` raises the leading edge toward the tips; `sweep`
       *  moves it back (x) toward z1 (or toward z0 when negative): an arrowhead in plan. */
      kind: 'foil';
      le: [number, number];
      te: [number, number];
      z0: number;
      z1: number;
      t: number;
      camber: number;
      spoon?: number;
      sweep?: number;
    }
  | { kind: 'plate'; outline: [number, number][]; z: number; t: number }
  | { kind: 'post'; x0: number; x1: number; y0: number; y1: number; z0: number; z1: number }
  | { kind: 'pod'; x0: number; x1: number; y: number; z: number; r: number }
  /** A tyre (`rim`: the rim's radius, for a tyre on its wheel with rounded shoulders). */
  | { kind: 'wheel'; x: number; y: number; r: number; z0: number; z1: number; rim?: number }
  /** A body lofted along x through rounded-box sections, centred on z: each station is
   *  [x, bottom y, top y, half-width]. A nose, a survival cell, a sidepod, an engine cover. */
  | { kind: 'hull'; z: number; stations: [number, number, number, number][] }
  /** A round tube along a smooth curve through `points`: a halo, a roll hoop, a pillar. */
  | { kind: 'tube'; points: [number, number, number][]; r: number }
  /** A flat panel: its outline in plan (x, z) at height y, `t` thick. A floor. */
  | { kind: 'deck'; outline: [number, number][]; y: number; t: number }
);

/** A rounded box's outline (a superellipse of power 4), `n` points round it. */
function rounded(n = 24): [number, number][] {
  const r = (c: number): number => Math.sign(c) * Math.abs(c) ** 0.5;
  return Array.from({ length: n }, (_, k) => [r(Math.cos((2 * Math.PI * k) / n)), r(Math.sin((2 * Math.PI * k) / n))]);
}

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

type Foil = Extract<SketchPart, { kind: 'foil' }>;

/** A wing element's leading edge (x, y) at z, after its spoon and sweep. */
export function leadingEdge(p: Foil, z: number): [number, number] {
  const u = (2 * (z - p.z0)) / (p.z1 - p.z0) - 1;
  const back = (p.sweep ?? 0) >= 0 ? (u + 1) / 2 : (1 - u) / 2;
  return [p.le[0] + Math.abs(p.sweep ?? 0) * back, p.le[1] + (p.spoon ?? 0) * u * u];
}

/** One sketch part as a closed solid, in the model's frame. */
export function sketchGeometry(p: SketchPart): BufferGeometry {
  switch (p.kind) {
    case 'foil': {
      const sec = section(p.t, p.camber);
      const rings = Array.from({ length: 17 }, (_, k) => {
        const z = p.z0 + ((p.z1 - p.z0) * k) / 16;
        const le = leadingEdge(p, z);
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
    case 'wheel': {
      if (!p.rim) return new CylinderGeometry(p.r, p.r, p.z1 - p.z0, 40).rotateX(Math.PI / 2).translate(p.x, p.y, (p.z0 + p.z1) / 2); // prettier-ignore
      // Rim face set in, sidewall out to rounded shoulders, the tread, and back.
      const [s, k] = [0.12 * (p.z1 - p.z0), 0.3 * (p.z1 - p.z0)];
      const prof = [[0.5 * p.rim, p.z0 + k], [p.rim, p.z0 + k], [p.rim, p.z0], [p.r - s, p.z0], [p.r, p.z0 + s], [p.r, p.z1 - s], [p.r - s, p.z1], [p.rim, p.z1], [p.rim, p.z1 - k], [0.5 * p.rim, p.z1 - k]]; // prettier-ignore
      return new LatheGeometry(prof.map(([r = 0, z = 0]) => new Vector2(r, z)), 48).rotateX(Math.PI / 2).translate(p.x, p.y, 0); // prettier-ignore
    }
    case 'hull': {
      const ring = rounded();
      return loft(p.stations.map(([x, y0, y1, hw]) => ring.map(([u, v]): [number, number, number] => [x, (y0 + y1) / 2 + (v * (y1 - y0)) / 2, p.z + u * hw]))); // prettier-ignore
    }
    case 'tube': {
      const curve = new CatmullRomCurve3(p.points.map(([x, y, z]) => new Vector3(x, y, z)));
      return new TubeGeometry(curve, 8 * p.points.length, p.r, 16, false);
    }
    case 'deck': {
      const s = new Shape(p.outline.map(([x, z]) => new Vector2(x, z)));
      return new ExtrudeGeometry(s, { depth: p.t, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, p.y + p.t, 0); // prettier-ignore
    }
  }
}

/** The sketch as lines (its hard edges) or as solids. */
export function sketchModel(parts: SketchPart[], lines: boolean, own: (d: () => void) => void, tone?: NightKey): Group {
  const g = new Group();
  for (const p of parts) {
    const geo = sketchGeometry(p);
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
