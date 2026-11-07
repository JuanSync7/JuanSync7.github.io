import { inset, type Box, type Pt, type Sketch } from './sketch';
import type { MapBlock, MapBuilding } from './map-types';

/** Parcels are cut from street frontage inward, rather than scattered inside a block. */
export function parcels(S: Sketch, b: Box, detail: 'city' | 'district', kind: MapBlock['kind']): MapBuilding[] {
  const lot = inset(b, detail === 'city' ? 0.014 : 0.035);
  const [x0, y0, x1, y1] = lot;
  const w = x1 - x0;
  const h = y1 - y0;
  const out: MapBuilding[] = [];
  if (w < 0.065 || h < 0.06 || kind === 'park' || kind === 'selected') return out;
  const add = (bounds: Box, entry: Pt, access: Pt[], use: MapBuilding['kind']): void => {
    out.push({ bounds, entry, access, kind: use });
  };
  if (kind === 'civic') {
    const f = inset(lot, Math.min(w, h) * 0.16);
    const entry: Pt = [(f[0] + f[2]) / 2, f[3]];
    add(f, entry, [entry, [entry[0], b[3]]], 'slab');
    return out;
  }
  if (kind === 'courtyard' && w > 0.18 && h > 0.15) {
    const entry: Pt = [(x0 + x1) / 2, y1];
    add(lot, entry, [entry, [entry[0], b[3]]], 'court');
    return out;
  }
  const horizontal = w > h * 0.8;
  const frontage = horizontal ? w : h;
  const depth = horizontal ? h : w;
  const rows = depth > (detail === 'city' ? 0.13 : 0.23) ? 2 : 1;
  const count = Math.max(1, Math.floor(frontage / (detail === 'city' ? S.r(0.065, 0.09) : S.r(0.16, 0.23))));
  const pitch = frontage / count;
  for (let row = 0; row < rows; row++) {
    for (let i = 0; i < count; i++) {
      const f0 = i * pitch + pitch * 0.1;
      const f1 = (i + 1) * pitch - pitch * 0.1;
      const d0 = row === 0 ? 0 : depth * 0.57;
      const d1 = row === 0 ? depth * (rows === 1 ? 0.82 : 0.43) : depth;
      const f: Box = horizontal ? [x0 + f0, y0 + d0, x0 + f1, y0 + d1] : [x0 + d0, y0 + f0, x0 + d1, y0 + f1];
      const entry: Pt = horizontal
        ? [(f[0] + f[2]) / 2, row === 0 ? f[1] : f[3]]
        : [row === 0 ? f[0] : f[2], (f[1] + f[3]) / 2];
      const street: Pt = horizontal ? [entry[0], row === 0 ? b[1] : b[3]] : [row === 0 ? b[0] : b[2], entry[1]];
      add(f, entry, [entry, street], detail === 'city' ? 'terrace' : 'house');
    }
  }
  return out;
}
