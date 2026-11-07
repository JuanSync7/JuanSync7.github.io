import { Blocks } from './builder';
import type { Block, Recipe } from './types';

export function boatModel(r: Recipe): Block[] {
  const b = new Blocks(),
    w = r.width,
    d = r.depth;
  for (let z = -d; z <= d; z++) {
    const half = Math.abs(z) === d ? Math.max(0, w - 1) : w;
    b.box(-half, half, 0, 0, z, z, r.variant === 2 ? 'worldMoss' : 'worldWood');
    for (const x of [-half, half]) b.put(x, 1, z, 'worldWood');
  }
  b.box(-w, w, 1, 1, 0, 0, 'worldWood');
  if (r.variant % 2) {
    b.box(0, 0, 1, r.height, 0, 0, 'worldWood');
    for (let y = 3; y <= r.height; y++) b.box(1, Math.min(w + 1, r.height - y + 1), y, y, 0, 0, 'worldSnow');
    b.put(0, r.height, 1, 'worldClay');
  } else {
    b.box(-w - 1, w + 1, 1, 1, -1, -1, 'worldWood');
  }
  return b.result(r.turn);
}
