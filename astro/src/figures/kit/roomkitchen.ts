import { TableDraft } from './tableparts';
import { accessory } from './roomdecor';

export function sinkCounter(p: TableDraft, laboratory: boolean): void {
  const w = 3.5,
    h = laboratory ? 1.8 : 1.9;
  p.material('frame', () => {
    p.box(0, 0, 0, w - 0.2, 0.12, 1.12, 0.02);
    p.box(0, 0.12, 0, w, h - 0.24, 1.35, 0.04);
  });
  p.material('cabinet', () => {
    for (const x of [-1.15, 0, 1.15]) p.box(x, 0.25, 0.71, 1.07, h - 0.46, 0.065, 0.03);
  });
  p.material('top', () => {
    p.box(0, h - 0.12, 0.45, w + 0.1, 0.12, 0.48, 0.025);
    p.box(0, h - 0.12, -0.53, w + 0.1, 0.12, 0.4, 0.025);
    for (const x of [-1.23, 1.23]) p.box(x, h - 0.12, 0, 1.14, 0.12, 0.64, 0.025);
  });
  p.material('metal', () => {
    p.box(0, h - 0.32, 0, 1.32, 0.04, 0.65, 0.08);
    for (const x of [-0.64, 0.64]) p.box(x, h - 0.29, 0, 0.035, 0.3, 0.65, 0.01);
    for (const z of [-0.31, 0.31]) p.box(0, h - 0.29, z, 1.32, 0.3, 0.035, 0.01);
    p.tube([0, h, -0.5], [0, h + 0.65, -0.5], 0.045, 10);
    p.tube([0, h + 0.65, -0.5], [0, h + 0.72, -0.24], 0.045, 10);
    p.tube([0, h + 0.72, -0.24], [0, h + 0.55, -0.05], 0.045, 10);
    for (const x of [-0.9, 0.9]) p.tube([x - 0.12, h - 0.36, 0.77], [x + 0.12, h - 0.36, 0.77], 0.025, 8);
    p.cylinder(0, h - 0.27, 0, 0.07, 0.025, 12);
  });
  accessory(p, laboratory ? 'beaker' : 'utensils', 1.2, h, 0, 0.5);
  if (laboratory) accessory(p, 'bottle', -1.2, h, 0, 0.45);
  else {
    p.material('recess', () => p.box(-1.23, h + 0.005, 0, 1.02, 0.04, 0.92, 0.03));
    p.material('metal', () => {
      for (const z of [-0.23, 0.23])
        p.lathe(
          [
            [0.18, h + 0.045],
            [0.18, h + 0.065],
            [0.13, h + 0.065],
            [0.13, h + 0.045],
          ],
          -1.23,
          z,
          16,
        );
      for (const x of [-1.5, -0.96]) p.cylinder(x, h + 0.045, 0.58, 0.045, 0.045, 10);
    });
  }
}
export function refrigerator(p: TableDraft): void {
  p.material('panel', () => {
    for (const x of [-0.6, 0.6]) for (const z of [-0.6, 0.6]) p.box(x, 0, z, 0.13, 0.06, 0.13, 0.015);
    p.box(0, 0.06, 0, 1.65, 4.2, 1.5, 0.08);
  });
  p.material('porcelain', () => {
    p.box(0, 0.16, 0.78, 1.5, 2.5, 0.08, 0.04);
    p.box(0, 2.72, 0.78, 1.5, 1.42, 0.08, 0.04);
  });
  p.material('metal', () => {
    for (const y of [1.8, 3.35]) p.tube([0.58, y - 0.3, 0.9], [0.58, y + 0.3, 0.9], 0.035, 8);
    for (let i = 0; i < 7; i++) p.box(-0.6 + i * 0.2, 0.08, 0.8, 0.1, 0.07, 0.015, 0.003);
  });
  p.material('paper', () => p.box(-0.2, 2.1, 0.84, 0.44, 0.38, 0.015, 0.005));
}
export function rangeHood(p: TableDraft): void {
  p.material('metal', () => {
    p.box(0, 0, 0.5, 1.9, 0.18, 1.4, 0.055);
    p.box(0, 0.18, -0.1, 0.75, 1.25, 0.35, 0.035);
    for (let i = 0; i < 8; i++) p.box(-0.65 + i * 0.185, 0.025, 1.15, 0.08, 0.055, 0.03, 0.005);
  });
  p.material('light', () => {
    for (const x of [-0.6, 0.6]) p.cylinder(x, -0.02, 0.65, 0.11, 0.03, 12);
  });
}
