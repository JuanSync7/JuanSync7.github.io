import { TableDraft } from './tableparts';
import type { RoomPlan } from './roomplan';
import type { ThemeId } from './tablethemes';

export function roomFloor(p: TableDraft, r: RoomPlan, theme: ThemeId): void {
  p.material('frame', () =>
    p.box(0, r.floor - 0.18, (r.back + r.front) / 2, 2 * r.half + 0.32, 0.1, r.front - r.back + 0.28, 0.03),
  );
  p.material('recess', () => p.box(0, r.floor - 0.085, (r.back + r.front) / 2, 2 * r.half, 0.015, r.front - r.back, 0));
  const wood = ['dining', 'study', 'messy'].includes(theme);
  const nx = (wood ? 14 : 10) + r.variant,
    nz = wood ? 4 : theme === 'storage' ? 4 : 7;
  const width = (2 * r.half) / nx,
    length = (r.front - r.back) / nz;
  for (let i = 0; i < nx; i++) {
    const shift = wood && i % 2 ? length / 2 : 0;
    for (let j = shift ? -1 : 0; j < nz; j++) {
      const lo = Math.max(r.back, r.back + j * length + shift),
        hi = Math.min(r.front, r.back + (j + 1) * length + shift);
      if (hi - lo < 0.04) continue;
      const light = (i + j + r.variant) % (theme === 'kitchen' ? 2 : 5) === 0;
      p.material(light ? 'tile' : 'floor', () =>
        p.box(-r.half + (i + 0.5) * width, r.floor - 0.07, (lo + hi) / 2, width - 0.02, 0.07, hi - lo - 0.02, 0.008),
      );
      if (wood)
        for (let k = 0; k < 2; k++) {
          const x = -r.half + (i + 0.28 + k * 0.4) * width;
          const inset = 0.12 + ((i + j + r.variant) % 3) * 0.06;
          if (hi - lo > inset * 2)
            p.line([
              [x, r.floor, lo + inset],
              [x + width * 0.035, r.floor, (lo + hi) / 2],
              [x, r.floor, hi - inset],
            ]);
        }
    }
  }
}
