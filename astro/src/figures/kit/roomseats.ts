import { TableDraft } from './tableparts';
import type { ThemeId } from './tablethemes';

export function chair(p: TableDraft, theme: ThemeId, variant = 0): void {
  const office = ['work', 'computer', 'messy'].includes(theme);
  const stool = ['bar', 'lab', 'kitchen', 'storage'].includes(theme);
  const seat = theme === 'bar' ? 1.45 : theme === 'lab' ? 1.08 : 0.95;
  p.material('metal', () => {
    if (office || theme === 'lab') {
      p.roundRod([0, 0.12, 0], [0, seat, 0], 0.065, 10);
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5,
          x = Math.cos(a) * 0.5,
          z = Math.sin(a) * 0.5;
        p.roundRod([0, 0.18, 0], [x, 0.11, z], 0.035, 8);
        p.box(x, 0, z, 0.12, 0.12, 0.11, 0.03);
      }
    } else
      for (const x of [-0.36, 0.36])
        for (const z of [-0.34, 0.34])
          p.roundRod([x * 1.17, 0, z * 1.17], [x, seat, z], theme === 'bar' ? 0.038 : 0.05, 8);
    if (office)
      for (const x of [-0.49, 0.49]) {
        p.roundRod([x, seat, 0.14], [x, seat + 0.4, 0.14], 0.03, 8);
        p.box(x, seat + 0.38, -0.02, 0.12, 0.05, 0.48, 0.03);
      }
    if (stool)
      p.lathe(
        [
          [0.36, seat * 0.43],
          [0.39, seat * 0.43],
          [0.39, seat * 0.43 + 0.035],
          [0.36, seat * 0.43 + 0.035],
          [0.36, seat * 0.43],
        ],
        0,
        0,
        20,
      );
  });
  p.material(office || theme === 'bar' ? 'upholstery' : 'frame', () => {
    if (stool) {
      if (variant === 1) p.box(0, seat, 0, 0.85, 0.12, 0.85, 0.09);
      else p.cylinder(0, seat, 0, theme === 'bar' ? 0.45 : 0.43, 0.12, 20);
    } else p.box(0, seat, 0, 0.99, 0.13, 0.95, 0.1);
    if (office) {
      const h = theme === 'computer' || variant === 2 ? 1.13 : 0.83;
      p.box(0, seat + 0.2, 0.4, 0.86, h, 0.16, 0.075);
      if (theme === 'computer' || variant === 2) p.box(0, seat + 1.28, 0.42, 0.55, 0.24, 0.2, 0.065);
    } else if (!stool) {
      for (const x of [-0.39, 0.39]) p.roundRod([x, seat, 0.37], [x, seat + 1.0, 0.42], 0.04, 8);
      p.box(0, seat + 0.86, 0.41, 0.88, 0.14, 0.14, 0.04);
      if (variant === 2) p.box(0, seat + 0.24, 0.4, 0.72, 0.62, 0.1, 0.04);
      else
        for (let i = 0; i < 3 + (variant % 2); i++)
          p.box((i - (2 + (variant % 2)) / 2) * 0.19, seat + 0.24, 0.4, 0.055, 0.62, 0.06, 0.018);
    }
  });
  if (office && variant === 1)
    p.material('frame', () => {
      for (let i = 0; i < 5; i++) p.box((i - 2) * 0.14, seat + 0.3, 0.3, 0.025, 0.6, 0.025, 0);
    });
  if (!stool) p.material('upholstery', () => p.box(0, seat + 0.13, 0.01, 0.86, 0.065, 0.82, 0.075));
  if (theme === 'bar')
    p.material('frame', () => {
      for (const x of [-0.33, 0.33]) p.roundRod([x, seat, 0.24], [x, seat + 0.55, 0.28], 0.03, 8);
      p.box(0, seat + 0.4, 0.28, 0.74, 0.2, 0.12, 0.055);
    });
}
