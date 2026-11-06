import { Blocks } from './builder';
import { THEMES, type Recipe, type Block } from './types';
import { FLORA_DETAILS, floraDetail } from './flora-details';
import { GEOLOGY_DETAILS, geologyDetail } from './geology-details';
import { SETTLEMENT_DETAILS, settlementDetail } from './settlement-details';

export const DETAIL_KINDS = new Set([
  ...FLORA_DETAILS,
  ...GEOLOGY_DETAILS,
  ...SETTLEMENT_DETAILS,
  'giant mushroom',
  'mushroom',
  'bones',
  'skull',
  'cactus',
  'ice spire',
  'crystal',
  'stalagmite',
  'basalt spire',
  'rock',
  'bush',
  'lantern',
  'cauldron',
  'well',
  'snowman',
  'fallen log',
  'crop patch',
  'crate',
  'park bench',
  'dead bush',
  'snow tuft',
  'flower',
  'fern',
  'reeds',
  'grass',
]);

export function detail(r: Recipe): Block[] {
  if (!DETAIL_KINDS.has(r.kind)) throw new Error(`Unknown voxel detail: ${r.kind}`);
  const b = new Blocks(),
    theme = THEMES[r.biome],
    h = r.height;
  if (floraDetail(r, b) || geologyDetail(r, b) || settlementDetail(r, b)) return b.result(r.turn);
  if (r.kind === 'giant mushroom' || r.kind === 'mushroom') {
    const size = r.kind === 'mushroom' ? 1 : r.width;
    b.box(0, 0, 0, h, 0, 0, 'worldSnow');
    const cap = r.variant % 2 ? 'worldLilac' : theme.roof;
    b.disc(h + 1, size, cap);
    b.disc(h + 2, Math.max(0, size - 1), cap);
    if (r.variant > 1) b.put(0, h + 3, 0, cap);
    if (size > 1) for (const x of [-1, 1]) b.put(x, h + 2, 0, 'worldSnow');
  } else if (r.kind === 'bones') {
    b.box(0, 0, 0, 0, -r.depth, r.depth, 'worldSnow');
    for (let z = -r.depth + 1; z < r.depth; z += 2) {
      for (const x of [-1, 1]) {
        b.put(x, 1, z, 'worldSnow');
        b.put(x, 0, z, 'worldSnow');
        b.put(x, 2, z, 'worldSnow');
      }
      b.put(0, 2, z, 'worldSnow');
    }
  } else if (r.kind === 'skull') {
    b.box(-1, 1, 0, 1, -1, 1, 'worldSnow');
    b.put(-1, 1, 1, 'line3');
    b.put(1, 1, 1, 'line3');
    b.put(0, 0, 1, 'line3');
    if (r.variant % 2) for (const x of [-2, 2]) b.box(x, x, 1, 2, 0, 0, 'worldSnow');
  } else if (r.kind === 'cactus') {
    b.box(0, 0, 0, h, 0, 0, 'worldLeaf');
    if (r.variant !== 0) b.box(1, 1, Math.max(1, h - 3), h - 1, 0, 0, 'worldLeaf');
    if (r.variant > 1) b.put(-1, Math.max(1, h - 2), 0, 'worldLeaf');
    if (r.variant === 3) b.put(0, h + 1, 0, 'worldHoney');
  } else if (['ice spire', 'crystal', 'stalagmite', 'basalt spire'].includes(r.kind)) {
    const material =
      r.kind === 'ice spire'
        ? 'worldIce'
        : r.kind === 'crystal'
          ? 'worldLilac'
          : r.kind === 'basalt spire'
            ? 'line4'
            : 'worldStone';
    b.disc(0, 1, material);
    b.box(0, 0, 1, h, 0, 0, material);
    if (r.variant % 2) b.box(1, 1, 1, Math.max(1, h - 2), 0, 0, material);
  } else if (r.kind === 'rock' || r.kind === 'bush') {
    const material = r.kind === 'rock' ? 'worldStone' : theme.leaf;
    for (let y = 0; y <= Math.min(2, h); y++) b.disc(y, Math.max(0, r.width - y), material);
  } else if (r.kind === 'lantern') {
    b.box(0, 0, 0, h, 0, 0, 'worldWood');
    b.put(1, h, 0, 'worldWood');
    b.put(1, h - 1, 0, 'worldHoney');
  } else if (r.kind === 'cauldron' || r.kind === 'well') {
    b.box(-1, 1, 0, 0, -1, 1, r.kind === 'well' ? 'worldStone' : 'line4');
    for (let x = -1; x <= 1; x++) for (let z = -1; z <= 1; z++) b.put(x, 1, z, x || z ? 'worldStone' : 'signal');
    if (r.kind === 'cauldron' && r.variant % 2) for (const x of [-2, 2]) b.put(x, 1, 0, 'line4');
    if (r.kind === 'cauldron' && r.variant > 1) b.put(0, 2, 0, 'signalLine');
    if (r.kind === 'well') {
      for (const x of [-1, 1]) b.box(x, x, 2, 3, 0, 0, 'worldWood');
      b.box(-1, 1, 4, 4, -1, 1, theme.roof);
      if (r.variant % 2) b.box(-1, 1, 5, 5, 0, 0, theme.roof);
    }
  } else if (r.kind === 'snowman') {
    b.disc(0, 1, 'worldSnow');
    b.box(0, 0, 1, 2, 0, 0, 'worldSnow');
    b.put(0, 3, 0, 'line3');
    b.put(0, 2, 1, 'worldEmber');
    if (r.variant % 2) for (const x of [-1, 1]) b.put(x, 1, 0, 'worldWood');
    if (r.variant > 1) b.put(0, 4, 0, 'line3');
  } else if (r.kind === 'fallen log') {
    b.box(0, 0, 0, 1, -r.depth, r.depth, 'worldWood');
    b.put(0, 1, r.depth, 'worldSand');
    if (r.variant % 2) for (let z = -r.depth; z < r.depth; z += 2) b.put(0, 2, z, 'worldMoss');
  } else if (r.kind === 'crop patch') {
    b.box(-1, 1, 0, 0, -1, 1, 'worldEarth');
    for (const x of [-1, 1]) for (let z = -1; z <= 1; z++) b.box(x, x, 1, Math.min(3, h - 1), z, z, 'worldHoney');
  } else if (r.kind === 'crate' || r.kind === 'park bench') {
    b.box(-r.width, r.width, 0, r.kind === 'crate' ? Math.min(3, h) : 0, -1, 1, 'worldWood');
    if (r.kind === 'park bench') b.box(-r.width, r.width, 1, 1 + (r.variant % 2), -1, -1, 'worldWood');
    else b.box(-r.width, r.width, Math.min(3, h), Math.min(3, h), 0, 0, 'worldSand');
  } else if (r.kind === 'dead bush') {
    b.box(0, 0, 0, 1 + (r.variant % 2), 0, 0, 'worldWood');
    b.put(-1, 1, 0, 'worldWood');
    b.put(1, 1, 0, 'worldWood');
  } else {
    if (r.kind === 'snow tuft') {
      b.disc(0, r.variant % 2, 'worldSnow');
      if (r.variant > 1) b.put(0, 1, 0, 'worldSnow');
      return b.result(r.turn);
    }
    b.put(0, 0, 0, r.kind === 'snow tuft' ? 'worldSnow' : theme.leaf);
    const stem = 1 + (r.variant % 2);
    b.box(0, 0, 1, stem, 0, 0, theme.leaf);
    if (r.kind === 'flower') {
      b.put(0, stem + 1, 0, r.variant % 2 ? 'worldLilac' : 'worldHoney');
      if (r.variant > 1) for (const x of [-1, 1]) b.put(x, stem + 1, 0, 'worldSnow');
    }
    if (r.kind === 'fern' || r.kind === 'reeds') {
      b.put(0, 2, 0, theme.leaf);
      b.put(-1, 1, 0, theme.leaf);
      b.put(1, 1, 0, theme.leaf);
      if (r.variant > 1) for (const z of [-1, 1]) b.put(0, 2, z, theme.leaf);
    }
  }
  return b.result(r.turn);
}
