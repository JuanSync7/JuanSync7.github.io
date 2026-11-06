import { Blocks } from './builder';
import { THEMES, type Recipe, type Block } from './types';

export function detail(r: Recipe): Block[] {
  const b = new Blocks(),
    theme = THEMES[r.biome],
    h = r.height;
  if (r.kind === 'giant mushroom' || r.kind === 'mushroom') {
    const size = r.kind === 'mushroom' ? 1 : r.width;
    b.box(0, 0, 0, h, 0, 0, 'worldSnow');
    b.disc(h + 1, size, theme.roof);
    b.disc(h + 2, Math.max(0, size - 1), theme.roof);
    if (size > 1) for (const x of [-1, 1]) b.put(x, h + 2, 0, 'worldSnow');
  } else if (r.kind === 'bones') {
    b.box(0, 0, 0, 0, -r.depth, r.depth, 'worldSnow');
    for (let z = -r.depth + 1; z < r.depth; z += 2) {
      for (const x of [-1, 1]) {
        b.put(x, 1, z, 'worldSnow');
        b.put(x, 2, z, 'worldSnow');
      }
      b.put(0, 2, z, 'worldSnow');
    }
  } else if (r.kind === 'skull') {
    b.box(-1, 1, 0, 1, -1, 1, 'worldSnow');
    b.put(-1, 1, 1, 'line3');
    b.put(1, 1, 1, 'line3');
    b.put(0, 0, 1, 'line3');
  } else if (r.kind === 'cactus') {
    b.box(0, 0, 0, h, 0, 0, 'worldLeaf');
    b.box(1, 1, Math.max(1, h - 3), h - 1, 0, 0, 'worldLeaf');
    b.put(-1, Math.max(1, h - 2), 0, 'worldLeaf');
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
    if (r.kind === 'well') {
      for (const x of [-1, 1]) b.box(x, x, 2, 3, 0, 0, 'worldWood');
      b.box(-1, 1, 4, 4, -1, 1, theme.roof);
    }
  } else if (r.kind === 'snowman') {
    b.disc(0, 1, 'worldSnow');
    b.box(0, 0, 1, 2, 0, 0, 'worldSnow');
    b.put(0, 3, 0, 'line3');
    b.put(0, 2, 1, 'worldEmber');
  } else if (r.kind === 'fallen log') {
    b.box(0, 0, 0, 1, -r.depth, r.depth, 'worldWood');
    b.put(0, 1, r.depth, 'worldSand');
  } else if (r.kind === 'crop patch') {
    b.box(-1, 1, 0, 0, -1, 1, 'worldEarth');
    for (const x of [-1, 1]) for (let z = -1; z <= 1; z++) b.put(x, 1, z, 'worldHoney');
  } else if (r.kind === 'crate' || r.kind === 'park bench') {
    b.box(-1, 1, 0, r.kind === 'crate' ? 1 : 0, -1, 1, 'worldWood');
    if (r.kind === 'park bench') b.box(-1, 1, 1, 1, -1, -1, 'worldWood');
  } else if (r.kind === 'dead bush') {
    b.box(0, 0, 0, 1, 0, 0, 'worldWood');
    b.put(-1, 1, 0, 'worldWood');
    b.put(1, 1, 0, 'worldWood');
  } else {
    b.put(0, 0, 0, r.kind === 'snow tuft' ? 'worldSnow' : theme.leaf);
    if (r.kind !== 'snow tuft') b.put(0, 1, 0, r.kind === 'flower' ? 'worldHoney' : theme.leaf);
    if (r.kind === 'fern' || r.kind === 'reeds') {
      b.put(0, 2, 0, theme.leaf);
      b.put(-1, 1, 0, theme.leaf);
      b.put(1, 1, 0, theme.leaf);
    }
  }
  return b.result(r.turn);
}
