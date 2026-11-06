import { TableDraft } from './tableparts';
import type { TableTheme } from './tablethemes';

export function pull(p: TableDraft, x: number, y: number, z: number, width = 0.36): void {
  p.material('metal', () => {
    for (const side of [-1, 1]) p.tube([x + (side * width) / 2, y, z], [x + (side * width) / 2, y, z + 0.11], 0.028, 8);
    p.tube([x - width / 2, y, z + 0.11], [x + width / 2, y, z + 0.11], 0.035);
  });
}
export function panel(p: TableDraft, x: number, y: number, z: number, width: number, height: number): void {
  p.material('recess', () => p.box(x, y, z - 0.025, width, height, 0.035, 0.012));
  p.material('panel', () => {
    p.box(x, y + 0.08, z + 0.018, width - 0.16, height - 0.16, 0.025, 0.02);
    for (const side of [-1, 1]) p.box(x + side * (width / 2 - 0.045), y, z + 0.035, 0.09, height, 0.07, 0.015);
    for (const at of [y, y + height - 0.09]) p.box(x, at, z + 0.035, width - 0.16, 0.09, 0.07, 0.015);
  });
}
export function cabinet(p: TableDraft, x: number, height: number, width: number, depth: number): void {
  const bottom = -height + 0.09,
    top = -0.23,
    step = (top - bottom) / 3;
  p.material('frame', () => {
    for (const side of [-1, 1])
      p.box(x + side * (width / 2 - 0.045), -height + 0.09, 0, 0.09, height - 0.31, depth, 0.02);
    p.box(x, bottom, -depth / 2 + 0.04, width, height - 0.32, 0.08, 0.01);
    p.box(x, bottom, 0, width, 0.08, depth, 0.02);
    p.box(x, top - 0.07, 0, width, 0.07, depth, 0.02);
  });
  p.material('recess', () => p.box(x, bottom + 0.03, depth / 2 - 0.13, width - 0.16, top - bottom - 0.05, 0.06, 0.01));
  for (let i = 0; i < 3; i++) {
    const y = bottom + i * step + 0.03;
    p.material('panel', () => p.box(x, y, depth / 2 - 0.025, width - 0.15, step - 0.055, 0.075, 0.025));
    pull(p, x, y + step * 0.53, depth / 2 + 0.05, width * 0.38);
  }
  p.material('foot', () => p.box(x, -height, 0, width - 0.16, 0.09, depth - 0.15, 0.02));
  p.material('inlay', () => p.box(x + width / 2 + 0.003, bottom + 0.13, 0, 0.015, height - 0.6, depth - 0.28, 0.005));
}
export function feet(p: TableDraft, x: number, z: number, height: number, size = 0.18): void {
  p.material('metal', () => p.cylinder(x, -height + 0.06, z, size * 0.28, 0.1, 10));
  p.material('foot', () => p.box(x, -height, z, size, 0.06, size, 0.025));
}
export function legs(p: TableDraft, t: TableTheme, metal = false): void {
  for (const x of [-t.w / 2 + 0.35, t.w / 2 - 0.35])
    for (const z of [-t.d / 2 + 0.35, t.d / 2 - 0.35]) {
      p.material(metal ? 'metal' : 'frame', () =>
        p.box(x, -t.height + 0.12, z, metal ? 0.12 : 0.18, t.height - 0.3, metal ? 0.12 : 0.18, 0.02),
      );
      feet(p, x, z, t.height, metal ? 0.2 : 0.23);
    }
}
export function bolts(p: TableDraft, x: number, y: number, z: number, spacing = 0.24): void {
  p.material('metal', () => {
    for (const side of [-1, 1])
      p.tube([x + (side * spacing) / 2, y, z], [x + (side * spacing) / 2, y, z + 0.025], 0.04, 6);
  });
}
