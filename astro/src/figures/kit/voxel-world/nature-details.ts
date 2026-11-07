import { Blocks } from './builder';
import { THEMES, type Recipe } from './types';

export const NATURE_DETAILS = [
  'moss carpet',
  'leaf litter',
  'pinecone',
  'hollow log',
  'fungus stump',
  'cup mushroom',
  'spore cluster',
  'dry grass',
  'cotton grass',
  'dwarf shrub',
  'frost shrub',
  'sulfur mound',
  'charred stump',
  'ore boulder',
  'ice arch',
  'standing stones',
  'crystal geode',
  'giant fossil',
] as const;

export function natureDetail(r: Recipe, b: Blocks): boolean {
  if (!(NATURE_DETAILS as readonly string[]).includes(r.kind)) return false;
  const w = r.width,
    h = r.height,
    v = r.variant,
    leaf = THEMES[r.biome].leaf;
  if (r.kind === 'ice arch') {
    for (const x of [-w - 1, w + 1]) b.box(x, x, 0, h, 0, 0, 'worldIce');
    b.box(-w - 1, w + 1, h, h + 1, 0, 0, 'worldIce');
    b.box(-w, w, h + 2, h + 2, 0, 0, 'worldSnow');
    if (v % 2) b.box(w + 1, w + 1, 1, h - 1, 1, 1, 'worldSnow');
  } else if (r.kind === 'standing stones') {
    for (const [x, z] of [
      [-w, 0],
      [w, 0],
      [0, -w],
    ])
      b.box(x ?? 0, x ?? 0, 0, Math.max(2, h - (Math.abs((x ?? 0) + v) % 3)), z ?? 0, z ?? 0, 'worldStone');
    if (v > 1) b.put(0, 0, w, 'worldMoss');
  } else if (r.kind === 'crystal geode') {
    for (let y = 0; y <= h; y++)
      for (let x = -w; x <= w; x++)
        for (let z = -w; z <= w; z++) {
          if (x * x + z * z > w * w + 1 || (z > 0 && y > 0)) continue;
          if (Math.abs(x) === w || z === -w || y === 0) b.put(x, y, z, 'worldStone');
        }
    for (let x = -w + 1; x < w; x++)
      b.box(x, x, 1, Math.max(1, h - Math.abs(x) - (v % 2)), -w + 1, -w + 1, 'worldLilac');
    b.put(0, 1, 0, 'signalLine');
  } else if (r.kind === 'giant fossil') {
    const d = r.depth;
    b.box(0, 0, 0, 1, -d, d, 'worldSnow');
    for (let z = -d + 1; z < d; z += 2)
      for (const x of [-w, w]) {
        b.box(x, x, 0, h, z, z, 'worldSnow');
        b.box(Math.min(0, x), Math.max(0, x), h, h, z, z, 'worldSnow');
      }
    b.box(-1, 1, 0, 2, d + 1, d + 3, 'worldSnow');
    b.put(-1, 2, d + 3, 'line3');
    b.put(1, 2, d + 3, 'line3');
  } else if (r.kind === 'hollow log' || r.kind === 'fungus stump' || r.kind === 'charred stump') {
    const wood = r.kind === 'charred stump' ? 'line3' : 'worldWood';
    if (r.kind === 'hollow log') {
      for (let x = -1; x <= 1; x++)
        for (let y = 0; y <= 2; y++) if (x !== 0 || y !== 1) b.box(x, x, y, y, -r.depth, r.depth, wood);
    } else {
      b.box(-1, 1, 0, 1, -r.depth, r.depth, wood);
      b.box(0, 0, 1, 1, -r.depth, r.depth, 'worldSand');
    }
    if (r.kind === 'fungus stump') {
      b.box(0, 0, 2, 3, 0, 0, 'worldSnow');
      b.disc(4, w + (v % 2), v > 1 ? 'worldSnow' : 'worldLilac');
    } else if (v % 2) b.put(1, 2, 0, r.kind === 'charred stump' ? 'worldEarth' : 'worldMoss');
  } else if (r.kind === 'cup mushroom' || r.kind === 'spore cluster') {
    b.box(0, 0, 0, h, 0, 0, 'worldSnow');
    b.disc(h, w, 'worldLilac');
    for (let x = -w; x <= w; x++)
      for (let z = -w; z <= w; z++)
        if (x * x + z * z <= w * w + 1 && (Math.abs(x) === w || Math.abs(z) === w))
          b.put(x, h + 1, z, v % 2 ? 'worldSnow' : 'worldLilac');
    if (r.kind === 'spore cluster') b.put(0, h + 1, 0, 'signalLine');
  } else if (r.kind === 'sulfur mound' || r.kind === 'ore boulder') {
    for (let y = 0; y < Math.min(h, w + 2); y++) b.disc(y, Math.max(0, w - Math.floor(y / 2)), 'worldStone');
    b.put(w, 1, 0, r.kind === 'sulfur mound' ? 'worldSand' : v % 2 ? 'worldIce' : 'worldHoney');
  } else if (r.kind === 'pinecone') {
    b.put(0, 0, 0, 'worldWood');
    b.disc(1, v % 2, 'worldEarth');
    b.put(0, 2, 0, 'worldWood');
  } else {
    const material = r.kind === 'dry grass' ? 'worldSand' : r.kind === 'leaf litter' ? 'worldEarth' : leaf;
    b.put(0, 0, 0, material);
    for (let x = -w; x <= w; x++)
      for (let z = -w; z <= w; z++) {
        if (Math.abs(x) + Math.abs(z) > w || (x * 7 + z + v) % 3 === 0) continue;
        const tall = ['dry grass', 'cotton grass', 'dwarf shrub', 'frost shrub'].includes(r.kind),
          height = tall ? 1 + (Math.abs(x + z + v) % 2) : 0;
        b.box(x, x, 0, height, z, z, material);
        if (r.kind === 'cotton grass' || r.kind === 'frost shrub') b.put(x, height + 1, z, 'worldSnow');
      }
  }
  return true;
}
