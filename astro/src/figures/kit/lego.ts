import { BoxGeometry, Color, CylinderGeometry, Group, InstancedMesh, Matrix4, MeshLambertMaterial } from 'three';
import { hexOf } from './ink';
import type { City } from './legocity';

/** The LEGO city as two instanced meshes (brick bodies and studs): a few draw calls for thousands
 *  of parts. Nothing but bricks is ever drawn. The base (layer 0: road tiles, pavements, block
 *  plates) is always there; each brick above it drops from a hand's height and clicks onto the
 *  studs below in its turn; the teardown lifts the bricks off again, last on first off, and the
 *  base stays where it is. */

export const BRICK_H = 0.62;
/** A plate is a third of a brick: the base is plates and tiles. */
export const PLATE_H = BRICK_H / 3;
const STUD_R = 0.27;
const STUD_H = 0.16;
const GAP = 0.965;
/** How far above its place a brick appears, and how long it takes to click on, in seconds. */
const DROP = 2.6;

/** Seconds: building, the finished city standing, taking it apart, the bare base. */
export const TIMELINE = { build: 54, hold: 6, tear: 14, rest: 3, press: 0.55, lift: 0.7 };
export const LOOP = TIMELINE.build + TIMELINE.hold + TIMELINE.tear + TIMELINE.rest;
/** A time in the loop at which the city stands finished. */
export const FINISHED = TIMELINE.build + TIMELINE.hold / 2;

export interface LegoSet {
  /** Shows the city at `u` seconds into the loop. */
  show(u: number): void;
}

const clamp = (x: number): number => Math.min(1, Math.max(0, x));
/** Bottom and height of a course: the base is one plate, every course above it a brick. */
const bottom = (layer: number): number => (layer === 0 ? 0 : PLATE_H + (layer - 1) * BRICK_H);
const height = (layer: number): number => (layer === 0 ? PLATE_H : BRICK_H);

/** Height above its place at `u`, or null while it is not on the table. */
function offset(order: number, u: number): number | null {
  const { build, hold, tear, press, lift } = TIMELINE;
  if (order === 0) return 0;
  if (u < build + hold) {
    const k = clamp((u - order * (build - press)) / press);
    if (k <= 0) return null;
    // Falls under gravity, then settles onto the studs.
    return (1 - k * k) * DROP;
  }
  const k = clamp((u - build - hold - (1 - order) * (tear - lift)) / lift);
  return k >= 1 ? null : k * k * DROP * 2.4;
}

export function cityMeshes(into: Group, city: City, onDispose: (d: () => void) => void): LegoSet {
  const { bricks } = city;
  const col = new Color();
  const body = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshLambertMaterial(), bricks.length);
  const studs = bricks.flatMap((b, i) => b.studs.map((s) => ({ i, ...s })));
  const nubs = new InstancedMesh(
    new CylinderGeometry(STUD_R, STUD_R, STUD_H, 12),
    new MeshLambertMaterial(),
    studs.length,
  );
  bricks.forEach((b, i) => body.setColorAt(i, col.set(hexOf(b.tone))));
  studs.forEach((s, n) => nubs.setColorAt(n, col.set(hexOf(bricks[s.i]?.tone ?? 'ink2'))));
  into.add(body, nubs);
  onDispose(() => [body, nubs].forEach((m) => m.dispose()));
  const m = new Matrix4();
  const hidden = new Matrix4().makeScale(0, 0, 0);
  const lift: (number | null)[] = bricks.map(() => 0);
  const show = (u: number): void => {
    bricks.forEach((b, i) => {
      const up = offset(b.order, u);
      lift[i] = up;
      if (up === null) return body.setMatrixAt(i, hidden);
      const h = height(b.layer);
      m.makeScale(b.w * GAP, h * (b.layer === 0 ? 1 : GAP), b.d * GAP);
      m.setPosition(b.x + b.w / 2, bottom(b.layer) + h / 2 + up, b.z + b.d / 2);
      body.setMatrixAt(i, m);
    });
    studs.forEach((s, n) => {
      const up = lift[s.i];
      const b = bricks[s.i];
      // A stud shows while its brick is on the table and nothing has been pressed onto it yet.
      const covered = s.cover >= 0 && lift[s.cover] === 0;
      if (!b || up === null || up === undefined || covered) return nubs.setMatrixAt(n, hidden);
      m.makeTranslation(b.x + s.at[0] + 0.5, bottom(b.layer) + height(b.layer) + STUD_H / 2 + up, b.z + s.at[1] + 0.5);
      nubs.setMatrixAt(n, m);
    });
    body.instanceMatrix.needsUpdate = true;
    nubs.instanceMatrix.needsUpdate = true;
  };
  return { show };
}
