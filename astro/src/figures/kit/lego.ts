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

/** A LEGO brick: its footprint in studs (w by d), its layer, and the tone it is moulded in.
 *  `order` is when it clicks on during the build, 0..1; the teardown runs the same order backwards. */
import type { Brick } from './legocity';

export const BRICK_H = 0.62;
const STUD_R = 0.27;
const STUD_H = 0.16;

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
