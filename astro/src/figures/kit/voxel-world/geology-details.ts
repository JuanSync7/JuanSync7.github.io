import { Blocks } from './builder';
import type { Recipe, Material } from './types';

export const GEOLOGY_DETAILS = [
  'obsidian shard',
  'sandstone arch',
  'sandstone pillar',
  'basalt cluster',
  'crystal cluster',
  'ice cluster',
  'snowdrift',
  'cairn',
  'scree',
  'mossy boulder',
  'lava vent',
  'slag heap',
] as const;

export function geologyDetail(r: Recipe, b: Blocks): boolean {
  if (!(GEOLOGY_DETAILS as readonly string[]).includes(r.kind)) return false;
  const w = r.width,
    h = r.height,
    v = r.variant;
  if (r.kind === 'sandstone arch') {
    for (const x of [-w - 1, w + 1]) {
      b.box(x, x, 0, h, 0, 0, 'worldSand');
      if (v % 2) b.put(x, h - 1, 1, 'worldEarth');
    }
    b.box(-w - 1, w + 1, h, h + 1, 0, 0, 'worldSand');
    b.box(-w, w, h + 2, h + 2, 0, 0, 'worldEarth');
  } else if (r.kind === 'sandstone pillar') {
    for (let y = 0; y <= h + 2; y++)
      b.disc(y, y === h + 1 ? w + (v % 2) : y > h ? w : Math.max(0, w - 1), y % 3 ? 'worldSand' : 'worldEarth');
  } else if (r.kind === 'cairn') {
    for (let y = 0; y <= Math.min(5, h); y++)
      b.disc(y, Math.max(0, w - Math.floor(y / 2)), 'worldStone', y > 1 ? v % 2 : 0);
  } else if (r.kind === 'snowdrift' || r.kind === 'mossy boulder' || r.kind === 'slag heap') {
    const material: Material = r.kind === 'snowdrift' ? 'worldSnow' : r.kind === 'slag heap' ? 'line4' : 'worldStone';
    for (let y = 0; y < Math.min(h, w + 2); y++)
      b.disc(y, Math.max(0, w - Math.floor(y / 2)), material, y > 0 && v % 2 ? 1 : 0);
    if (r.kind === 'mossy boulder') b.disc(Math.min(h, w + 2), Math.max(0, w - 1), 'worldMoss', v % 2 ? 1 : 0);
  } else if (r.kind === 'lava vent') {
    b.disc(0, w, 'line3');
    for (let x = -w; x <= w; x++)
      for (let z = -w; z <= w; z++) if (Math.abs(x) + Math.abs(z) <= w) b.put(x, 1, z, x || z ? 'line4' : 'worldEmber');
    if (v % 2) b.put(1, 2, 0, 'line3');
  } else {
    const material: Material =
      r.kind === 'crystal cluster'
        ? 'worldLilac'
        : r.kind === 'ice cluster'
          ? 'worldIce'
          : r.kind === 'basalt cluster' || r.kind === 'obsidian shard'
            ? 'line3'
            : 'worldStone';
    b.put(0, 0, 0, material);
    for (let x = -w; x <= w; x++)
      for (let z = -w; z <= w; z++) {
        if (Math.abs(x) + Math.abs(z) > w || (x * 3 + z + v) % 3 === 0) continue;
        const height = r.kind === 'scree' ? 0 : Math.max(1, h - Math.abs(x) - Math.abs(z) - ((x + v) % 2));
        b.box(x, x, 0, height, z, z, material);
      }
  }
  return true;
}
