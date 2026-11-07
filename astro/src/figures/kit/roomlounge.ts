import { TableDraft } from './tableparts';
import { accessory } from './roomdecor';
import type { ThemeId } from './tablethemes';

export function loungeSeat(p: TableDraft, theme: ThemeId, sofa: boolean): void {
  const w = sofa ? 2.8 : 1.65;
  p.material('frame', () => {
    for (const x of [-w / 2 + 0.18, w / 2 - 0.18])
      for (const z of [-0.45, 0.45]) p.roundRod([x, 0, z], [x * 0.92, 0.4, z * 0.9], 0.065, 8);
  });
  p.material('upholstery', () => {
    p.box(0, 0.35, 0, w, 0.35, 1.45, 0.13);
    p.box(0, 0.68, -0.46, w, 1.05, 0.32, 0.13);
    for (const sign of [-1, 1]) p.box(sign * (w / 2 - 0.13), 0.62, 0.02, 0.28, 0.55, 1.28, 0.1);
    const n = sofa ? 2 : 1;
    for (let i = 0; i < n; i++) {
      p.box(((i - (n - 1) / 2) * (w - 0.6)) / n, 0.7, 0.14, (w - 0.62) / n - 0.025, 0.23, 0.9, 0.1);
      p.box(((i - (n - 1) / 2) * (w - 0.6)) / n, 1.04, -0.23, (w - 0.65) / n - 0.04, 0.48, 0.18, 0.08);
    }
  });
  p.material('stitch', () => {
    for (let i = 0; i < (sofa ? 5 : 3); i++) p.cylinder((i - (sofa ? 2 : 1)) * 0.32, 1.36, -0.27, 0.025, 0.018, 6);
  });
  if (theme === 'study')
    p.material('upholstery', () => {
      for (const x of [-w / 2 + 0.1, w / 2 - 0.1]) p.box(x, 1.2, -0.38, 0.18, 0.72, 0.54, 0.09);
    });
}
export function sideTable(p: TableDraft, theme: ThemeId): void {
  p.material('metal', () => {
    p.cylinder(0, 0, 0, 0.46, 0.06, 16);
    p.roundRod([0, 0.06, 0], [0, 0.95, 0], 0.045, 8);
  });
  p.material('top', () => p.cylinder(0, 0.95, 0, 0.68, 0.07, 24));
  p.material('book', () => accessory(p, theme === 'bar' ? 'bottle' : 'books', -0.17, 1.02, 0, 0.4));
  p.material('ceramic', () => accessory(p, theme === 'bar' ? 'tumbler' : 'mug', 0.35, 1.02, 0.15, 0.4));
}
export function sideboard(p: TableDraft, theme: ThemeId): void {
  p.material('frame', () => {
    for (const x of [-1.35, 1.35]) for (const z of [-0.38, 0.38]) p.box(x, 0, z, 0.13, 0.3, 0.13, 0.025);
    p.box(0, 0.25, 0, 3.0, 1.2, 1.05, 0.045);
  });
  p.material('cabinet', () => {
    for (const x of [-1.0, 0, 1.0]) p.box(x, 0.34, 0.54, 0.92, 1.0, 0.06, 0.025);
  });
  p.material('metal', () => {
    for (const x of [-1.0, 0, 1.0]) p.roundRod([x - 0.12, 1.13, 0.59], [x + 0.12, 1.13, 0.59], 0.025, 8);
  });
  p.material('top', () => p.box(0, 1.45, 0, 3.12, 0.1, 1.16, 0.035));
  accessory(p, theme === 'dining' ? 'bowl' : 'books', -0.7, 1.55, 0, 0.65);
  accessory(p, 'plant', 0.7, 1.55, -0.02, 0.55);
}
