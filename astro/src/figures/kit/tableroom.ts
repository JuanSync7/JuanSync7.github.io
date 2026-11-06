import type { Vec3 } from './camera';
import { finish, TableDraft, type PropModel } from './tableparts';
import { roomPlan, type RoomPlan, type RoomSide } from './roomplan';
import { roomFloor } from './roomfloor';
import { backFeature } from './roomfixtures';
import { door, windowFrame } from './roomdecor';
import type { TableScene } from './tabletop';

export interface RoomPart {
  label: string;
  side: RoomSide;
  interactive: boolean;
  model: PropModel;
  cutaway?: boolean;
}
const CACHE = new Map<string, RoomPart[]>();
export function roomModels(p: TableScene): RoomPart[] {
  const key = `${p.theme.id}:${p.roomVariant}`,
    cached = CACHE.get(key);
  if (cached) return cached;
  const r = roomPlan(p),
    parts: RoomPart[] = [];
  const add = (
    label: string,
    side: RoomSide,
    build: (draft: TableDraft) => void,
    interactive = false,
    transform?: (point: Vec3) => Vec3,
  ): void => {
    const q = new TableDraft();
    q.material('frame', () => build(q));
    if (transform) for (const part of q.parts) for (const s of part.surfaces) s.points = s.points.map(transform);
    parts.push({ label, side, interactive, model: finish(q) });
  };
  add('Floor', 'floor', (q) => roomFloor(q, r, p.theme.id));
  add('Back wall', 'back', (q) => backWall(q, r, p.theme.id));
  for (const side of ['left', 'right'] as const) {
    const sign = side === 'left' ? -1 : 1;
    add(`${side} wall`, side, (q) => {
      q.material('wall', () =>
        q.box(sign * (r.half + 0.08), r.floor, (r.back + r.front) / 2, 0.16, r.top - r.floor, r.front - r.back, 0),
      );
      q.material('frame', () => {
        q.box(sign * r.half, r.floor, (r.back + r.front) / 2, 0.065, 0.18, r.front - r.back, 0.01);
        q.box(sign * r.half, r.top - 0.12, (r.back + r.front) / 2, 0.1, 0.12, r.front - r.back, 0.015);
      });
    });
    add(`${side} cutaway wall`, side, (q) => {
      q.material('wall', () =>
        q.box(sign * (r.half + 0.08), r.floor, (r.back + r.front) / 2, 0.16, 0.5, r.front - r.back, 0),
      );
      q.material('frame', () =>
        q.box(sign * (r.half + 0.08), r.floor + 0.5, (r.back + r.front) / 2, 0.2, 0.045, r.front - r.back, 0.012),
      );
    });
    const cutaway = parts[parts.length - 1];
    if (cutaway) cutaway.cutaway = true;
  }
  for (const slot of [0, 1, 2] as const) {
    const feature = new TableDraft(),
      label = backFeature(feature, p.theme.id, r.variant, slot);
    if (label)
      add(
        label,
        'back',
        (q) => {
          for (const s of finish(feature).surfaces) q.parts[0]?.surfaces.push(s);
        },
        true,
        ([x, y, z]) => [x, y, r.back + z],
      );
  }
  add('Recessed window', 'left', windowFrame, true, ([x, y, z]) => [-r.half + z, y, r.back + 2 + x]);
  add(
    'Panelled door',
    'right',
    (q) => door(q, r.floor),
    true,
    ([x, y, z]) => [r.half - z, y, r.front - 1.25 + x],
  );
  CACHE.set(key, parts);
  return parts;
}
function backWall(p: TableDraft, r: RoomPlan, theme: string): void {
  const textured = theme === 'kitchen' || theme === 'messy';
  p.material('wall', () =>
    p.box(0, r.floor, r.back - (textured ? 0.11 : 0.08), 2 * r.half + 0.32, r.top - r.floor, textured ? 0.1 : 0.16, 0),
  );
  if (textured) {
    const width = theme === 'kitchen' ? 0.9 : 1.2,
      height = theme === 'kitchen' ? 0.45 : 0.34;
    const limit = theme === 'kitchen' ? 1.6 : r.top;
    for (let row = 0; r.floor + row * height < limit; row++) {
      const shift = row % 2 ? width / 2 : 0;
      for (let x = -r.half - shift; x < r.half; x += width) {
        const lo = Math.max(-r.half, x),
          hi = Math.min(r.half, x + width),
          y = r.floor + row * height;
        if (hi - lo > 0.04)
          p.material(row % 4 ? 'wall' : 'tile', () =>
            p.box((lo + hi) / 2, y, r.back - 0.028, hi - lo - 0.025, Math.min(height - 0.025, limit - y), 0.056, 0.008),
          );
      }
    }
  }
  p.material('frame', () => {
    p.box(0, r.floor, r.back + 0.025, 2 * r.half, 0.18, 0.05, 0.01);
    p.box(0, r.top - 0.12, r.back + 0.015, 2 * r.half, 0.12, 0.1, 0.01);
  });
}
