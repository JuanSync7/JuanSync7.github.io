import {
  AmbientLight,
  type BufferGeometry,
  CylinderGeometry,
  Color,
  DirectionalLight,
  PMREMGenerator,
  type Scene,
  type WebGLRenderer,
  Group,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { NightKey } from '../../styles/tokens/palette';
import { hexOf } from './ink';
import { body, GAP, STUD_H, STUD_R, type Part } from './legomesh';
import { jointsOf, spot } from './legojoint';
import { apply, type Pose, type V3 } from './legopose';
import { PLATE, studsOf, turn, type Piece } from './legoset';

/** Three ways to draw one LEGO model: the wireframe plan and the smooth isometric model (one
 *  solid per shape), and the LEGO itself (one instanced mesh per piece shape, so a model of
 *  hundreds of pieces is a few dozen draw calls, each piece movable for the build). */

export const TONE: Record<NonNullable<Part['tone']>, NightKey> = { rim: 'inkSoft', dark: 'line2' };
const ANGLE: Record<Piece['rot'], number> = { 0: 0, 1: -Math.PI / 2, 2: Math.PI, 3: Math.PI / 2 };

/** A sub-assembly's pose as a matrix. */
const poseMatrix = (q: Pose): Matrix4 =>
  new Matrix4().set(...(q.r.slice(0, 3) as V3), q.o[0], ...(q.r.slice(3, 6) as V3), q.o[1], ...(q.r.slice(6, 9) as V3), q.o[2], 0, 0, 0, 1); // prettier-ignore

/** Where a piece's own frame sits in the model (on its grid, then where its sub-assembly sits). */
export function placement(p: Piece, lift = 0): Matrix4 {
  const [x, z] = p.kind === 'wheel' || p.kind === 'axle' ? [p.x, p.z] : turn(p, 0, 0);
  const m = new Matrix4().makeRotationY(ANGLE[p.rot]).setPosition(x, p.y * PLATE, z);
  if (p.pose) m.premultiply(poseMatrix(p.pose));
  m.elements[13] = (m.elements[13] ?? 0) + lift;
  return m;
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

export const plastic = (): MeshStandardMaterial => new MeshStandardMaterial({ roughness: 0.38, metalness: 0 });

export interface LegoModel {
  group: Group;
  /** Moves piece i up by `lift` world units, or hides it (null). Call `commit` after a pass. */
  place(i: number, lift: number | null): void;
  commit(): void;
}

/** The LEGO: every piece's body instanced by its shape, and every stud one instance of a single
 *  stud mesh, so a stud shows only while its piece is on the table and nothing has been pressed
 *  onto it yet (a few hundred thousand covered studs are never drawn as triangles). */
/** `under`: draw each piece's real underside (walls, tubes, pins). Worth it where pieces are seen
 *  from below or lifted off; a large static model (the city) leaves it out to stay light. */
export function legoModel(pieces: Piece[], own: (d: () => void) => void, under = false): LegoModel {
  const group = new Group();
  const shapes = new Map<string, { parts: Part[]; owners: number[] }>();
  const bodyOf = (p: Piece): Part[] => body(p, { studs: false, gap: GAP, under });
  pieces.forEach((p, i) => {
    const k = [p.kind, p.w, p.d, p.h, p.hand, p.cy, p.r].join('|');
    const e = shapes.get(k) ?? { parts: bodyOf(p), owners: [] };
    e.owners.push(i);
    shapes.set(k, e);
  });
  const slots: { mesh: InstancedMesh; n: number }[][] = pieces.map(() => []);
  const col = new Color();
  const add = (geo: BufferGeometry, count: number): InstancedMesh => {
    const mesh = new InstancedMesh(geo, plastic(), count);
    own(() => {
      geo.dispose();
      mesh.material.dispose();
      mesh.dispose();
    });
    group.add(mesh);
    return mesh;
  };
  for (const { parts, owners } of shapes.values()) {
    for (const part of parts) {
      const mesh = add(part.geo, owners.length);
      owners.forEach((i, n) => {
        const p = pieces[i];
        if (!p) return;
        mesh.setMatrixAt(n, placement(p));
        mesh.setColorAt(n, col.set(hexOf(part.tone ? TONE[part.tone] : p.tone)));
        slots[i]?.push({ mesh, n });
      });
    }
  }
  // Studs: where each stands, whose it is, and which piece will cover it (-1: none).
  const sockets = new Map<string, number>();
  pieces.forEach((p, i) => jointsOf(p).forEach((j) => j.kind === 'socket' && sockets.set(spot(j.at), i)));
  const studs: { owner: number; cover: number; home: Matrix4 }[] = [];
  pieces.forEach((p, i) => {
    const { at, top } = studsOf(p);
    const frame = p.pose ? poseMatrix(p.pose) : null;
    for (const [x, z] of at) {
      const v: V3 = [x + 0.5, top * PLATE, z + 0.5];
      const home = new Matrix4().makeTranslation(...v);
      if (frame) home.premultiply(frame);
      studs.push({ owner: i, cover: sockets.get(spot(apply(p.pose, v))) ?? -1, home });
    }
  });
  const nub = new CylinderGeometry(STUD_R, STUD_R, STUD_H, 16).translate(0, STUD_H / 2, 0);
  const nubs = add(nub, studs.length);
  const ofOwner: number[][] = pieces.map(() => []);
  studs.forEach((s, n) => {
    nubs.setColorAt(n, col.set(hexOf(pieces[s.owner]?.tone ?? 'ink2')));
    ofOwner[s.owner]?.push(n);
  });
  const coverOf: number[][] = pieces.map(() => []);
  studs.forEach((s, n) => s.cover >= 0 && coverOf[s.cover]?.push(n));
  const hidden = new Matrix4().makeScale(0, 0, 0);
  const homes = pieces.map((p) => placement(p));
  const lifts: (number | null | undefined)[] = pieces.map(() => undefined);
  const m = new Matrix4();
  const dirty = new Set<InstancedMesh>();
  const touched = new Set<number>();
  const api: LegoModel = {
    group,
    place: (i, lift) => {
      const home = homes[i];
      if (!home || lifts[i] === lift) return;
      lifts[i] = lift;
      m.copy(lift === null ? hidden : home);
      if (lift !== null) m.elements[13] = (home.elements[13] ?? 0) + lift;
      for (const s of slots[i] ?? []) {
        s.mesh.setMatrixAt(s.n, m);
        dirty.add(s.mesh);
      }
      for (const n of ofOwner[i] ?? []) touched.add(n);
      for (const n of coverOf[i] ?? []) touched.add(n);
    },
    commit: () => {
      for (const n of touched) {
        const s = studs[n];
        if (!s) continue;
        const up = lifts[s.owner];
        const covered = s.cover >= 0 && lifts[s.cover] === 0;
        if (up === null || up === undefined || covered) nubs.setMatrixAt(n, hidden);
        else {
          m.copy(s.home);
          m.elements[13] = (m.elements[13] ?? 0) + up;
          nubs.setMatrixAt(n, m);
        }
      }
      if (touched.size) dirty.add(nubs);
      touched.clear();
      for (const mesh of dirty) mesh.instanceMatrix.needsUpdate = true;
      dirty.clear();
    },
  };
  // Every piece starts in place, its studs showing where nothing covers them.
  pieces.forEach((_, i) => api.place(i, 0));
  api.commit();
  return api;
}
