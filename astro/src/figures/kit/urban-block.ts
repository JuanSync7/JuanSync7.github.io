import { frontage } from './architecture-plan';
import { BOUND, inset, type Box, type Pt, type Sketch } from './sketch';

export interface BlockLot {
  bounds: Box;
  footprint: Box;
  selected: boolean;
  frontage: -1 | 1;
  path: [Pt, Pt];
  rearAccess: [Pt, Pt];
  roof: 'ridge' | 'plant' | 'terrace';
}

export interface UrbanBlockPlan {
  kind: 'urban-block';
  kerb: Box;
  lots: BlockLot[];
  courtyard: Box;
  crossings: Box[];
}

/** Frontage lots share a rear access lane; none are landlocked behind other buildings. */
export function makeUrbanBlock(S: Sketch): UrbanBlockPlan {
  const side = S.chance(0.5) ? -1 : 1;
  const sx = S.r(-0.62, 0.62);
  S.select([sx, side * 0.4], 'building');
  const lots: BlockLot[] = [];
  for (const band of [-1, 1] as const) {
    const bays =
      band === side
        ? [
            ...frontage(S, -1.65, sx - 0.53),
            [sx - 0.53, sx + 0.53] as [number, number],
            ...frontage(S, sx + 0.53, 1.65),
          ]
        : frontage(S, -1.65, 1.65, S.r(0.45, 0.65));
    for (const [a, b] of bays) {
      const selected = band === side && Math.abs(a - (sx - 0.53)) < 1e-6;
      const bounds: Box = [a, band < 0 ? -0.7 : 0.1, b, band < 0 ? -0.1 : 0.7];
      const footprint: Box = selected
        ? [...S.win]
        : [a + 0.035, band < 0 ? -0.65 : 0.15, b - 0.035, band < 0 ? -0.15 : 0.65];
      const cx = (a + b) / 2;
      lots.push({
        bounds,
        footprint,
        selected,
        frontage: band,
        path: [
          [cx, band * 0.65],
          [cx, band * 0.735],
        ],
        rearAccess: [
          [cx, band * 0.15],
          [cx, 0],
        ],
        roof: (['ridge', 'plant', 'terrace'] as const)[S.int(0, 2)] ?? 'ridge',
      });
    }
  }
  return {
    kind: 'urban-block',
    kerb: [-1.73, -0.76, 1.73, 0.76],
    lots,
    courtyard: [-1.65, -0.1, 1.65, 0.1],
    crossings: [
      [-1.52, -0.9, -1.42, -0.76],
      [1.42, -0.9, 1.52, -0.76],
      [-1.52, 0.76, -1.42, 0.9],
      [1.42, 0.76, 1.52, 0.9],
    ],
  };
}

function path(S: Sketch, a: Pt, b: Pt, width: number): void {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  for (const side of [-1, 1]) {
    const [ox, oy] = [((-dy / len) * width * side) / 2, ((dx / len) * width * side) / 2];
    S.seg(a[0] + ox, a[1] + oy, b[0] + ox, b[1] + oy, 2);
  }
}

export function drawUrbanBlock(S: Sketch, model: UrbanBlockPlan): void {
  for (const [i, b] of [model.kerb, inset(model.kerb, 0.035)].entries()) {
    const tone = i === 0 ? 0 : 2;
    S.seg(b[0], b[1], b[2], b[1], tone);
    S.seg(b[0], b[3], b[2], b[3], tone);
    for (const x of [b[0], b[2]]) {
      S.seg(x, b[1], x, -0.04, tone);
      S.seg(x, 0.04, x, b[3], tone);
    }
  }
  for (const y of [-0.84, 0.84]) S.dashed(BOUND[0], y, BOUND[2], y, 0.06, 0.04, 2);
  for (const x of [-1.805, 1.805]) S.dashed(x, BOUND[1], x, BOUND[3], 0.06, 0.04, 2);
  for (const crossing of model.crossings) S.hatch(crossing, 0.018, 2, 'v');
  for (const side of [-1, 1]) {
    for (let x = -1.25; x < 1.25; x += 0.14) {
      if (!S.chance(0.65)) continue;
      const y = side * 0.791;
      S.rect([x, y - 0.017, x + 0.078, y + 0.017], 2);
      S.seg(x + 0.019, y - 0.017, x + 0.019, y + 0.017, 2);
      S.seg(x + 0.058, y - 0.017, x + 0.058, y + 0.017, 2);
    }
  }
  // The lane opens through the block's two short sides, joining the public pavement.
  path(S, [-1.73, 0], [1.73, 0], 0.055);
  for (const lot of model.lots) {
    S.rect(lot.bounds, 2);
    if (!lot.selected) {
      S.rect(lot.footprint, 1);
      S.rect(inset(lot.footprint, 0.012), 2);
      const [a, b, c, d] = lot.footprint;
      const [cx, cy] = [(a + c) / 2, (b + d) / 2];
      if (lot.roof === 'ridge') {
        S.seg(cx, b + 0.04, cx, d - 0.04, 2);
        for (const [x, y] of [
          [a, b],
          [c, b],
          [a, d],
          [c, d],
        ] as const)
          S.seg(x, y, cx, y < cy ? b + 0.04 : d - 0.04, 2);
      } else if (lot.roof === 'plant') {
        const w = Math.min(0.08, (c - a) * 0.3);
        for (let y = b + 0.07; y < d - 0.08; y += 0.1) {
          S.rect([cx - w / 2, y, cx + w / 2, y + 0.05], 2);
          S.circle(cx, y + 0.025, 0.014, 2);
        }
      } else {
        S.rect(inset(lot.footprint, 0.045), 2);
        const pergola: Box = [a + 0.06, b + 0.06, c - 0.06, b + 0.15];
        S.rect(pergola, 2);
        S.hatch(pergola, 0.03, 2, 'v');
      }
    }
    path(S, ...lot.path, 0.025);
    path(S, ...lot.rearAccess, 0.025);
    const [door, pavement] = lot.path;
    if (!lot.selected) S.seg(door[0] - 0.025, door[1], door[0] + 0.025, door[1], 1);
    for (const dx of [-0.12, 0.12]) {
      const x = pavement[0] + dx;
      if (x > lot.bounds[0] + 0.02 && x < lot.bounds[2] - 0.02) {
        S.circle(x, pavement[1], 0.012, 2);
        S.dot(x, pavement[1]);
      }
    }
  }
}
