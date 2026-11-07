import type { Vec3 } from './camera';
import type { RoomView } from './roomview';

/** Near-plane clipping matters at the entrance corners, where the camera meets a wall. */
export function roomClip(view: RoomView, points: readonly Vec3[], face: boolean): Vec3[] {
  if (!Number.isFinite(view.projection.dist)) return [...points];
  const { yaw, pitch, dist } = view.projection;
  const depth = (q: Vec3): number =>
    dist -
    ((q[0] - view.target[0]) * Math.sin(yaw) + (q[2] - view.target[2]) * Math.cos(yaw)) * Math.cos(pitch) -
    (q[1] - view.target[1]) * Math.sin(pitch) -
    0.15;
  const output: Vec3[] = [];
  let a = points[face ? points.length - 1 : 0];
  if (!a) return output;
  let da = depth(a);
  if (!face && da >= 0) output.push(a);
  for (const b of points.slice(face ? 0 : 1)) {
    const db = depth(b);
    if (da >= 0 !== db >= 0) {
      const t = da / (da - db);
      output.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
    }
    if (db >= 0) output.push(b);
    a = b;
    da = db;
  }
  return output;
}
