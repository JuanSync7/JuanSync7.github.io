import { BOUND, inset, type Box, type Pt, type Sketch } from './sketch';
import { parcels } from './map-parcels';
import type { MapBlock, MapRoad, MapRiver, UrbanPlan } from './map-types';

function divide(S: Sketch, lo: number, hi: number, pitch: number): number[] {
  const n = Math.max(1, Math.round((hi - lo) / pitch));
  const out = [lo];
  for (let i = 1; i < n; i++) out.push(lo + ((hi - lo) * (i + S.r(-0.15, 0.15))) / n);
  return [...out, hi];
}

/** Street centres own the geometry. The selected parcel's four kerbs are the zoom window. */
export function makeUrban(S: Sketch, detail: 'city' | 'district'): UrbanPlan {
  S.select([S.r(-0.42, 0.42), S.r(-0.2, 0.2)], detail === 'city' ? 'district' : 'block');
  const selected = S.win;
  const half = detail === 'city' ? 0.018 : 0.032;
  const frame = inset(BOUND, half + 0.01);
  const left = selected[0] - half;
  const right = selected[2] + half;
  const top = selected[1] - half;
  const bottom = selected[3] + half;
  const pitch = detail === 'city' ? S.r(0.28, 0.38) : S.r(0.6, 0.85);
  const riverX = S.w[0] >= 0 ? -1.13 : 1.13;
  const riverHalf = detail === 'city' ? 0.075 : 0.095;
  const water = detail === 'city' || S.chance(0.42);
  const shore = riverHalf + half + 0.022;
  const axis = (lo: number, a: number, b: number, hi: number, step: number): number[] => [
    ...divide(S, lo, a, step).slice(0, -1),
    a,
    b,
    ...divide(S, b, hi, step).slice(1),
  ];
  let xs = axis(frame[0], left, right, frame[2], pitch);
  const ys = axis(frame[1], top, bottom, frame[3], pitch * 0.65);
  if (water) {
    xs = [...xs.filter((x) => Math.abs(x - riverX) > shore + 0.065), riverX - shore, riverX + shore].sort(
      (a, b) => a - b,
    );
  }
  const river: MapRiver | null = water
    ? {
        corridor: [riverX - riverHalf - 0.012, BOUND[1], riverX + riverHalf + 0.012, BOUND[3]],
        banks: [-1, 1].map((side) =>
          Array.from({ length: 37 }, (_, i): Pt => {
            const y = BOUND[1] + ((BOUND[3] - BOUND[1]) * i) / 36;
            return [riverX + side * riverHalf + Math.sin(y * 6 + riverX) * 0.009, y];
          }),
        ) as [Pt[], Pt[]],
      }
    : null;
  const roads: MapRoad[] = [];
  const intersections: Pt[] = [];
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i];
    if (x === undefined) continue;
    for (let j = 0; j < ys.length; j++) {
      const y = ys[j];
      if (y === undefined) continue;
      intersections.push([x, y]);
      const nx = xs[i + 1];
      const ny = ys[j + 1];
      if (nx !== undefined)
        roads.push({
          id: `h${i}-${j}`,
          points: [
            [x, y],
            [nx, y],
          ],
          width: half * 2,
          bridge: water && x < riverX && nx > riverX,
        });
      if (ny !== undefined)
        roads.push({
          id: `v${i}-${j}`,
          points: [
            [x, y],
            [x, ny],
          ],
          width: half * 2,
          bridge: false,
        });
    }
  }
  const blocks: MapBlock[] = [];
  for (let i = 1; i < xs.length; i++) {
    for (let j = 1; j < ys.length; j++) {
      const x0 = xs[i - 1];
      const x1 = xs[i];
      const y0 = ys[j - 1];
      const y1 = ys[j];
      if (x0 === undefined || x1 === undefined || y0 === undefined || y1 === undefined) continue;
      if (water && x0 < riverX && x1 > riverX) continue;
      const b: Box = [x0 + half, y0 + half, x1 - half, y1 - half];
      if (b[2] - b[0] < 0.045 || b[3] - b[1] < 0.04) continue;
      const isSelected = Math.abs(b[0] - selected[0]) < 1e-6 && Math.abs(b[1] - selected[1]) < 1e-6;
      const roll = S.rng();
      const kind: MapBlock['kind'] = isSelected
        ? 'selected'
        : roll < 0.12
          ? 'park'
          : roll < 0.25
            ? 'courtyard'
            : roll < 0.31
              ? 'civic'
              : 'residential';
      blocks.push({ bounds: b, kind, buildings: parcels(S, b, detail, kind) });
    }
  }
  return { kind: detail, selected, roads, intersections, blocks, river };
}
