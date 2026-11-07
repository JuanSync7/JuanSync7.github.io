import { Blocks } from './builder';
import { THEMES, type Recipe } from './types';

export const FOREST_TREES = ['ancient tree', 'baobab', 'acacia', 'mangrove', 'juniper', 'cedar'] as const;

export function forestTree(r: Recipe, b: Blocks): boolean {
  if (!(FOREST_TREES as readonly string[]).includes(r.kind)) return false;
  const w = r.width,
    h = r.height,
    leaf = THEMES[r.biome].leaf;
  if (r.kind === 'ancient tree' || r.kind === 'baobab') {
    const trunk = r.kind === 'baobab' ? Math.max(1, w - 1) : 1;
    for (let y = 0; y <= h - 3; y++) b.disc(y, y < h / 2 ? trunk : 1, 'worldWood');
    for (const s of [-1, 0, 1]) {
      b.box(Math.min(0, s * w), Math.max(0, s * w), h - 3, h - 3, 0, 0, 'worldWood');
      for (let y = 0; y < 4; y++)
        b.disc(h - 2 + y, Math.max(1, w - 1 - Math.floor(y / 2)), leaf, s * w, s === 0 ? r.variant % 2 : 0);
    }
    if (r.kind === 'ancient tree')
      for (const s of [-1, 1]) b.box(s * (w + 1), s * (w + 1), h - 7, h - 2, 0, 0, 'worldMoss');
  } else if (r.kind === 'acacia') {
    for (let y = 0; y <= h; y++) {
      const x = Math.floor(y / 3);
      b.put(x, y, 0, 'worldWood');
      if (y % 3 === 0 && x > 0) b.put(x - 1, y, 0, 'worldWood');
    }
    const x = Math.floor(h / 3);
    b.disc(h + 1, w + 1, leaf, x, 0);
    b.disc(h + 2, w, leaf, x, 0);
  } else if (r.kind === 'mangrove') {
    b.box(0, 0, 0, h, 0, 0, 'worldWood');
    for (const s of [-1, 1]) {
      b.box(s * w, s * w, 0, 3, 0, 0, 'worldWood');
      b.box(0, 0, 0, 3, s * w, s * w, 'worldWood');
    }
    b.box(-w, w, 3, 3, 0, 0, 'worldWood');
    b.box(0, 0, 3, 3, -w, w, 'worldWood');
    for (let y = h - 2; y <= h + 1; y++) b.disc(y, Math.max(1, w + 1 - Math.abs(h - y)), leaf);
  } else if (r.kind === 'cedar') {
    b.box(0, 0, 0, h, 0, 0, 'worldWood');
    for (let y = 3; y <= h + 1; y++) {
      const radius = Math.max(0, Math.min(w, Math.ceil((h + 1 - y) / 3)) - (y % 3 === 0 ? 0 : 1));
      b.disc(y, radius, leaf);
    }
  } else {
    b.box(0, 0, 0, h, 0, 0, 'worldWood');
    for (let y = Math.max(1, h - 2); y <= h + 1; y++)
      b.disc(y, Math.max(0, w - Math.abs(h - y)), leaf, y > h ? r.variant % 2 : 0);
  }
  return true;
}
