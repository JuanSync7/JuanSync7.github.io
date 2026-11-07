import { TableDraft } from './tableparts';
import { framed } from './roomdecor';
import type { ThemeId } from './tablethemes';

export function themedWindow(p: TableDraft, theme: ThemeId, floor: number, variant: number): void {
  const high = theme === 'lab' || theme === 'storage';
  const width = high ? 3.0 : 2.65,
    height = high ? 1.3 : 2.45,
    bottom = floor + (high ? 3.95 : 2.5);
  if (theme === 'bar') {
    const outline: [number, number][] = [
      [-1.25, bottom],
      [1.25, bottom],
      [1.25, bottom + 1.6],
    ];
    for (let i = 1; i <= 16; i++) {
      const a = (i * Math.PI) / 16;
      outline.push([Math.cos(a) * 1.25, bottom + 1.6 + Math.sin(a) * 1.25]);
    }
    p.material('window', () => p.face(outline.map(([x, y]) => [x, y, 0.12])));
    p.material('inlay', () => {
      outline.forEach((a, i) => {
        const b = outline[(i + 1) % outline.length];
        if (b) p.tube([a[0], a[1], 0.17], [b[0], b[1], 0.17], 0.065, 8);
      });
      p.box(0, bottom, 0.18, 0.07, 2.78, 0.07, 0.015);
      p.box(0, bottom + 1.5, 0.18, 2.4, 0.065, 0.07, 0.015);
    });
  } else {
    framed(p, 0, bottom, width, height, 0.16);
    p.material('window', () => p.box(0, bottom + 0.12, 0.1, width - 0.25, height - 0.24, 0.03, 0.005));
    p.material('inlay', () => {
      const count = high ? 3 : variant === 2 ? 3 : 2;
      for (let i = 1; i < count; i++)
        p.box(-width / 2 + (i * width) / count, bottom + 0.1, 0.18, 0.055, height - 0.2, 0.055, 0.005);
      if (!high) p.box(0, bottom + height / 2, 0.18, width - 0.2, 0.055, 0.055, 0.005);
      p.box(0, bottom - 0.07, 0.19, width + 0.2, 0.12, theme === 'study' ? 0.55 : 0.36, 0.025);
    });
  }
  if (theme === 'dining' || theme === 'study' || theme === 'bar') {
    const curtainHeight = theme === 'bar' ? 2.9 : height;
    const rod = bottom + curtainHeight + 0.24;
    p.material('metal', () => {
      p.tube([-1.72, rod, 0.3], [1.72, rod, 0.3], 0.027, 10);
      for (const x of [-1.55, 1.55]) p.tube([x, rod, 0.03], [x, rod, 0.3], 0.03, 8);
    });
    p.material('shade', () => {
      for (const sign of [-1, 1])
        for (let i = 0; i < 5; i++)
          p.box(
            sign * (1.24 + i * 0.085),
            bottom - 0.35,
            0.24 + (i % 2) * 0.05,
            0.12,
            curtainHeight + 0.47,
            0.13,
            0.04,
          );
    });
    p.material('inlay', () => {
      for (const x of [-1.48, 1.48]) p.box(x, bottom + 0.5, 0.33, 0.42, 0.065, 0.07, 0.02);
    });
  } else if (theme === 'computer') {
    p.material('acoustic', () => {
      p.box(0, bottom + height - 0.07, 0.24, width + 0.1, 0.17, 0.22, 0.03);
      p.box(0, bottom + 0.65 + variant * 0.12, 0.21, width - 0.18, height - 0.72 - variant * 0.12, 0.035, 0.005);
    });
    p.material('metal', () => p.tube([1.35, bottom + 0.6, 0.23], [1.35, bottom + height, 0.23], 0.012, 6));
  } else if (!high)
    p.material('shade', () => {
      if (theme === 'kitchen') {
        p.tube([-1.3, bottom + 1.1, 0.23], [1.3, bottom + 1.1, 0.23], 0.02, 8);
        for (let i = 0; i < 16; i++)
          p.box(-1.18 + i * 0.158, bottom + 0.15, 0.23 + (i % 2) * 0.035, 0.14, 0.9, 0.07, 0.025);
      } else
        for (let i = 0; i < 8; i++) p.box(0, bottom + height - 0.18 - i * 0.07, 0.23, width - 0.18, 0.026, 0.17, 0.005);
    });
  if (!high && theme !== 'kitchen')
    p.material('metal', () => {
      for (const y of [floor + 0.3, floor + 1.0]) p.box(0, y, 0.18, 1.9, 0.045, 0.25, 0.015);
      for (let i = 0; i < 12; i++) p.box(-0.83 + i * 0.15, floor + 0.33, 0.18, 0.07, 0.64, 0.2, 0.02);
      p.tube([1.0, floor + 0.1, 0.2], [1.0, floor + 0.9, 0.2], 0.025, 8);
    });
}
