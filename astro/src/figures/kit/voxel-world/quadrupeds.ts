import { Blocks } from './builder';
import type { Material, Recipe } from './types';

/** Species change proportions, silhouette, markings and appendages, as well as colour. */
export function quadruped(r: Recipe, b: Blocks, skin: Material): void {
  const v = r.variant,
    w = r.width,
    d = Math.max(2, r.depth),
    long = r.kind === 'camel' || r.kind === 'deer',
    body = r.kind === 'fox' ? 2 : 3;
  for (const x of [-w, w])
    for (const z of [-d, d]) {
      b.box(x, x, 0, body - 1, z, z, skin);
      b.put(x, 0, z, r.kind === 'polar bear' ? 'worldSnow' : 'worldEarth');
    }
  b.box(-w, w, body, body + 1, -d, d, skin);
  const head = long ? (r.kind === 'camel' ? 7 : 6) : body + 1;
  b.box(0, 0, body + 1, head, d, d, skin);
  b.box(-1, 1, head, head + 1, d + 1, d + 2, skin);
  b.box(0, 0, head, head, d + 3, d + 3, r.kind === 'fox' ? 'worldSnow' : skin);
  b.put(0, head, d + 3, r.kind === 'polar bear' ? 'line3' : skin);
  for (const x of [-1, 1]) {
    b.put(x, head + 1, d + 1, 'line3');
    b.put(x, head + 2, d + 1, skin);
  }
  if (r.kind === 'deer')
    for (const x of [-1, 1]) {
      b.box(x, x, head + 2, head + 3, d, d, 'worldWood');
      b.put(x * 2, head + 3, d, 'worldWood');
      if (v > 1) b.put(x, head + 4, d, 'worldWood');
    }
  if (r.kind === 'camel') {
    b.box(-w, w, body + 2, body + 2, -1, 0, 'worldSand');
    b.put(0, body + 3, 0, 'worldSand');
    if (v % 2) b.put(0, body + 2, -d + 1, 'worldSand');
  }
  if (r.kind === 'cow') {
    b.put(w, body, 0, 'line3');
    b.put(-w, body + 1, -d + 1, 'line3');
    for (const x of [-2, 2]) b.put(x, head + 1, d + 1, 'worldSand');
    b.put(0, body - 1, 0, 'worldClay');
  }
  if (r.kind === 'sheep') {
    b.box(-w, w, body + 2, body + 2, -d + 1, d - 1, 'worldSnow');
    b.put(-w, body, 0, v % 2 ? 'worldEarth' : 'worldSnow');
  }
  if (r.kind === 'boar') for (const x of [-1, 1]) b.put(x, head, d + 3, 'worldSnow');
  const tail = r.kind === 'fox' ? 3 : 1;
  for (let z = 1; z <= tail; z++)
    b.put(0, body + (z > 1 ? 1 : 0), -d - z, z === tail && r.kind === 'fox' ? 'worldSnow' : skin);
  if (tail > 1) b.put(0, body + 1, -d - 1, skin);
  if (v % 2) b.put(0, body + 2, -d, skin);
}
