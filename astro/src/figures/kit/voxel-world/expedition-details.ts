import { Blocks } from './builder';
import type { Recipe } from './types';

export const EXPEDITION_DETAILS = [
  'woodpile',
  'beehive',
  'scarecrow',
  'watering trough',
  'water urn',
  'tool rack',
  'torch post',
  'crate stack',
  'street bollard',
  'mailbox',
  'scrap heap',
  'rusted pipe',
  'toppled column',
  'fence segment',
  'supply chest',
  'broken sled',
] as const;

export function expeditionDetail(r: Recipe, b: Blocks): boolean {
  if (!(EXPEDITION_DETAILS as readonly string[]).includes(r.kind)) return false;
  const w = r.width,
    h = Math.min(4, r.height),
    v = r.variant;
  if (r.kind === 'woodpile') {
    for (let x = -w; x <= w; x++) b.box(x, x, 0, 1, -r.depth, r.depth, 'worldWood');
    if (v % 2) b.box(0, 0, 2, 2, -r.depth, r.depth, 'worldWood');
    for (let x = -w; x <= w; x++) b.put(x, 1, r.depth, 'worldSand');
  } else if (r.kind === 'beehive') {
    for (let y = 0; y < h; y++) b.disc(y, y === h - 1 ? 0 : w, y % 2 ? 'worldHoney' : 'worldSand');
    b.put(0, 1, w, 'line3');
  } else if (r.kind === 'scarecrow') {
    b.box(0, 0, 0, h, 0, 0, 'worldWood');
    b.box(-w - 1, w + 1, h - 1, h - 1, 0, 0, 'worldWood');
    b.put(0, h + 1, 0, 'worldSand');
    b.box(-1, 1, h + 2, h + 2, 0, 0, v % 2 ? 'worldClay' : 'worldWood');
  } else if (r.kind === 'watering trough' || r.kind === 'water urn') {
    b.disc(0, w, 'worldClay');
    b.disc(1, w, 'worldClay');
    b.put(0, 1, 0, 'worldWater');
    if (v % 2) for (const x of [-w, w]) b.put(x, 2, 0, 'worldClay');
  } else if (r.kind === 'tool rack' || r.kind === 'torch post' || r.kind === 'mailbox') {
    b.box(0, 0, 0, h, 0, 0, 'worldWood');
    if (r.kind === 'tool rack') {
      b.box(-w, w, h, h, 0, 0, 'worldWood');
      b.put(-w, h - 1, 0, 'worldStone');
      b.put(w, h - 1, 0, 'worldStone');
    } else if (r.kind === 'torch post') {
      b.put(0, h + 1, 0, 'worldEmber');
      if (v % 2) b.put(0, h + 2, 0, 'worldHoney');
    } else {
      b.box(-1, 1, h, h + 1, 0, 1, 'worldClay');
      b.put(1, h + 2, 0, v % 2 ? 'worldHoney' : 'worldSnow');
    }
  } else if (r.kind === 'rusted pipe') {
    b.box(-w, w, 0, 0, 0, 0, 'worldStone');
    b.box(-w, -w, 1, h, 0, 0, 'worldClay');
    b.box(-w, w, h, h, 0, 0, 'worldClay');
    b.put(w, h, 1, 'line3');
    if (v % 2) b.put(0, h + 1, 0, 'worldStone');
  } else if (r.kind === 'toppled column') {
    for (let x = -w; x <= w; x++)
      for (let y = 0; y <= 2 * w; y++)
        if (x * x + (y - w) ** 2 <= w * w + 1) b.box(x, x, y, y, -r.depth, r.depth, 'worldStone');
    b.box(-w, w, 0, 2 * w, -r.depth, -r.depth, v % 2 ? 'worldSand' : 'worldStone');
  } else if (r.kind === 'broken sled') {
    for (const x of [-w, w]) b.box(x, x, 0, 0, -r.depth, r.depth, 'worldWood');
    b.box(-w, w, 1, v % 2 ? 2 : 1, -r.depth, r.depth, 'worldWood');
  } else if (r.kind === 'fence segment') {
    for (const x of [-w - 1, w + 1]) b.box(x, x, 0, h, 0, 0, 'worldWood');
    b.box(-w - 1, w + 1, 1, 1, 0, 0, 'worldWood');
    if (v % 2) b.box(-w - 1, w + 1, h, h, 0, 0, 'worldWood');
  } else if (r.kind === 'street bollard') {
    b.put(0, 0, 0, 'worldStone');
    b.box(0, 0, 1, 1 + (v % 2), 0, 0, 'line3');
    b.put(0, 2 + (v % 2), 0, 'worldHoney');
  } else {
    const scrap = r.kind === 'scrap heap';
    for (let y = 0; y < h; y++)
      b.box(-Math.max(0, w - y), Math.max(0, w - y), y, y, -1, 1, scrap ? 'line4' : 'worldWood');
    b.put(0, h, 0, scrap ? 'worldClay' : 'worldSand');
    if (r.kind === 'crate stack' && v % 2) b.box(w, w + 1, 0, 1, 0, 1, 'worldWood');
  }
  return true;
}
