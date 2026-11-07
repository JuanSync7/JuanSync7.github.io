import { TableDraft } from './tableparts';
import type { RoomPlan } from './roomplan';
import type { ThemeId } from './tablethemes';

export function sideMoulding(p: TableDraft, r: RoomPlan, theme: ThemeId, sign: number): void {
  const panelled = ['dining', 'study', 'bar'].includes(theme);
  p.material('frame', () => {
    p.box(sign * (r.half - 0.015), r.floor + 0.18, (r.back + r.front) / 2, 0.065, 0.035, r.front - r.back, 0.008);
    for (const z of [r.back + 0.07, r.front - 0.05])
      p.box(sign * (r.half - 0.015), r.floor + 0.19, z, 0.085, r.top - r.floor - 0.31, 0.1, 0.015);
    if (panelled) {
      p.box(sign * (r.half - 0.025), r.floor + 1.15, (r.back + r.front) / 2, 0.07, 0.065, r.front - r.back, 0.012);
      for (let z = r.back + 0.2; z < r.front - 0.15; z += 1.2) {
        p.box(sign * (r.half - 0.035), r.floor + 0.3, z, 0.055, 0.72, 0.045, 0.008);
        p.box(sign * (r.half - 0.035), r.floor + 0.3, z + 0.5, 0.055, 0.04, 1.0, 0.008);
        p.box(sign * (r.half - 0.035), r.floor + 0.98, z + 0.5, 0.055, 0.04, 1.0, 0.008);
      }
    }
  });
}
export function wallSwitch(p: TableDraft, floor: number): void {
  p.material('panel', () => {
    p.box(0, floor + 2.0, 0.04, 0.19, 0.28, 0.055, 0.015);
    p.box(0, floor + 2.06, 0.08, 0.11, 0.15, 0.035, 0.012);
  });
  p.material('recess', () => {
    for (const y of [floor + 2.025, floor + 2.25]) p.box(0, y, 0.073, 0.015, 0.015, 0.01, 0.003);
  });
}
