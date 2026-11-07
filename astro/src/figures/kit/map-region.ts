import { BOUND, overlaps, type Box, type Pt, type Sketch } from './sketch';
import { contours } from './map-contours';
import type { MapRoad, MapRiver, RegionPlan, RegionTown } from './map-types';

/** A coastal valley: the stream is the valley floor and strictly loses elevation to its estuary. */
export function makeRegion(S: Sketch): RegionPlan {
  const landDirection = S.chance(0.5) ? 1 : -1;
  const side = S.chance(0.5) ? 1 : -1;
  S.select([side * S.r(0.56, 0.68), landDirection * 0.28], 'city');
  const selected = S.win;
  const phase = S.r(0, Math.PI * 2);
  const riverX = (v: number): number => -side * 0.65 + Math.sin(v * 3 + phase) * 0.075;
  const peakX = -side * S.r(1.3, 1.6);
  const peakY = S.r(0.2, 0.55);
  const elevation = (x: number, y: number): number => {
    const v = y * landDirection;
    const q = x - riverX(v);
    const hill = 0.9 * Math.exp(-Math.pow((x - peakX) / 0.42, 2) - Math.pow((v - peakY) / 0.3, 2));
    return v + 0.46 + q * q * (0.08 + hill);
  };
  const lines = contours(
    elevation,
    Array.from({ length: 12 }, (_, i) => i * 0.16),
  );
  const coast = lines.filter((l) => l.elevation === 0).map((l) => l.points);
  const banks = [-1, 1].map((bank) =>
    Array.from({ length: 61 }, (_, i): Pt => {
      const v = BOUND[3] - ((BOUND[3] + 0.46) * i) / 60;
      const width = 0.009 + (1 - i / 60) * 0.002 + (i / 60) * 0.009;
      return [riverX(v) + bank * width, landDirection * v];
    }),
  ) as [Pt[], Pt[]];
  const river: MapRiver = {
    banks,
    corridor: [
      Math.min(...banks.flat().map((p) => p[0])),
      BOUND[1],
      Math.max(...banks.flat().map((p) => p[0])),
      BOUND[3],
    ],
  };
  const trunk = landDirection * 0.67;
  const towns: RegionTown[] = [];
  for (let i = 0; i < 9; i++) {
    const x = -1.65 + i * 0.41 + S.r(-0.035, 0.035);
    const v = S.r(0.05, 0.39);
    const hw = S.r(0.065, 0.095);
    const hh = S.r(0.035, 0.055);
    const b: Box = [x - hw, landDirection * v - hh, x + hw, landDirection * v + hh];
    const branch: Box = [b[0], Math.min(b[1], trunk), b[2], Math.max(b[3], trunk)];
    if (overlaps(branch, selected, 0.04) || overlaps(branch, river.corridor, 0.045)) continue;
    const cy = (b[1] + b[3]) / 2;
    const buildings: Box[] = [];
    for (const column of [0, 1])
      for (const row of [0, 1]) {
        buildings.push([
          column === 0 ? b[0] + 0.008 : x + 0.008,
          row === 0 ? b[1] + 0.006 : cy + 0.006,
          column === 0 ? x - 0.008 : b[2] - 0.008,
          row === 0 ? cy - 0.006 : b[3] - 0.006,
        ]);
      }
    towns.push({
      bounds: b,
      entry: [x, landDirection > 0 ? b[3] : b[1]],
      buildings,
      streets: [
        [
          [x, b[1]],
          [x, b[3]],
        ],
        [
          [b[0], cy],
          [b[2], cy],
        ],
      ],
    });
  }
  const junctions = [BOUND[0], ...towns.map((t) => t.entry[0]), S.w[0], BOUND[2]].sort((a, b) => a - b);
  const roads: MapRoad[] = [];
  for (let i = 1; i < junctions.length; i++) {
    const x0 = junctions[i - 1];
    const x1 = junctions[i];
    if (x0 === undefined || x1 === undefined) continue;
    roads.push({
      id: `trunk-${i}`,
      points: [
        [x0, trunk],
        [x1, trunk],
      ],
      width: 0.028,
      bridge: x0 < riverX(0.67) && x1 > riverX(0.67),
    });
  }
  towns.forEach((t, i) =>
    roads.push({ id: `town-${i}`, points: [t.entry, [t.entry[0], trunk]], width: 0.018, bridge: false }),
  );
  const cityEntry: Pt = [S.w[0], landDirection > 0 ? selected[3] : selected[1]];
  roads.push({ id: 'city-access', points: [cityEntry, [S.w[0], trunk]], width: 0.028, bridge: false });
  const railway: MapRoad = {
    id: 'railway',
    points: [
      [BOUND[0], landDirection * 0.82],
      [BOUND[2], landDirection * 0.82],
    ],
    width: 0.026,
    bridge: true,
  };
  return {
    kind: 'region',
    selected,
    contours: lines.filter((l) => l.elevation > 0),
    coast,
    river,
    towns,
    roads,
    railway,
    station: {
      platform: [
        [selected[0], landDirection * 0.795],
        [selected[2], landDirection * 0.795],
      ],
      access: [
        [selected[2], landDirection * 0.795],
        [selected[2], trunk],
      ],
    },
    elevation,
    landDirection,
  };
}
