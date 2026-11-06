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
export function windowDetails(p: TableDraft, floor: number, home: boolean): void {
  p.material('metal', () => {
    p.tube([-1.5, 3.35, 0.25], [1.5, 3.35, 0.25], 0.025);
    for (const x of [-1.4, 1.4]) p.tube([x, 3.35, 0.02], [x, 3.35, 0.25], 0.035);
  });
  p.material(home ? 'shade' : 'frame', () => {
    if (home)
      for (const sign of [-1, 1])
        for (let i = 0; i < 4; i++) p.box(sign * (1.17 + i * 0.095), 0.9, 0.2 + (i % 2) * 0.045, 0.12, 2.4, 0.12, 0.04);
    else for (let i = 0; i < 7; i++) p.box(0, 2.55 + i * 0.07, 0.17, 2.2, 0.025, 0.16, 0.005);
  });
  p.material('metal', () => {
    p.box(0, floor + 0.28, 0.2, 1.85, 0.04, 0.28, 0.02);
    p.box(0, floor + 1.0, 0.2, 1.85, 0.04, 0.28, 0.02);
    for (let i = 0; i < 12; i++) p.box(-0.8 + i * 0.145, floor + 0.31, 0.2, 0.07, 0.68, 0.22, 0.025);
    p.tube([0.95, floor + 0.1, 0.22], [0.95, floor + 0.8, 0.22], 0.025, 8);
    p.cylinder(0.95, floor + 0.8, 0.22, 0.06, 0.08, 8);
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
