import { TableDraft } from './tableparts';
import type { RoomPlan } from './roomplan';
import type { ThemeId } from './tablethemes';

export function windowOpening(r: RoomPlan, theme: ThemeId): { lo: number; hi: number; bottom: number; top: number } {
  const high = theme === 'lab' || theme === 'storage',
    w = high ? 3 : 2.65,
    h = high ? 1.3 : 2.45;
  const bottom = r.floor + (high ? 3.95 : 2.5);
  return { lo: r.windowZ - w / 2 + 0.08, hi: r.windowZ + w / 2 - 0.08, bottom: bottom + 0.08, top: bottom + h - 0.08 };
}
/** Four wall sections surround an actual casement opening; the frame covers the joints. */
export function roomWallShell(q: TableDraft, r: RoomPlan, theme: ThemeId, sign: number): void {
  const x = sign * (r.half + 0.08);
  q.material('wall', () => {
    if (sign > 0 || theme === 'bar')
      q.box(x, r.floor, (r.back + r.front) / 2, 0.16, r.top - r.floor, r.front - r.back, 0);
    else {
      const o = windowOpening(r, theme);
      q.box(x, r.floor, (r.back + o.lo) / 2, 0.16, r.top - r.floor, o.lo - r.back, 0);
      q.box(x, r.floor, (o.hi + r.front) / 2, 0.16, r.top - r.floor, r.front - o.hi, 0);
      q.box(x, r.floor, (o.lo + o.hi) / 2, 0.16, o.bottom - r.floor, o.hi - o.lo, 0);
      q.box(x, o.top, (o.lo + o.hi) / 2, 0.16, r.top - o.top, o.hi - o.lo, 0);
    }
  });
}
