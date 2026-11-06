import type { Rng } from '../rng';
import { THEMES, voxel, type Block, type Material, type WorldSpec } from './types';

/** Every silhouette is bounded before placement, including eaves and foliage. */
export function model(kind: string, p: WorldSpec, rng: Rng): Block[] {
  const blocks = new Map<string, Block>();
  const theme = THEMES[p.biome];
  const put = (x: number, y: number, z: number, material: Material): void => {
    blocks.set(voxel(x, y, z), { x, y, z, material });
  };
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, m: Material): void => {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) put(x, y, z, m);
  };
  const disc = (y: number, radius: number, m: Material): void => {
    for (let x = -radius; x <= radius; x++)
      for (let z = -radius; z <= radius; z++) if (x * x + z * z <= radius * radius + 1) put(x, y, z, m);
  };
  if (kind === 'snow tuft') {
    put(0, 0, 0, 'worldSnow');
  } else if (kind === 'sailboat') {
    for (let z = -3; z <= 3; z++) {
      const width = Math.abs(z) === 3 ? 0 : 1;
      box(-width, width, 0, 0, z, z, 'worldWood');
      for (const x of [-width, width]) put(x, 1, z, 'worldWood');
    }
    box(0, 0, 1, 7, 0, 0, 'worldWood');
    for (let y = 3; y <= 7; y++) box(1, Math.min(2, 8 - y), y, y, 0, 0, 'worldSnow');
    put(0, 7, 1, 'worldClay');
  } else if (kind === 'lantern') {
    box(0, 0, 0, 3, 0, 0, 'worldWood');
    box(0, 1, 4, 4, 0, 0, 'worldWood');
    put(1, 3, 0, 'worldHoney');
  } else if (kind === 'well') {
    for (let x = -1; x <= 1; x++)
      for (let z = -1; z <= 1; z++) {
        put(x, 0, z, 'worldStone');
        if (x !== 0 || z !== 0) put(x, 1, z, 'worldStone');
      }
    put(0, 1, 0, 'worldWater');
    for (const x of [-1, 1]) box(x, x, 2, 3, 0, 0, 'worldWood');
    box(-1, 1, 4, 4, -1, 1, theme.roof);
  } else if (kind === 'crop patch') {
    box(-1, 1, 0, 0, -1, 1, 'worldEarth');
    for (const x of [-1, 1]) for (let z = -1; z <= 1; z++) put(x, 1, z, 'worldHoney');
  } else if (kind === 'snowman') {
    disc(0, 1, 'worldSnow');
    box(0, 0, 1, 2, 0, 0, 'worldSnow');
    put(0, 3, 0, 'line3');
    put(0, 2, 1, 'worldEmber');
  } else if (kind === 'basalt spire') {
    disc(0, 1, 'line3');
    box(0, 0, 1, 5, 0, 0, 'line4');
    box(1, 1, 1, 2, 0, 0, 'line4');
  } else if (kind === 'fern') {
    put(0, 0, 0, theme.leaf);
    put(0, 1, 0, theme.leaf);
    for (const x of [-1, 1]) put(x, 1, 0, theme.leaf);
  } else if (kind === 'cottage') {
    box(-3, 3, 0, 0, -3, 3, 'worldStone');
    for (let y = 1; y <= 4; y++) {
      box(-3, 3, y, y, -3, -3, 'worldWood');
      box(-3, 3, y, y, 3, 3, 'worldWood');
      box(-3, -3, y, y, -3, 3, 'worldWood');
      box(3, 3, y, y, -3, 3, 'worldWood');
      if (y < 4) put(0, y, 3, 'line2');
    }
    for (const x of [-2, 2]) box(x, x, 2, 3, 3, 3, 'worldHoney');
    for (const z of [-1, 1]) box(3, 3, 2, 3, z, z, 'worldHoney');
    for (let k = 0; k < 5; k++) {
      box(-4, 4, 5 + k, 5 + k, -4 + k, -4 + k, theme.roof);
      box(-4, 4, 5 + k, 5 + k, 4 - k, 4 - k, theme.roof);
      if (k < 4) for (const x of [-3, 3]) box(x, x, 5 + k, 5 + k, -3 + k, 3 - k, 'worldWood');
      if (p.biome === 'snow') {
        box(-4, 4, 6 + k, 6 + k, -4 + k, -4 + k, 'worldSnow');
        box(-4, 4, 6 + k, 6 + k, 4 - k, 4 - k, 'worldSnow');
      }
    }
    box(-2, -1, 6, 10, -2, -1, 'worldStone');
    box(-2, 2, 0, 0, 4, 6, 'worldWood');
    for (const x of [-2, 2]) box(x, x, 1, 1, 5, 6, 'worldWood');
  } else if (kind === 'tree' || kind === 'pine' || kind === 'palm') {
    const height = 5 + Math.floor(rng() * 3);
    box(0, 0, 0, height, 0, 0, 'worldWood');
    if (kind === 'palm') {
      for (let d = 1; d <= 3; d++)
        for (const s of [-1, 1]) {
          put(s * d, height + (d < 3 ? 1 : 0), 0, theme.leaf);
          put(0, height + (d < 3 ? 1 : 0), s * d, theme.leaf);
        }
      disc(height + 1, 1, theme.leaf);
    } else if (kind === 'pine') {
      for (let y = 3; y <= height + 3; y++) {
        const r = Math.max(0, Math.ceil((height + 3 - y) / 2));
        disc(y, r, theme.leaf);
        if (p.biome === 'snow' && y % 2 === 0) disc(y + 1, Math.max(0, r - 1), 'worldSnow');
      }
    } else {
      for (let y = height - 2; y <= height + 2; y++) disc(y, Math.abs(y - height) === 2 ? 1 : 2, theme.leaf);
      put(2, height, 0, 'worldHoney');
    }
  } else if (kind === 'mushroom' || kind === 'giant mushroom') {
    const big = kind === 'giant mushroom';
    const h = big ? 5 : 2;
    box(0, 0, 0, h, 0, 0, 'worldSnow');
    disc(h + 1, big ? 3 : 1, p.biome === 'mushroom' ? 'worldLilac' : 'worldClay');
    disc(h + 2, big ? 2 : 0, p.biome === 'mushroom' ? 'worldLilac' : 'worldClay');
    if (big)
      for (const [x, z] of [
        [-2, 0],
        [1, 1],
        [0, -2],
      ])
        put(x ?? 0, h + 2, z ?? 0, 'worldSnow');
  } else if (kind === 'cauldron') {
    for (let y = 0; y < 3; y++)
      for (let x = -1; x <= 1; x++)
        for (let z = -1; z <= 1; z++) if (y === 0 || x !== 0 || z !== 0) put(x, y, z, 'line4');
    put(0, 1, 0, 'signal');
  } else if (kind === 'campfire') {
    for (const d of [-1, 0, 1]) {
      put(d, 0, 0, 'worldWood');
      put(0, 0, d, 'worldWood');
    }
    put(0, 1, 0, 'worldEmber');
    put(0, 2, 0, 'worldHoney');
  } else if (kind === 'crystal') {
    box(0, 0, 0, 3 + Math.floor(rng() * 3), 0, 0, 'worldIce');
    box(1, 1, 0, 2, 0, 0, 'worldLilac');
    box(0, 0, 0, 1, 1, 1, 'signal');
  } else if (kind === 'rock') {
    disc(0, 1, 'worldStone');
    put(0, 1, 0, 'worldStone');
  } else if (kind === 'bush') {
    disc(0, 1, theme.leaf);
    put(0, 1, 0, theme.leaf);
    if (rng() > 0.5) put(1, 0, 0, 'worldHoney');
  } else if (kind === 'cactus') {
    box(0, 0, 0, 4, 0, 0, 'worldLeaf');
    box(-1, -1, 2, 3, 0, 0, 'worldLeaf');
    put(1, 2, 0, 'worldLeaf');
  } else {
    put(0, 0, 0, theme.leaf);
    put(0, 1, 0, p.biome === 'mushroom' ? 'worldLilac' : 'worldHoney');
  }
  return [...blocks.values()];
}
