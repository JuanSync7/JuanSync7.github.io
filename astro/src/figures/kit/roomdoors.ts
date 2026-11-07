import { TableDraft } from './tableparts';
import { framed } from './roomdecor';
import type { ThemeId } from './tablethemes';

export function roomDoor(p: TableDraft, floor: number, theme: ThemeId): void {
  const commercial = theme === 'lab' || theme === 'storage';
  framed(p, 0, floor, 1.85, 4.3, 0.12);
  p.material(commercial ? 'porcelain' : 'panel', () => p.box(0, floor + 0.08, 0.11, 1.58, 4.05, 0.05, 0.025));
  if (commercial || theme === 'work' || theme === 'computer') {
    p.material('metal', () => p.box(0, floor + 2.1, 0.17, 0.7, 1.35, 0.04, 0.025));
    p.material('glass', () => p.box(0, floor + 2.2, 0.195, 0.54, 1.15, 0.02, 0.015));
    p.material('metal', () => {
      p.box(0, floor + 0.12, 0.18, 1.43, 0.65, 0.035, 0.015);
      p.tube([-0.6, floor + 1.95, 0.25], [0.6, floor + 1.95, 0.25], 0.035, 8);
    });
  } else
    p.material('frame', () => {
      for (const y of [floor + 0.3, floor + 2.0]) p.box(0, y, 0.165, 1.3, 1.4, 0.025, 0.025);
    });
  p.material('metal', () => {
    p.box(0.5, floor + 1.82, 0.205, 0.14, 0.29, 0.025, 0.02);
    p.tube([0.48, floor + 1.95, 0.22], [0.72, floor + 1.95, 0.22], 0.035, 8);
    for (const y of [floor + 0.65, floor + 2.15, floor + 3.6]) p.box(-0.8, y, 0.15, 0.07, 0.19, 0.07, 0.01);
    p.box(0, floor + 4.12, 0.13, 1.72, 0.045, 0.1, 0.01);
  });
}
