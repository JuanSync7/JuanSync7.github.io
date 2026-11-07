import { corners, finish, TableDraft, type Bounds, type PropModel } from './tableparts';
import type { TableTheme } from './tablethemes';
import { cabinet, legs } from './furnitureparts';
import { top, woodGrain } from './furnituretops';
import { homeDetails } from './furniturehome';
import { workDetails } from './furniturework';
import { ROOM_METRICS } from './roommetrics';

const CACHE = new Map<string, PropModel>();
export function tableModel(t: TableTheme): PropModel {
  const cached = CACHE.get(t.id);
  if (cached) return cached;
  const p = new TableDraft(),
    x = t.w / 2,
    z = t.d / 2,
    h = t.height;
  top(p, t);
  p.material('frame', () => {
    if (t.id === 'dining') {
      woodGrain(p, t);
      for (const a of [-1, 1])
        for (const b of [-1, 1]) p.rod([a * x * 0.58, -0.21, b * z * 0.52], [a * x * 0.7, -h, b * z * 0.64], 0.13);
    } else if (t.id === 'work') {
      cabinet(p, -x + 0.85, h, 1.3, t.d - 0.75);
      for (const a of [-1, 1]) p.box(x - 0.35, -h, a * (z - 0.35), 0.13, h - 0.2, 0.13, 0.015);
      p.box(0, -1.1, -z + 0.22, t.w - 0.5, 0.7, 0.08, 0.015);
      p.box(0, -0.36, 0, 2.3, 0.13, t.d - 0.65, 0.02);
    } else if (t.id === 'computer') {
      for (const a of [-1, 1]) {
        p.box(a * (x - 0.9), -h, 0, 0.65, 0.09, t.d - 0.3, 0.04);
        p.box(a * (x - 0.9), -h + 0.09, 0, 0.22, h * 0.53, 0.3, 0.025);
        p.rod([a * (x - 0.9), -0.5, -1.1], [a * (x - 0.9), -0.2, -1.9], 0.07);
      }
      p.box(0, -0.55, -z + 0.32, t.w - 1, 0.08, 0.5, 0.03);
      for (const a of [-1, 1]) p.ring(a * (x - 0.65), 0.004, -z + 0.45, 0.14);
    } else if (t.id === 'storage') {
      for (const a of [-1, 1]) cabinet(p, a * (x - 0.9), h, 1.5, t.d - 0.5);
      p.box(0, 0, -z + 0.07, t.w, 0.86, 0.1, 0.02);
      for (let i = 0; i < 12; i++)
        for (const y of [0.2, 0.45, 0.7])
          p.box(-x + 0.45 + (i * (t.w - 0.9)) / 11, y, -z + 0.126, 0.16, 0.035, 0.008, 0.008);
      p.box(0, -0.29, 0, t.w - 0.4, 0.08, t.d - 0.25, 0.02);
    } else if (t.id === 'messy') {
      woodGrain(p, t);
      for (const a of [-1, 1]) {
        for (const b of [-1, 1]) p.rod([a * x * 0.62, -0.2, b * 0.7], [a * x * 0.68, -h, b * (z - 0.2)], 0.11);
        p.box(a * x * 0.65, -h * 0.68, 0, 0.13, 0.09, t.d - 0.8, 0);
      }
      p.box(0, -0.65, 0, t.w * 0.68, 0.1, 0.1, 0.005);
    } else if (t.id === 'study') {
      legs(p, t);
      woodGrain(p, t);
      p.box(0, -0.47, 0, t.w - 0.7, 0.25, t.d - 0.5, 0.02);

      p.box(0, 0, -z + 0.05, t.w - 0.25, 1.05, 0.08, 0.015);
      for (const y of [0.4, 1.05]) p.box(0, y, -z + 0.25, t.w - 0.2, 0.06, 0.55, 0.015);
      for (const a of [-1, -0.34, 0.34, 1]) p.box(a * (x - 0.12), 0, -z + 0.25, 0.07, 1.1, 0.55, 0.01);
    } else if (t.id === 'kitchen') {
      p.box(0, -h, 0, t.w - 0.5, h - 0.2, t.d - 0.45, 0.04);
      p.box(0, 0, -z + 0.07, t.w, 0.48, 0.14, 0.015);
    } else if (t.id === 'bar') {
      for (const a of [-1, 1]) {
        p.cylinder(a * x * 0.58, -h, 0, 0.62, 0.09, 20);
        p.cylinder(a * x * 0.58, -h + 0.09, 0, 0.12, h - 0.28, 12);
      }

      p.box(0, 0, -z + 0.12, t.w - 0.2, 0.12, 0.24, 0.02);
    } else {
      legs(p, t, true);
      p.box(0, -h * 0.76, 0, t.w - 0.65, 0.06, t.d - 0.65, 0.015);
      for (const a of [-1, 1]) p.rod([a * (x - 0.35), -h + 0.1, -z + 0.35], [a * (x - 0.35), -0.2, z - 0.35], 0.045);
      p.box(0, 0, -z + 0.1, t.w, 0.31, 0.2, 0.015);
      for (const a of [-1, 1])
        for (let i = 0; i < 3; i++) p.box(a * (x - 0.8) + i * 0.17, 0.1, -z + 0.205, 0.08, 0.12, 0.008, 0.01);
      p.line(
        [
          [-2.6, 0.002, -1.6],
          [2.6, 0.002, -1.6],
          [2.6, 0.002, 1.6],
          [-2.6, 0.002, 1.6],
        ],
        true,
      );
    }
  });
  homeDetails(p, t);
  workDetails(p, t);
  const m = ROOM_METRICS[t.id];
  for (const surface of p.parts[0]?.surfaces ?? [])
    surface.points = surface.points.map(([x, y, z]) => [x * m.x, y > 0 ? y * 0.75 : y, z * m.z]);
  const result = finish(p);
  CACHE.set(t.id, result);
  return result;
}
/** The top may be oval or chamfered; its bounding rectangle alone is insufficient. */
export function surfaceContains(t: TableTheme, b: Bounds): boolean {
  const m = ROOM_METRICS[t.id];
  return corners(b).every(([worldX, , worldZ]) => {
    const x = worldX / m.x,
      z = worldZ / m.z;
    const hx = t.w / 2 - 0.08,
      hz = t.d / 2 - 0.08;
    if (Math.abs(x) > hx || Math.abs(z) > hz) return false;
    const rear = t.id === 'study' ? 0.7 : ['storage', 'kitchen', 'lab', 'bar'].includes(t.id) ? 0.3 : 0.08;
    if (z < -t.d / 2 + rear) return false;
    if (t.surface === 'oval') return (x / hx) ** 2 + (z / hz) ** 2 < 0.98;
    const cut = t.id === 'computer' ? 0.85 : t.surface === 'chamfer' ? 0.35 : 0;
    return z < hz - cut || Math.abs(x) < hx - (z - (hz - cut));
  });
}
