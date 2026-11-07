import { Blocks } from './builder';
import { THEMES, type Recipe } from './types';

export const ADVENTURE_BUILDINGS = [
  'watchtower',
  'windmill',
  'jungle shrine',
  'sandstone shrine',
  'ruined gateway',
  'greenhouse',
] as const;

export function adventureBuilding(r: Recipe, b: Blocks): boolean {
  if (!(ADVENTURE_BUILDINGS as readonly string[]).includes(r.kind)) return false;
  const w = r.width,
    d = r.depth,
    h = r.height,
    theme = THEMES[r.biome];
  b.box(-w, w, 0, 0, -d, d, 'worldStone');
  if (r.kind === 'watchtower') {
    for (const x of [-w, w]) for (const z of [-d, d]) b.box(x, x, 1, h + 3, z, z, 'worldWood');
    b.box(-w - 1, w + 1, h, h + 1, -d - 1, d + 1, 'worldWood');
    for (const x of [-w - 1, w + 1]) b.box(x, x, h + 2, h + 2, -d - 1, d + 1, 'worldWood');
    b.box(-w - 1, w + 1, h + 2, h + 2, -d - 1, -d - 1, 'worldWood');
    for (let y = 1; y < h; y++) b.box(-1, 1, y, y, d + 1, d + 1, y % 2 ? 'worldWood' : 'worldSand');
    for (let y = 0; y <= 2; y++) b.box(-w - 2 + y, w + 2 - y, h + 4 + y, h + 4 + y, -d - 2 + y, d + 2 - y, theme.roof);
  } else if (r.kind === 'windmill') {
    for (let y = 1; y <= h; y++) b.disc(y, Math.max(1, w - Math.floor(y / 4)), y % 3 ? 'worldSand' : 'worldWood');
    b.disc(h + 1, w + 1, theme.roof);
    b.disc(h + 2, w, theme.roof);
    const hub = h - 1,
      z = w + 2,
      reach = w + 3;
    b.box(0, 0, hub, hub, 0, z, 'worldWood');
    b.box(-reach, reach, hub, hub, z, z, 'worldWood');
    b.box(0, 0, hub - reach, hub + reach, z, z, 'worldWood');
    b.box(reach - 2, reach, hub + 1, hub + 2, z, z, 'worldSnow');
    b.box(-reach, -reach + 2, hub - 2, hub - 1, z, z, 'worldSnow');
    b.box(-2, -1, hub + reach - 2, hub + reach, z, z, 'worldSnow');
    b.box(1, 2, hub - reach, hub - reach + 2, z, z, 'worldSnow');
    b.box(0, 0, 1, 2, w, w + 1, 'line3');
  } else if (r.kind === 'greenhouse') {
    for (let y = 1; y <= h; y++)
      for (let x = -w; x <= w; x++)
        for (let z = -d; z <= d; z++) {
          if (Math.abs(x) !== w && Math.abs(z) !== d) continue;
          const frame = y === 1 || y === h || (Math.abs(x) === w && Math.abs(z) === d) || x % 3 === 0 || z % 3 === 0;
          if (frame) b.put(x, y, z, 'worldWood');
          else if (y === 2) b.put(x, y, z, 'worldIce');
        }
    for (let y = 0; y <= w; y++)
      for (let z = -d; z <= d; z++) {
        const radius = w - y;
        if (z % 2 === 0 || Math.abs(z) === d)
          b.box(-radius, radius, h + y + 1, h + y + 1, z, z, z % 2 === 0 ? 'worldWood' : 'worldIce');
        else for (const x of [-radius, radius]) b.put(x, h + y + 1, z, 'worldIce');
      }
    for (let z = -d + 1; z < d; z += 2)
      for (const x of [-w + 1, w - 1]) {
        b.put(x, 1, z, 'worldEarth');
        b.put(x, 2, z, 'worldLeaf');
        b.put(x, 3, z, 'worldHoney');
      }
    b.box(0, 0, 1, 2, d, d, 'worldWood');
  } else {
    const sand = r.kind === 'sandstone shrine',
      material = sand ? 'worldSand' : 'worldStone';
    for (let y = 1; y <= Math.min(3, h); y++)
      b.box(
        -Math.max(1, w - y + 1),
        Math.max(1, w - y + 1),
        y,
        y,
        -Math.max(1, d - y + 1),
        Math.max(1, d - y + 1),
        material,
      );
    const span = Math.max(1, w - 1),
      base = Math.min(3, h);
    for (const x of [-span, span]) b.box(x, x, 1, h + 3, -1, 1, material);
    b.box(-span, span, h + 3, h + 4, -1, 1, material);
    if (r.kind !== 'ruined gateway') b.box(-span - 1, span + 1, h + 5, h + 5, -2, 2, sand ? 'worldEarth' : 'worldMoss');
    if (r.variant % 2) b.box(-span, -span, base + 1, h + 2, 2, 2, sand ? 'worldEarth' : 'worldMoss');
    if (r.variant > 1) b.put(0, base + 1, 0, 'signalLine');
    for (const x of [-span, span]) {
      b.put(x, h + 2, 2, sand ? 'worldEarth' : 'worldMoss');
      b.put(x, h, 2, sand ? 'worldHoney' : 'worldMoss');
    }
    if (!sand && r.variant % 2) for (let y = base; y <= h; y++) b.put(span, y, -2, 'worldMoss');
  }
  return true;
}
