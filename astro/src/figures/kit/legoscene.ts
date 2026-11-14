import {
  AmbientLight,
  Color,
  DirectionalLight,
  PMREMGenerator,
  type Scene,
  type WebGLRenderer,
  EdgesGeometry,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { NightKey } from '../../styles/tokens/palette';
import { hexOf } from './ink';
import { body, type Part } from './legomesh';
import { PLATE, turn, type Piece } from './legoset';
import { PROFILE, ROT, type Shape } from './legoswap';

/** Three ways to draw one LEGO model: the wireframe plan and the smooth isometric model (one
 *  solid per shape), and the LEGO itself (one instanced mesh per piece shape, so a model of
 *  hundreds of pieces is a few dozen draw calls, each piece movable for the build). */

const TONE: Record<NonNullable<Part['tone']>, NightKey> = { rim: 'inkSoft', dark: 'line2' };
const ANGLE: Record<Piece['rot'], number> = { 0: 0, 1: -Math.PI / 2, 2: Math.PI, 3: Math.PI / 2 };

/** Where a piece's own frame sits on the grid. */
export function placement(p: Piece, lift = 0): Matrix4 {
  const [x, z] = p.kind === 'wheel' || p.kind === 'axle' ? [p.x, p.z] : turn(p, 0, 0);
  return new Matrix4().makeRotationY(ANGLE[p.rot]).setPosition(x, p.y * PLATE + lift, z);
}

/** The body a shape would be as one solid: the plan the LEGO is swapped from. */
function solidOf(s: Shape): Piece[] {
  const at = { y: 0, rot: 0 as const, tone: s.tone };
  switch (s.kind) {
    case 'block':
      return [{ ...at, kind: 'brick', x: s.x, y: s.y, z: s.z, w: s.w, d: s.d, h: s.h }];
    case 'ramp': {
      const { run, h } = PROFILE[s.profile];
      return [{ ...at, kind: s.profile, x: s.x, y: s.y, z: s.z, w: run, d: s.wid, h, rot: ROT[s.dir] }];
    }
    case 'wedge':
      return [
        { ...at, kind: 'wedge', x: s.x, y: s.y, z: s.z, w: s.len, d: s.wid, h: 1, hand: s.hand, rot: ROT[s.dir] },
      ];
    case 'round': {
      const cyl: Piece[] =
        s.h > 0 ? [{ ...at, kind: 'round', x: s.x, y: s.y, z: s.z, w: s.size, d: s.size, h: s.h }] : [];
      return s.cap ? [...cyl, { ...at, kind: 'dome', x: s.x, y: s.y + s.h, z: s.z, w: 2, d: 2, h: 3 }] : cyl;
    }
    case 'technic':
      return [{ ...at, kind: 'brick', x: s.x, y: s.y, z: s.z, w: s.len, d: s.rows, h: 3 }];
    case 'halo':
      return [{ ...at, kind: 'uplate', x: s.x, y: s.y, z: s.z, w: s.len, d: s.wid, h: 1, rot: ROT[s.dir] }];
    case 'part':
      return [{ ...at, kind: s.part, x: s.x, y: s.y, z: s.z, w: s.w, d: s.d, h: s.h, rot: ROT[s.dir ?? 'x+'], ...(s.hand ? { hand: s.hand } : {}) }]; // prettier-ignore
    case 'wheel':
      return [{ ...at, kind: 'wheel', x: s.x, z: s.z, w: 0, d: s.width, h: 0, cy: s.cy, r: s.r }];
    case 'axle':
      return [{ ...at, kind: 'axle', x: s.x, z: s.z, w: 0, d: s.len, h: 0, cy: s.cy, r: 0.12 }];
  }
}

/** Light for plastic: a soft room for the sheen on studs and curves, a fill, and a key light from
 *  the front left. No shadow map: the pieces move during a build. */
export function legoLight(scene: Scene, renderer: WebGLRenderer, own: (d: () => void) => void): void {
  const pm = new PMREMGenerator(renderer);
  const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  pm.dispose();
  scene.environment = env;
  own(() => env.dispose());
  const white = new Color(hexOf('inkStrong'));
  scene.add(new AmbientLight(white, 0.55));
  const sun = new DirectionalLight(white, 1.5);
  sun.position.set(-20, 40, -30);
  scene.add(sun);
}

const plastic = (): MeshStandardMaterial => new MeshStandardMaterial({ roughness: 0.38, metalness: 0 });

/** The smooth isometric model: each shape one solid, no studs, no seams. */
export function smoothModel(shapes: Shape[], own: (d: () => void) => void): Group {
  const g = new Group();
  for (const p of shapes.flatMap(solidOf)) {
    for (const part of body(p, { studs: false, gap: 0 })) {
      const m = new Mesh(part.geo, plastic());
      m.material.color.set(hexOf(part.tone ? TONE[part.tone] : p.tone));
      m.applyMatrix4(placement(p));
      own(() => {
        part.geo.dispose();
        m.material.dispose();
      });
      g.add(m);
    }
  }
  return g;
}

/** The wireframe plan: the smooth model's hard edges as lines in one tone. */
export function wireModel(shapes: Shape[], tone: NightKey, own: (d: () => void) => void): Group {
  const g = new Group();
  const mat = new LineBasicMaterial({ color: hexOf(tone) });
  own(() => mat.dispose());
  for (const p of shapes.flatMap(solidOf)) {
    for (const part of body(p, { studs: false, gap: 0 })) {
      const e = new LineSegments(new EdgesGeometry(part.geo, 28), mat);
      e.applyMatrix4(placement(p));
      own(() => {
        e.geometry.dispose();
        part.geo.dispose();
      });
      g.add(e);
    }
  }
  return g;
}

export interface LegoModel {
  group: Group;
  /** Moves piece i up by `lift` world units, or hides it (null). Call `commit` after a pass. */
  place(i: number, lift: number | null): void;
  commit(): void;
}

/** The LEGO: every piece, instanced by its shape. */
export function legoModel(pieces: Piece[], own: (d: () => void) => void): LegoModel {
  const group = new Group();
  const shapes = new Map<string, { parts: Part[]; owners: number[] }>();
  pieces.forEach((p, i) => {
    const k = [p.kind, p.w, p.d, p.h, p.hand, p.cy, p.r].join('|');
    const e = shapes.get(k) ?? { parts: body(p), owners: [] };
    e.owners.push(i);
    shapes.set(k, e);
  });
  const slots: { mesh: InstancedMesh; n: number }[][] = pieces.map(() => []);
  const col = new Color();
  for (const { parts, owners } of shapes.values()) {
    for (const part of parts) {
      const mesh = new InstancedMesh(part.geo, plastic(), owners.length);
      owners.forEach((i, n) => {
        const p = pieces[i];
        if (!p) return;
        mesh.setMatrixAt(n, placement(p));
        mesh.setColorAt(n, col.set(hexOf(part.tone ? TONE[part.tone] : p.tone)));
        slots[i]?.push({ mesh, n });
      });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      own(() => {
        part.geo.dispose();
        mesh.material.dispose();
        mesh.dispose();
      });
      group.add(mesh);
    }
  }
  const hidden = new Matrix4().makeScale(0, 0, 0);
  const homes = pieces.map((p) => placement(p));
  const m = new Matrix4();
  const dirty = new Set<InstancedMesh>();
  return {
    group,
    place: (i, lift) => {
      const home = homes[i];
      if (!home) return;
      m.copy(lift === null ? hidden : home);
      if (lift !== null) m.elements[13] = (home.elements[13] ?? 0) + lift;
      for (const s of slots[i] ?? []) {
        s.mesh.setMatrixAt(s.n, m);
        dirty.add(s.mesh);
      }
    },
    commit: () => {
      for (const mesh of dirty) mesh.instanceMatrix.needsUpdate = true;
      dirty.clear();
    },
  };
}
