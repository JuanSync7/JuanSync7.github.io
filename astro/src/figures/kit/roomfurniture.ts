import { TableDraft } from './tableparts';
import { accessory } from './roomdecor';
import type { ThemeId } from './tablethemes';

export function planter(p: TableDraft, variant: number): void {
  p.material('ceramic', () =>
    p.lathe(
      [
        [0, 0],
        [0.3, 0],
        [0.42, 0.65],
        [0.42, 0.72],
        [0.36, 0.72],
        [0.34, 0.66],
        [0, 0.66],
      ],
      0,
      0,
      12,
    ),
  );
  p.material('recess', () => p.cylinder(0, 0.665, 0, 0.345, 0.025, 12));
  p.material('leaf', () => {
    for (let i = 0; i < 7; i++) {
      const a = i * 2.399 + variant * 0.6,
        y = 1.2 + (i % 3) * 0.32;
      const x = Math.cos(a) * (0.35 + (i % 2) * 0.12),
        z = Math.sin(a) * (0.35 + (i % 2) * 0.12);
      p.tube([0, 0.69, 0], [x, y, z], 0.018, 6);
      const sideX = Math.cos(a + Math.PI / 2) * 0.16,
        sideZ = Math.sin(a + Math.PI / 2) * 0.16;
      const base: [number, number, number] = [x * 0.55, y - 0.25, z * 0.55],
        tip: [number, number, number] = [x * 1.5, y + 0.22, z * 1.5];
      p.face([base, [x + sideX, y, z + sideZ], tip, [x, y + 0.07, z]]);
      p.face([base, [x, y + 0.07, z], tip, [x - sideX, y, z - sideZ]]);
    }
  });
}
export function cart(p: TableDraft, theme: ThemeId, variant: number): void {
  p.material('metal', () => {
    for (const x of [-0.5, 0.5])
      for (const z of [-0.42, 0.42]) {
        p.tube([x, 0.13, z], [x, 1.55, z], 0.035, 8);
        p.box(x, 0, z, 0.13, 0.15, 0.13, 0.03);
      }
    for (const y of [0.25, 0.87, 1.5]) p.box(0, y, 0, 1.15, 0.065, 1.05, 0.04);
    p.tube([-0.5, 1.58, 0.42], [0.5, 1.58, 0.42], 0.035, 8);
  });
  const kind =
    theme === 'bar'
      ? 'bottle'
      : theme === 'kitchen' || theme === 'dining'
        ? 'bowl'
        : theme === 'lab'
          ? 'flask'
          : theme === 'storage'
            ? 'box'
            : 'books';
  p.material('inlay', () => {
    accessory(p, kind, -0.27, 1.565, 0, 0.48);
    accessory(p, kind, 0.28, 1.565, 0.03, 0.43);
    accessory(p, variant % 2 ? 'box' : 'books', 0, 0.935, 0, 0.6);
    accessory(p, 'box', 0, 0.315, 0, 0.7);
  });
}
export function floorLamp(p: TableDraft): void {
  p.material('metal', () => {
    p.cylinder(0, 0, 0, 0.4, 0.08, 16);
    p.tube([0, 0.08, 0], [0, 3.35, 0], 0.035);
  });
  p.material('shade', () =>
    p.lathe(
      [
        [0.18, 3.35],
        [0.48, 2.85],
        [0.43, 2.85],
        [0.15, 3.32],
      ],
      0,
      0,
      16,
    ),
  );
  p.material('light', () => p.cylinder(0, 2.91, 0, 0.15, 0.06, 12));
}
