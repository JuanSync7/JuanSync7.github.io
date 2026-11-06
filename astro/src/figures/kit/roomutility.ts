import { TableDraft } from './tableparts';
import { accessory } from './roomdecor';
import type { ThemeId } from './tablethemes';

export function utilityStorage(p: TableDraft, theme: ThemeId, variant: number): void {
  if (theme === 'lab') {
    p.material('panel', () => {
      for (const x of [-0.23, 0.23])
        p.lathe(
          [
            [0, 0],
            [0.17, 0],
            [0.19, 0.1],
            [0.19, 1.7],
            [0.13, 1.86],
            [0.045, 1.92],
            [0.045, 2.02],
            [0, 2.02],
          ],
          x,
          0,
          12,
        );
    });
    p.material('metal', () => {
      p.box(0, 0.2, -0.23, 0.75, 0.065, 0.1, 0.012);
      p.box(0, 1.28, -0.23, 0.75, 0.065, 0.1, 0.012);
      for (const x of [-0.23, 0.23]) {
        p.tube([x, 2.02, 0], [x, 2.15, 0], 0.03, 8);
        p.tube([x - 0.09, 2.15, 0], [x + 0.09, 2.15, 0], 0.02, 8);
        p.tube([x, 1.99, 0], [x, 1.99, 0.13], 0.03, 8);
        p.tube([x, 1.99, 0.14], [x, 1.99, 0.19], 0.07, 12);
      }
    });
    p.material('recess', () => {
      for (const x of [-0.23, 0.23]) p.tube([x, 1.99, 0.191], [x, 1.99, 0.2], 0.052, 12);
    });
    return;
  }
  p.material('frame', () => {
    accessory(p, 'box', 0, 0, 0, 1.05);
    accessory(p, 'box', variant === 1 ? 0.06 : -0.04, 0.651, 0, 0.9);
    accessory(p, 'box', 0, 1.209, 0, 0.72);
  });
}
export function pedalBin(p: TableDraft): void {
  p.material('panel', () =>
    p.lathe(
      [
        [0, 0],
        [0.3, 0],
        [0.35, 0.1],
        [0.35, 1.05],
        [0.32, 1.1],
        [0, 1.1],
      ],
      0,
      0,
      12,
    ),
  );
  p.material('metal', () => {
    p.cylinder(0, 1.1, 0, 0.36, 0.06, 12);
    p.box(0, 0.08, 0.36, 0.23, 0.04, 0.22, 0.035);
    p.box(0, 1.17, 0, 0.15, 0.04, 0.06, 0.02);
  });
  p.material('inlay', () => p.box(0, 0.68, 0.345, 0.2, 0.18, 0.012, 0.025));
}
