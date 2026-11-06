import { Blocks } from './builder';
import { COLD, THEMES, type Recipe, type Material, type Block } from './types';

export function building(r: Recipe): Block[] {
  const b = new Blocks(),
    w = r.width,
    d = r.depth,
    h = r.height,
    theme = THEMES[r.biome];
  const wall: Material = r.variant % 3 === 0 ? 'worldWood' : r.variant % 3 === 1 ? 'worldStone' : 'worldSand';
  b.box(-w, w, 0, 0, -d, d, 'worldStone');
  if (r.kind === 'tent') {
    const canvas: Material = r.variant % 2 ? 'worldClay' : 'worldSnow';
    for (let y = 1; y <= h; y++) {
      const width = Math.max(0, Math.ceil(w * (1 - y / h)));
      for (let z = -d; z <= d; z++) {
        b.put(-width, y, z, canvas);
        b.put(width, y, z, canvas);
      }
      if (width) b.box(-width, width, y, y, -d, -d, canvas);
    }
    b.box(0, 0, 1, h + 1, -d, -d, 'worldWood');
    return b.result(r.turn);
  }
  for (let y = 1; y <= h; y++)
    for (let x = -w; x <= w; x++)
      for (let z = -d; z <= d; z++) {
        if (Math.abs(x) !== w && Math.abs(z) !== d) continue;
        if (r.kind === 'ruin' && (x * 3 + z * 7 + r.variant + y) % 5 > 1 && y > 1) continue;
        const window = y % 3 === 2 && (Math.abs(x) === w ? z % 2 === 0 : x % 2 === 0);
        b.put(
          x,
          y,
          z,
          window ? (r.variant % 2 ? 'worldHoney' : 'worldIce') : r.kind === 'tower' && y % 3 === 0 ? 'inkMuted' : wall,
        );
      }
  b.box(0, 0, 1, Math.min(3, h), d, d, 'line2');
  if (r.kind === 'ruin') return b.result(r.turn);
  if (r.kind === 'tower' || r.variant === 0) {
    b.box(-w - 1, w + 1, h + 1, h + 1, -d - 1, d + 1, theme.roof);
    if (r.kind === 'tower') {
      b.box(-1, 1, h + 2, h + 3, -1, 1, 'line4');
      b.box(0, 0, h + 4, h + 6, 0, 0, 'inkMuted');
    }
  } else {
    for (let y = 0; y <= d + 1; y++) {
      const extent = d + 1 - y,
        half = r.variant === 3 ? Math.max(0, w + 1 - y) : w + 1;
      b.box(-half, half, h + y + 1, h + y + 1, -extent, extent, theme.roof);
      if (COLD.has(r.biome)) b.box(-half, half, h + y + 2, h + y + 2, -extent, extent, 'worldSnow');
    }
  }
  if (r.kind === 'cottage' && r.variant > 0) b.box(-w + 1, -w + 1, h + 1, h + d + 4, -1, -1, 'worldStone');
  return b.result(r.turn);
}
