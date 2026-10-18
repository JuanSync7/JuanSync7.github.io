import type { Rng } from './rng';

/** Orders for a wave to pass over a grid of blocks: for every block, where it falls in the
 *  sweep (a phase in 0..1) and how fast its own clock runs. Sweeps across, back and both
 *  ways; from each corner; in a snake; down columns at their own pace like rain; scattered;
 *  out from the centre, in from the rim, from a point; round a spiral; in a checker. A
 *  sweep is data: the figure decides what a passing front looks like. */

export const SWEEPS = [
  'ltr',
  'rtl',
  'both',
  'down',
  'tl',
  'tr',
  'bl',
  'br',
  'snake',
  'zigzag',
  'rain',
  'scatter',
  'centre',
  'rim',
  'ripple',
  'spiral',
  'checker',
  'blinds',
] as const;
export type Sweep = (typeof SWEEPS)[number];

export interface Order {
  /** Phase of block (i, j) at index j * cols + i. */
  phase: number[];
  /** How fast each block's clock runs, 1 the same as the rest. */
  rate: number[];
  /** The front runs back as well as forth (a bounce), not round and round. */
  bounce: boolean;
}

/** What a sweep's rule sees of one block: its column and row, both as counts and 0..1, its
 *  offset from the centre (in the grid's own proportions), and the seeded extras. */
interface At {
  i: number;
  j: number;
  x: number;
  y: number;
  cx: number;
  cy: number;
  cols: number;
  rows: number;
  rng: Rng;
  lag: number;
  origin: [number, number, number];
  turns: number;
  slats: number;
}

const RULES: Record<Sweep, (a: At) => number> = {
  ltr: (a) => a.x,
  rtl: (a) => 1 - a.x,
  both: (a) => a.x,
  down: (a) => a.y,
  tl: (a) => (a.x + a.y) / 2,
  tr: (a) => (1 - a.x + a.y) / 2,
  bl: (a) => (a.x + 1 - a.y) / 2,
  br: (a) => (2 - a.x - a.y) / 2,
  snake: (a) => (a.j * a.cols + (a.j % 2 ? a.cols - 1 - a.i : a.i)) / (a.cols * a.rows),
  zigzag: (a) => (a.i * a.rows + (a.i % 2 ? a.rows - 1 - a.j : a.j)) / (a.cols * a.rows),
  rain: (a) => (a.y * 0.6 + a.lag) % 1,
  scatter: (a) => a.rng(),
  centre: (a) => Math.min(1, Math.hypot(a.cx, a.cy) * 1.9),
  rim: (a) => 1 - Math.min(1, Math.hypot(a.cx, a.cy) * 1.9),
  ripple: (a) => Math.hypot(a.i - a.origin[0], a.j - a.origin[1]) / a.origin[2],
  spiral: (a) => ((Math.atan2(a.cy, a.cx) / (Math.PI * 2) + 0.5) * a.turns + Math.hypot(a.cx, a.cy)) % 1,
  checker: (a) => ((a.i + a.j) % 2) * 0.5 + a.x * 0.25,
  blinds: (a) => ((a.i % a.slats) + a.x) / a.slats,
};

/** Every block's place in a sweep over a cols × rows grid. */
export function order(kind: Sweep, cols: number, rows: number, rng: Rng): Order {
  const [ox, oy] = [rng() * (cols - 1), rng() * (rows - 1)];
  const reach = Math.hypot(Math.max(ox, cols - 1 - ox), Math.max(oy, rows - 1 - oy)) || 1;
  const colRate = Array.from({ length: cols }, () => 0.6 + rng() * 0.9);
  const colLag = Array.from({ length: cols }, () => rng());
  const [turns, slats] = [1 + Math.floor(rng() * 2), 2 + Math.floor(rng() * 3)];
  const phase: number[] = [];
  const rate: number[] = [];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const [x, y] = [i / Math.max(1, cols - 1), j / Math.max(1, rows - 1)];
      const at: At = {
        i,
        j,
        x,
        y,
        cx: x - 0.5,
        cy: (y - 0.5) * ((rows - 1) / Math.max(1, cols - 1)),
        cols,
        rows,
        rng,
        lag: colLag[i] ?? 0,
        origin: [ox, oy, reach],
        turns,
        slats,
      };
      phase.push(RULES[kind](at));
      rate.push(kind === 'rain' ? (colRate[i] ?? 1) : 1);
    }
  return { phase, rate, bounce: kind === 'both' };
}
