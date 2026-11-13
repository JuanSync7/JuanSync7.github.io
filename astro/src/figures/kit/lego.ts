import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  MeshLambertMaterial,
  Quaternion,
  Vector3,
} from 'three';
import { hexOf } from './ink';
import { GRID, type City } from './legocity';

export const BRICK_H = 0.62;
const STUD_R = 0.27;
const STUD_H = 0.16;
const GAP = 0.965;

/** What the city shows at one moment. `model` 0..1 raises the smooth isometric model layer by
 *  layer; `swap` 0..1 turns it into LEGO in a wave across the plate; `teardown` 1..0 lifts the
 *  bricks away in the build order (1 = standing). */
export interface CityState {
  model: number;
  swap: number;
  teardown: number;
}
export interface LegoSet {
  show(s: CityState): void;
}

const tmp = new Matrix4();
const pos = new Vector3();
const scl = new Vector3();
const quat = new Quaternion();
const ease = (x: number): number => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

/** The city as three instanced meshes (smooth voxels, brick bodies, studs): a few draw calls for
 *  tens of thousands of parts. The smooth model is the plain isometric city; the bricks are the
 *  same city packed into LEGO. */
export function cityMeshes(into: Group, city: City, onDispose: (d: () => void) => void): LegoSet {
  const { bricks, voxels, layers } = city;
  const col = new Color();
  const smooth = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshLambertMaterial(), voxels.length);
  voxels.forEach((v, i) => smooth.setColorAt(i, col.set(hexOf(v.tone))));
  const body = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshLambertMaterial(), bricks.length);
  const owner: number[] = [];
  const cell: [number, number][] = [];
  bricks.forEach((b, i) => {
    body.setColorAt(i, col.set(hexOf(b.tone)));
    b.studs.forEach((s) => {
      owner.push(i);
      cell.push(s);
    });
  });
  const nubs = new InstancedMesh(
    new CylinderGeometry(STUD_R, STUD_R, STUD_H, 10),
    new MeshLambertMaterial(),
    owner.length,
  );
  owner.forEach((i, n) => nubs.setColorAt(n, col.set(hexOf(bricks[i]?.tone ?? 'ink2'))));
  into.add(smooth, body, nubs);
  onDispose(() => [smooth, body, nubs].forEach((m) => m.dispose()));
  const place = (
    m: InstancedMesh,
    i: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    k: number,
  ): void => {
    pos.set(x, y, z);
    scl.set(w * k, h * k, d * k);
    m.setMatrixAt(i, tmp.compose(pos, quat, scl));
  };
  const show = (s: CityState): void => {
    const smoothOn = s.swap < 1 && s.teardown >= 1;
    smooth.visible = smoothOn;
    if (smoothOn) {
      voxels.forEach((v, i) => {
        const up = ease(s.model * 1.5 * layers - v.layer * 1.2 - v.wave * 0.2 * layers);
        const gone = ease((s.swap * 1.7 - v.wave * 0.7) / 0.3);
        const k = Math.max(0, Math.min(up, 1 - gone));
        place(smooth, i, v.x + 0.5, (v.layer + 0.5) * BRICK_H, v.z + 0.5, 1, BRICK_H, 1, k > 0.001 ? k : 0);
      });
      smooth.instanceMatrix.needsUpdate = true;
    }
    const brickOn = s.swap > 0 || s.teardown < 1;
    body.visible = brickOn;
    nubs.visible = brickOn;
    if (!brickOn) return;
    const grow = bricks.map((b) => {
      if (s.teardown < 1) return ease((s.teardown - b.order * 0.78) / 0.22);
      return ease((s.swap * 1.7 - ((b.x + b.z) / (2 * GRID)) * 0.7) / 0.3);
    });
    const lift = (i: number): number => (s.teardown < 1 ? (1 - (grow[i] ?? 0)) * 6 : 0);
    bricks.forEach((b, i) => {
      const g = grow[i] ?? 0;
      place(
        body,
        i,
        b.x + b.w / 2,
        (b.layer + 0.5) * BRICK_H + lift(i),
        b.z + b.d / 2,
        b.w * GAP,
        BRICK_H * GAP,
        b.d * GAP,
        g > 0.001 ? 1 : 0,
      );
    });
    owner.forEach((i, n) => {
      const b = bricks[i];
      const c = cell[n];
      if (!b || !c) return;
      const g = grow[i] ?? 0;
      place(
        nubs,
        n,
        b.x + c[0] + 0.5,
        (b.layer + 1) * BRICK_H + STUD_H / 2 + lift(i),
        b.z + c[1] + 0.5,
        1,
        1,
        1,
        g > 0.001 ? 1 : 0,
      );
    });
    body.instanceMatrix.needsUpdate = true;
    nubs.instanceMatrix.needsUpdate = true;
  };
  return { show };
}
