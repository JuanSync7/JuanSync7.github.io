import { TableDraft } from './tableparts';
import type { ThemeId } from './tablethemes';

export function areaRug(p: TableDraft, width: number, depth: number, theme: ThemeId, variant: number): void {
  p.material('rug', () => p.box(0, 0, 0, width, 0.018, depth, 0.06));
  p.material('stitch', () => {
    const a = width / 2 - 0.14,
      b = depth / 2 - 0.14;
    for (const z of [-b, b]) p.box(0, 0.019, z, width - 0.24, 0.003, 0.035, 0.005);
    for (const x of [-a, a]) p.box(x, 0.019, 0, 0.035, 0.003, depth - 0.24, 0.005);
    if (theme === 'lab' || theme === 'storage' || theme === 'kitchen') {
      for (let x = -a + 0.08; x < a; x += 0.13) p.box(x, 0.019, 0, 0.025, 0.003, depth - 0.42, 0.005);
    } else if (theme === 'dining' || theme === 'study' || theme === 'bar') {
      const n = Math.floor(width / 0.65);
      for (let i = 0; i < n; i++)
        for (const sign of [-1, 1]) {
          const x = (i - (n - 1) / 2) * 0.6,
            z = sign * (depth / 2 - 0.32);
          p.face([
            [x - 0.09, 0.022, z],
            [x, 0.022, z + 0.08],
            [x + 0.09, 0.022, z],
            [x, 0.022, z - 0.08],
          ]);
        }
      if (theme === 'dining') {
        const a = 0.7 + variant * 0.07,
          b = 0.95;
        p.face([
          [-a, 0.021, 0],
          [0, 0.021, b],
          [a, 0.021, 0],
          [0, 0.021, -b],
        ]);
      }
    } else if (theme === 'computer') {
      for (let i = -2; i <= 2; i++) p.box(i * 0.65, 0.019, 0, 0.035, 0.002, depth - 0.55, 0.004);
    }
    if (!['lab', 'storage', 'kitchen'].includes(theme))
      for (let i = 0; i < 24; i++)
        for (const z of [-depth / 2 - 0.02, depth / 2 + 0.02])
          p.box(((i - 11.5) * (width - 0.15)) / 24, 0, z, 0.018, 0.008, 0.07, 0);
  });
}
