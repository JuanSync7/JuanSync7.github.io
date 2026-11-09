import type { Vec3 } from './camera';
import type { TableScene } from './tabletop';
import { roomLightPlan, type RoomLightPlan } from './roomlightplan';
import { roomPlan, type RoomPlan } from './roomplan';

/** Signed diffuse lighting: opposing faces must not receive identical absolute-dot light. */
export function roomFaceLight(
  p: TableScene,
  points: readonly Vec3[],
  plan: RoomLightPlan = roomLightPlan(p),
  r: RoomPlan = roomPlan(p),
): number {
  const [a, b, c] = points;
  if (!a || !b || !c) return 0.5;
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
    v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]],
    center = [0, 1, 2].map((axis) => points.reduce((s, q) => s + q[axis], 0) / points.length),
    l = plan.key.map((q, i) => q - center[i]);
  const diffuse = Math.max(0, (n[0] * l[0] + n[1] * l[1] + n[2] * l[2]) / (Math.hypot(...n) * Math.hypot(...l) || 1));
  const height = (center[1] - r.floor) / (r.top - r.floor),
    depth = (center[2] - r.back) / (r.front - r.back);
  return Math.max(0.2, Math.min(1.1, 0.26 + diffuse * 0.65 + height * 0.1 + (1 - depth) * 0.06));
}
