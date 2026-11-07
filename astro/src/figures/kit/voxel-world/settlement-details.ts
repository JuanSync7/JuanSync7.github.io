import { Blocks } from './builder';
import { THEMES, type Recipe } from './types';

export const SETTLEMENT_DETAILS = [
  'campfire',
  'barrel',
  'hay bale',
  'wagon',
  'market stall',
  'signpost',
  'street planter',
  'fountain',
  'hydrant',
  'minecart',
  'rail track',
  'sled',
] as const;

export function settlementDetail(r: Recipe, b: Blocks): boolean {
  if (!(SETTLEMENT_DETAILS as readonly string[]).includes(r.kind)) return false;
  const w = r.width,
    h = Math.min(4, r.height),
    v = r.variant,
    leaf = THEMES[r.biome].leaf;
  if (r.kind === 'campfire') {
    b.disc(0, w, 'worldStone');
    b.box(-1, 1, 1, 1, 0, 0, 'worldWood');
    b.box(0, 0, 1, 1, -1, 1, 'worldWood');
    b.put(0, 2, 0, 'worldEmber');
    b.put(0, 3, 0, 'worldHoney');
    if (v % 2) b.put(1, 3, 0, 'worldHoney');
  } else if (r.kind === 'barrel' || r.kind === 'hay bale') {
    for (let y = 0; y < h; y++) {
      if (r.kind === 'barrel') b.disc(y, w, y === 1 || y === h - 1 ? 'worldStone' : 'worldWood');
      else b.box(-w, w, y, y, -1, 1, y % 2 ? 'worldHoney' : 'worldSand');
    }
    if (v % 2) b.put(0, h, 0, r.kind === 'barrel' ? 'worldWood' : 'worldHoney');
  } else if (['wagon', 'minecart', 'sled'].includes(r.kind)) {
    const d = r.depth;
    for (const x of [-w, w]) {
      if (r.kind === 'sled') b.box(x, x, 0, 0, -d, d + 1, 'worldWood');
      else for (const z of [-d, d]) b.put(x, 0, z, 'line3');
    }
    b.box(-w, w, 1, 1, -d, d, r.kind === 'minecart' ? 'worldStone' : 'worldWood');
    if (r.kind !== 'sled') for (const x of [-w, w]) b.box(x, x, 2, 2 + (v % 2), -d, d, 'worldWood');
    if (v > 1)
      b.box(0, 0, 2, 3, -Math.max(0, d - 1), Math.max(0, d - 1), r.kind === 'minecart' ? 'worldStone' : 'worldHoney');
  } else if (r.kind === 'market stall') {
    for (const x of [-w, w]) b.box(x, x, 0, h, 0, 0, 'worldWood');
    b.box(-w, w, 1, 1, -1, 1, 'worldWood');
    for (let x = -w - 1; x <= w + 1; x++) b.box(x, x, h + 1, h + 1, -1, 1, (x + v) % 2 ? 'worldSand' : 'worldClay');
    b.put(0, 2, 1, 'worldHoney');
  } else if (r.kind === 'signpost' || r.kind === 'hydrant') {
    b.box(0, 0, 0, h, 0, 0, r.kind === 'hydrant' ? 'worldClay' : 'worldWood');
    b.box(-w, w, h - 1, h, 0, 0, r.kind === 'hydrant' ? 'worldClay' : 'worldSand');
    if (v % 2) b.put(w, h - 1, 1, 'worldWood');
  } else if (r.kind === 'street planter' || r.kind === 'fountain') {
    b.disc(0, w + 1, 'worldStone');
    b.disc(1, w, r.kind === 'fountain' ? 'worldWater' : 'worldEarth');
    if (r.kind === 'fountain') {
      b.box(0, 0, 2, h + 1, 0, 0, 'worldStone');
      b.disc(h + 2, w, 'worldWater');
      b.put(0, h + 3, 0, 'worldWater');
    } else {
      b.disc(2, w, leaf);
      b.disc(3, Math.max(0, w - 1), leaf);
      if (v % 2) b.put(0, 4, 0, 'worldLilac');
    }
  } else {
    for (const x of [-w, w]) b.box(x, x, 0, 0, -r.depth, r.depth, 'worldStone');
    for (let z = -r.depth; z <= r.depth; z += 2) b.box(-w, w, 0, 0, z, z, 'worldWood');
    if (v % 2) b.put(0, 0, 0, 'worldStone');
  }
  return true;
}
