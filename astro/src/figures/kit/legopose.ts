// One source: JuanSync7/frontend-kit, bricks/src (@juansync7/bricks). A project's copy is synced from it, never edited.
import { PLATE, turn, type Piece } from './legoset.ts';

/** Sub-assemblies: a part of a model built on its own grid (studs up, as usual) and then fixed to
 *  the model sideways, on a bracket's side studs, or at an angle, on a hinge. A pose maps the
 *  sub-assembly's grid (studs, y in studs) into its parent's: world = r · local + o. Pure. */

export type V3 = [number, number, number];
export interface Pose {
  /** Rotation, row-major 3 x 3. */
  r: number[];
  o: V3;
}
export const IDENTITY: Pose = { r: [1, 0, 0, 0, 1, 0, 0, 0, 1], o: [0, 0, 0] };

export const rotate = (q: Pose, [x, y, z]: V3): V3 => {
  const r = q.r;
  return [0, 1, 2].map((i) => (r[3 * i] ?? 0) * x + (r[3 * i + 1] ?? 0) * y + (r[3 * i + 2] ?? 0) * z) as V3;
};
export const apply = (q: Pose | undefined, v: V3): V3 => {
  if (!q) return v;
  const [x, y, z] = rotate(q, v);
  return [x + q.o[0], y + q.o[1], z + q.o[2]];
};
/** The height of a piece's corner in the model, in plates: the order a builder works up in. */
export const PLATE_Y = (p: Piece): number => apply(p.pose, [p.x, p.y * PLATE, p.z])[1] / PLATE;

/** `a` after `b`: a sub-assembly (b) inside a sub-assembly (a). */
export function compose(a: Pose, b: Pose | undefined): Pose {
  if (!b) return a;
  const col = (k: number): V3 => rotate(a, [b.r[k] ?? 0, b.r[k + 3] ?? 0, b.r[k + 6] ?? 0]);
  const [c0, c1, c2] = [col(0), col(1), col(2)];
  return { r: [0, 1, 2].flatMap((i) => [c0[i] ?? 0, c1[i] ?? 0, c2[i] ?? 0]), o: apply(a, b.o) };
}
/** The pose mirrored across z = width / 2, for a sub-assembly whose own shapes are mirrored
 *  across their z = 0. */
export function mirrorPose(q: Pose, width: number): Pose {
  const s = [1, 1, -1];
  return {
    r: q.r.map((v, k) => v * (s[Math.floor(k / 3)] ?? 1) * (s[k % 3] ?? 1)),
    o: [q.o[0], q.o[1], width - q.o[2]],
  };
}

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const frame = (ex: V3, ey: V3, ez: V3, o: V3): Pose => ({ r: [ex[0], ey[0], ez[0], ex[1], ey[1], ez[1], ex[2], ey[2], ez[2]], o }); // prettier-ignore
/** A point of a piece's own frame (u along its w, v along its d, y in studs) on its grid. */
export const local = (p: Piece, u: number, y: number, v: number): V3 => {
  const [x, z] = turn(p, u, v);
  return [x, p.y * PLATE + y, z];
};

/** The flange of a bracket stands just outside the front edge of its base (local v = 0), half a
 *  plate thick (as the real 99780, 99207 and 3956 are), `flange` studs tall from the base's bottom
 *  (1 unless the piece says), a row of studs facing out (local -z) centred in each stud of height. */
export const flangeOf = (p: Piece): number => p.flange ?? 1;
export const FLANGE_T = PLATE / 2;

/** The frame of a sub-assembly fixed to the side studs of bracket `b`: its own studs-up face
 *  pointing out of the flange, its rows going up the flange (or down, `down`). Its first row of
 *  sockets sits on the flange's studs. */
export function onSide(b: Piece, down = false): Pose {
  const a0 = local(b, 0, 0, -FLANGE_T);
  const a = sub(local(b, 1, 0, -FLANGE_T), a0);
  const n = sub(local(b, 0, 0, -FLANGE_T - 1), a0);
  const ex: V3 = down ? [-a[0], -a[1], -a[2]] : a;
  const ez = cross(ex, n);
  const o: V3 = down ? local(b, b.w, flangeOf(b), -FLANGE_T) : a0;
  return frame(ex, n, ez, o);
}

/** A hinge plate's knuckle, as the real click hinges 60471 and 44567 have it: its axis along the
 *  plate's far side (local v = d), half a stud out from it and three quarters of a plate up, the
 *  fingers 0.3 of a stud round it. Two halves turned to face each other share one axis, their
 *  plates a stud apart when flat. */
export const KNUCKLE_Y = 0.75 * PLATE;
export const KNUCKLE_OUT = 0.5;
export const KNUCKLE_R = 0.3;

/** The frame of a sub-assembly hung on hinge plate `h`, turned up by `angle` radians about the
 *  knuckle: its root is a hinge plate at its own (0, 0, 0) facing x- (its knuckle's axis at its
 *  z = -KNUCKLE_OUT). */
export function onHinge(h: Piece, angle: number): Pose {
  const a0 = local(h, 0, KNUCKLE_Y, h.d + KNUCKLE_OUT);
  const a = sub(local(h, 1, KNUCKLE_Y, h.d + KNUCKLE_OUT), a0);
  const n = sub(local(h, 0, KNUCKLE_Y, h.d + KNUCKLE_OUT + 1), a0);
  const [c, s] = [Math.cos(angle), Math.sin(angle)];
  const ez: V3 = [c * n[0], c * n[1] + s, c * n[2]];
  const ey = cross(ez, a);
  const o = [0, 1, 2].map((k) => (a0[k] ?? 0) - (ey[k] ?? 0) * KNUCKLE_Y + (ez[k] ?? 0) * KNUCKLE_OUT) as V3;
  return frame(a, ey, ez, o);
}

/** A row of hinges `w` long as real click hinges: one 2 x 1 every two studs, all on one axis. */
export function hingeRow(one: Piece): Piece[] {
  if (one.w % 2) throw new Error(`lego: a hinge row ${one.w} long is not whole 2 x 1 hinges`);
  const [ox, oz] = turn({ ...one, x: 0, z: 0, w: 2 }, 0, 0);
  return Array.from({ length: one.w / 2 }, (_, k) => {
    const [x, z] = turn(one, 2 * k, 0);
    return { ...one, w: 2, x: x - ox, z: z - oz };
  });
}
