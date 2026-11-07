import { Blocks } from './builder';
import { THEMES, type Recipe } from './types';

export const TOWN_BUILDINGS = ['townhouse', 'workshop', 'clock tower', 'forge'] as const;

export function townBuilding(r: Recipe, b: Blocks): boolean {
  if (!(TOWN_BUILDINGS as readonly string[]).includes(r.kind)) return false;
  const w = r.width,
    d = r.depth,
    h = r.height,
    roof = THEMES[r.biome].roof;
  b.box(-w, w, 0, 0, -d, d, 'worldStone');
  const wall = r.variant % 2 ? 'worldSand' : 'worldEarth';
  for (let y = 1; y <= h; y++)
    for (let x = -w; x <= w; x++)
      for (let z = -d; z <= d; z++) {
        if (Math.abs(x) !== w && Math.abs(z) !== d) continue;
        const frame = y % 4 === 0 || (Math.abs(x) === w && Math.abs(z) === d);
        const window = y % 4 === 2 && (Math.abs(z) === d ? x % 2 === 0 : z % 2 === 0);
        b.put(x, y, z, frame ? 'worldWood' : window ? 'worldHoney' : wall);
      }
  b.box(0, 0, 1, 2, d, d, 'line3');
  // Window sills and roof ridges survive the close camera without extra draw calls.
  for (let y = 2; y < h; y += 4)
    for (let x = -w + 1; x < w; x += 2) {
      b.put(x, y - 1, d + 1, 'worldWood');
      if (r.variant % 2) b.put(x, y + 1, d + 1, 'worldWood');
    }
  for (let z = -d; z <= d; z++) if (z % 3 === 0) b.put(-w, 0, z, 'worldStone');
  if (r.kind === 'clock tower') {
    b.box(-1, 1, h - 2, h, d + 1, d + 1, 'worldSnow');
    b.put(0, h - 1, d + 1, 'worldWood');
    b.put(1, h - 1, d + 1, 'worldWood');
    b.put(0, h, d + 1, 'worldWood');
    for (let y = 0; y <= w + 1; y++) b.box(-w - 1 + y, w + 1 - y, h + 1 + y, h + 1 + y, -d - 1 + y, d + 1 - y, roof);
  } else {
    for (let y = 0; y <= d + 1; y++) b.box(-w - 1, w + 1, h + y + 1, h + y + 1, -d - 1 + y, d + 1 - y, roof);
    if (r.kind === 'townhouse') {
      b.box(-w, w, 3, 3, d + 1, d + 2, 'worldWood');
      b.box(-w, w, 4, 4, d + 2, d + 2, 'worldWood');
      for (const x of [-w, w]) b.box(x, x, 0, 3, d + 2, d + 2, 'worldWood');
    } else if (r.kind === 'workshop') {
      b.box(-w, w, 3, 3, d + 1, d + 2, 'worldClay');
      b.put(-w, 1, d + 1, 'worldWood');
      b.put(-w, 2, d + 1, 'worldSand');
    } else {
      b.box(-w, -w + 1, 1, h + d + 3, -1, 1, 'worldStone');
      b.put(-w + 1, 2, d + 1, 'worldEmber');
      b.put(-w + 1, 1, d + 1, 'worldStone');
      b.put(-w + 1, 1, d, 'worldStone');
    }
  }
  return true;
}
