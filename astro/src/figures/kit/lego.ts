import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  InstancedMesh,
  Matrix4,
  MeshLambertMaterial,
  Quaternion,
  Vector3,
  type Scene,
} from 'three';
import { hexOf } from './ink';
import type { NightKey } from '../../styles/tokens/palette';

/** A LEGO brick: its footprint in studs (w by d), its layer, and the tone it is moulded in.
 *  `order` is when it clicks on during the build, 0..1; the teardown runs the same order backwards. */
export interface Brick {
  x: number;
  z: number;
  w: number;
  d: number;
  layer: number;
  tone: NightKey;
  order: number;
}

export const BRICK_H = 0.62;
const STUD_R = 0.27;
const STUD_H = 0.16;

interface Build {
  x: number;
  z: number;
  w: number;
  d: number;
  from: number;
  to: number;
  tone: NightKey;
  /** The top floor in another tone. */
  cap?: NightKey;
}

/** A small city that reads as one: a stepped skyscraper with a spire at the heart, a second
 *  tower with an aerial, a block with a water tank, a church with a nave, a tower and a steeple,
 *  rows of houses with gable roofs, and trees on the park corner. Footprints are in studs on the
 *  plate (-7 to 7); each building rises floor by floor. */
const CITY: Build[] = [
  { x: -1, z: -1, w: 3, d: 3, from: 0, to: 6, tone: 'ink2' },
  { x: 0, z: 0, w: 1, d: 1, from: 7, to: 11, tone: 'inkSoft', cap: 'signal' },
  { x: -6, z: -1, w: 2, d: 2, from: 0, to: 8, tone: 'inkSoft' },
  { x: -6, z: -1, w: 1, d: 1, from: 9, to: 10, tone: 'inkMuted', cap: 'signal' },
  { x: 4, z: -5, w: 2, d: 3, from: 0, to: 5, tone: 'inkMuted' },
  { x: 4, z: -5, w: 1, d: 1, from: 6, to: 7, tone: 'ink2' },
  { x: 4, z: -1, w: 2, d: 2, from: 0, to: 3, tone: 'ink2' },
  { x: -6, z: -6, w: 2, d: 4, from: 0, to: 2, tone: 'inkSoft' },
  { x: -6, z: -6, w: 2, d: 2, from: 3, to: 6, tone: 'inkSoft' },
  { x: -6, z: -6, w: 1, d: 1, from: 7, to: 9, tone: 'ink2', cap: 'signal' },
  { x: -2, z: -6, w: 2, d: 2, from: 0, to: 3, tone: 'inkMuted' },
  { x: 1, z: -6, w: 2, d: 2, from: 0, to: 4, tone: 'inkSoft' },
  ...[1, 3, 5].flatMap((x): Build[] => [
    { x, z: 3, w: 2, d: 2, from: 0, to: 1, tone: 'ink2' },
    { x, z: 3, w: 2, d: 1, from: 2, to: 2, tone: 'line4', cap: 'signal' },
    { x, z: 5, w: 2, d: 2, from: 0, to: 1, tone: 'inkSoft' },
    { x, z: 5, w: 2, d: 1, from: 2, to: 2, tone: 'line4' },
  ]),
  ...[-6, -3].flatMap((x): Build[] => [
    { x: x + 1, z: 5, w: 1, d: 1, from: 0, to: 1, tone: 'line4' },
    { x, z: 4, w: 3, d: 3, from: 2, to: 3, tone: 'inkMuted' },
  ]),
];

export function legoCity(): Brick[] {
  const out: Brick[] = [];
  for (const b of CITY) {
    for (let k = b.from; k <= b.to; k++) {
      out.push({ x: b.x, z: b.z, w: b.w, d: b.d, layer: k, tone: b.cap && k === b.to ? b.cap : b.tone, order: 0 });
    }
  }
  // A wave across the plate from the front corner, floors rising as it passes.
  const maxLayer = Math.max(...out.map((b) => b.layer));
  for (const b of out) {
    const wave = (b.x + b.z + 14) / 28;
    b.order = Math.min(1, (1 - wave) * 0.4 + (b.layer / (maxLayer + 1)) * 0.6);
  }
  return out;
}

export interface LegoSet {
  bricks: Brick[];
  /** Position every brick for a build progress 0..1 (0 empty plate, 1 complete). */
  set(progress: number): void;
}

const tmp = new Matrix4();
const pos = new Vector3();
const scl = new Vector3();
const quat = new Quaternion();

/** Draws the bricks as two instanced meshes, bodies and studs, so a few hundred bricks cost
 *  two draw calls. A brick falls in from above as its turn comes and leaves the same way. */
export function brickMeshes(scene: Scene, bricks: Brick[], onDispose: (d: () => void) => void): LegoSet {
  const studs = bricks.reduce((n, b) => n + b.w * b.d, 0);
  const body = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshLambertMaterial(), bricks.length);
  const nubs = new InstancedMesh(new CylinderGeometry(STUD_R, STUD_R, STUD_H, 12), new MeshLambertMaterial(), studs);
  const col = new Color();
  const owner: number[] = [];
  const cell: [number, number][] = [];
  bricks.forEach((b, i) => {
    body.setColorAt(i, col.set(hexOf(b.tone)));
    for (let a = 0; a < b.w; a++) {
      for (let c = 0; c < b.d; c++) {
        nubs.setColorAt(owner.length, col.set(hexOf(b.tone)));
        owner.push(i);
        cell.push([a + 0.5, c + 0.5]);
      }
    }
  });
  scene.add(body, nubs);
  onDispose(() => {
    body.dispose();
    nubs.dispose();
  });
  const GAP = 0.965;
  const set = (progress: number): void => {
    const state = bricks.map((b) => {
      // Each brick has a short window of the build to fall into place.
      const local = Math.min(1, Math.max(0, (progress - b.order * 0.78) / 0.22));
      return local * local * (3 - 2 * local);
    });
    bricks.forEach((b, i) => {
      const s = state[i] ?? 0;
      const y = (b.layer + 0.5) * BRICK_H + (1 - s) * 5;
      const k = s > 0.001 ? 1 : 0;
      pos.set(b.x + b.w / 2, y, b.z + b.d / 2);
      scl.set(b.w * GAP * k, BRICK_H * GAP * k, b.d * GAP * k);
      body.setMatrixAt(i, tmp.compose(pos, quat, scl));
    });
    owner.forEach((i, n) => {
      const b = bricks[i];
      const c = cell[n];
      if (!b || !c) return;
      const s = state[i] ?? 0;
      const k = s > 0.001 ? 1 : 0;
      pos.set(b.x + c[0], (b.layer + 1) * BRICK_H + STUD_H / 2 + (1 - s) * 5, b.z + c[1]);
      scl.set(k, k, k);
      nubs.setMatrixAt(n, tmp.compose(pos, quat, scl));
    });
    body.instanceMatrix.needsUpdate = true;
    nubs.instanceMatrix.needsUpdate = true;
  };
  return { bricks, set };
}
