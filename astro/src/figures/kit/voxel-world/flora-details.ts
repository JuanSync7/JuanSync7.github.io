import { Blocks } from './builder';
import { THEMES, type Recipe } from './types';

export const FLORA_DETAILS = [
  'berry bush',
  'flowering shrub',
  'grass clump',
  'wildflower patch',
  'heather',
  'lichen',
  'agave',
  'barrel cactus',
  'banana plant',
  'bromeliad',
  'tree fern',
  'orchid',
  'cattails',
  'tree stump',
] as const;

export function floraDetail(r: Recipe, b: Blocks): boolean {
  if (!(FLORA_DETAILS as readonly string[]).includes(r.kind)) return false;
  const leaf = THEMES[r.biome].leaf,
    radius = r.width,
    v = r.variant;
  if (r.kind === 'tree stump') {
    b.disc(0, radius, 'worldWood');
    b.disc(1, radius, 'worldWood');
    b.disc(2, Math.max(0, radius - 1), 'worldSand');
    if (v % 2) b.put(radius, 2, 0, 'worldMoss');
  } else if (r.kind === 'berry bush' || r.kind === 'flowering shrub') {
    b.put(0, 0, 0, 'worldWood');
    b.disc(1, radius, leaf);
    b.disc(2, Math.max(0, radius - 1), leaf);
    const fruit = r.kind === 'berry bush' ? 'worldLilac' : v % 2 ? 'worldHoney' : 'worldSnow';
    for (let x = -radius; x <= radius; x++) if ((x + v) % 2 === 0) b.put(x, 2, 0, fruit);
  } else if (r.kind === 'agave' || r.kind === 'bromeliad') {
    b.put(0, 0, 0, leaf);
    b.box(0, 0, 1, 2 + (v % 2), 0, 0, leaf);
    for (const s of [-1, 1])
      for (let i = 1; i <= radius + 1; i++) {
        b.put(s * i, Math.max(0, 2 - i), 0, leaf);
        b.put(0, Math.max(0, 2 - i), s * i, leaf);
      }
    if (r.kind === 'bromeliad') b.put(0, 3 + (v % 2), 0, 'worldLilac');
  } else if (r.kind === 'barrel cactus') {
    const h = Math.min(4, r.height);
    for (let y = 0; y <= h; y++) b.disc(y, y === h ? 0 : radius, 'worldMoss');
    if (v % 2) b.put(0, h + 1, 0, 'worldHoney');
  } else if (r.kind === 'banana plant' || r.kind === 'tree fern') {
    const h = Math.min(5, r.height);
    b.box(0, 0, 0, h, 0, 0, r.kind === 'banana plant' ? 'worldMoss' : 'worldWood');
    for (const s of [-1, 1])
      for (let i = 1; i <= radius + 1; i++) {
        const y = h + 1 - Math.floor(i / 2);
        b.put(s * i, y, 0, leaf);
        b.put(0, y, s * i, leaf);
        b.put(s * i, y - 1, 0, leaf);
        b.put(0, y - 1, s * i, leaf);
        if (r.kind === 'banana plant') b.put(s * i, y, 1, leaf);
      }
    if (r.kind === 'banana plant' && v % 2) b.put(1, h - 1, 0, 'worldHoney');
  } else if (r.kind === 'cattails' || r.kind === 'orchid') {
    for (let x = -radius; x <= radius; x++) {
      const h = 2 + (Math.abs(x + v) % 3);
      b.box(x, x, 0, h, 0, 0, leaf);
      b.put(x, h + 1, 0, r.kind === 'cattails' ? 'worldWood' : 'worldLilac');
    }
  } else {
    for (let x = -radius; x <= radius; x++)
      for (let z = -radius; z <= radius; z++) {
        if (Math.abs(x) + Math.abs(z) > radius || (x * 3 + z + v) % 3 === 0) continue;
        const h = r.kind === 'lichen' ? 0 : (Math.abs(x + z + v) % 2) + 1;
        b.box(x, x, 0, h, z, z, leaf);
        if (r.kind === 'wildflower patch' || r.kind === 'heather')
          b.put(x, h + 1, z, r.kind === 'heather' ? 'worldLilac' : (x + v) % 2 ? 'worldHoney' : 'worldSnow');
      }
    b.put(0, 0, 0, leaf);
  }
  return true;
}
