import { Blocks } from './builder';
import { COLD, THEMES, type Recipe, type Block } from './types';

export function plant(r: Recipe): Block[] {
  const b = new Blocks(),
    h = r.height,
    radius = r.width,
    theme = THEMES[r.biome];
  b.box(0, 0, 0, h, 0, 0, r.kind === 'birch' ? 'worldSnow' : r.kind === 'bamboo' ? 'worldMoss' : 'worldWood');
  if (r.kind === 'birch') for (let y = 1; y < h; y += 3) b.put(0, y, 0, 'worldWood');
  if (r.kind === 'dead tree') {
    for (let i = 1; i <= radius; i++) {
      b.put(i, h - 2 + i, 0, 'worldWood');
      b.put(i, h - 3 + i, 0, 'worldWood');
      b.put(-i, h - 3 + i, 0, 'worldWood');
      b.put(-i, h - 4 + i, 0, 'worldWood');
    }
  } else if (r.kind === 'bamboo') {
    for (let y = 2; y <= h; y += 2) {
      b.put(0, y, 0, 'worldSand');
      const s = (y + r.variant) % 4 ? -1 : 1;
      b.put(s, y, 0, theme.leaf);
      b.put(s, y + 1, 0, theme.leaf);
      b.put(s * 2, y + 1, 0, theme.leaf);
    }
  } else if (r.kind === 'palm') {
    b.disc(h + 1, 1, theme.leaf);
    for (let i = 1; i <= radius + 1; i++)
      for (const s of [-1, 1]) {
        b.put(s * i, h + (i < radius ? 1 : 0), 0, theme.leaf);
        b.put(0, h + (i < radius ? 1 : 0), s * i, theme.leaf);
        if (i === radius) {
          b.put(s * i, h + 1, 0, theme.leaf);
          b.put(0, h + 1, s * i, theme.leaf);
        }
      }
  } else if (r.kind === 'pine') {
    for (let y = Math.max(2, h - radius * 2); y <= h + 2; y++) {
      const size = Math.min(radius, Math.ceil((h + 2 - y) / 2));
      b.disc(y, size, theme.leaf);
      if (COLD.has(r.biome) && y % 2 === 0) b.disc(y + 1, Math.max(0, size - 1), 'worldSnow');
    }
  } else {
    const reach = r.variant === 1 ? 3 : r.variant === 2 ? 1 : 2;
    for (let y = h - reach; y <= h + reach; y++)
      b.disc(y, Math.max(0, radius - Math.floor(Math.abs(h - y) / (r.variant === 1 ? 1 : 2))), theme.leaf);
    if (r.kind === 'willow')
      for (const s of [-1, 1]) {
        b.box(s * radius, s * radius, h - 4, h, 0, 0, theme.leaf);
        b.box(0, 0, h - 3, h, s * radius, s * radius, theme.leaf);
      }
    if (r.variant === 3)
      for (const s of [-1, 1]) {
        b.box(Math.min(0, s * radius), Math.max(0, s * radius), h - 1, h - 1, 0, 0, 'worldWood');
        b.disc(h, Math.max(1, radius - 1), theme.leaf, s * radius, 0);
      }
    if (r.kind === 'jungle tree') {
      for (const s of [-1, 1]) {
        b.box(s, s, 0, 2, 0, 0, 'worldWood');
        b.disc(h - 3, Math.max(1, radius - 1), theme.leaf, s * radius, 0);
      }
      for (const s of [-1, 1]) b.box(s * radius, s * radius, h - 5, h - 2, 0, 0, 'worldMoss');
    }
    if (r.biome === 'woodland' && r.variant % 2 === 0) b.put(radius, h, 0, 'worldHoney');
  }
  return b.result(r.turn);
}
