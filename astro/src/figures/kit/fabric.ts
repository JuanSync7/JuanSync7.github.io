import { noise2 } from './noise';
import type { Rng } from './rng';

/** The seeded parts of a pixel fabric (Pixel fabric) that are not its sweep: how heavy each
 *  block is, and where its one teal block is at a moment, moving by one of several rules. */

export const WEIGHTS = ['even', 'random', 'gradient', 'clusters', 'sparse', 'bands'] as const;
/** How the teal moves; standing still is the rarest. */
export const MOVES = ['wander', 'wander', 'hop', 'scan', 'scan', 'ride', 'ride', 'blink', 'still'] as const;
export type Move = (typeof MOVES)[number];

export function weights(rng: Rng, kind: (typeof WEIGHTS)[number], cols: number, rows: number): number[] {
  const n = noise2(rng);
  const [dx, dy] = [rng() - 0.5, rng() - 0.5];
  const band = 2 + Math.floor(rng() * 3);
  return Array.from({ length: cols * rows }, (_, k) => {
    const [i, j] = [k % cols, Math.floor(k / cols)];
    if (kind === 'even') return 0.8;
    if (kind === 'gradient')
      return 0.25 + 0.75 * Math.min(1, Math.max(0, 0.5 + (i / cols - 0.5) * dx * 2 + (j / rows - 0.5) * dy * 2));
    if (kind === 'clusters') return 0.2 + 0.8 * Math.max(0, n(i * 0.35, j * 0.35) * 0.5 + 0.5);
    if (kind === 'sparse') return rng() < 0.35 ? 0.1 : 0.6 + rng() * 0.4;
    if (kind === 'bands') return (Math.floor(j / band) + Math.floor(i / band)) % 2 ? 0.95 : 0.4;
    return 0.25 + rng() * 0.75;
  });
}

export interface TealSpec {
  cols: number;
  rows: number;
  beat: number;
  wander: [number, number, number, number];
  at: [number, number];
  salt: number;
}

/** The teal's block at time t: where it wanders (two slow sines across the grid), hops (a
 *  seeded block every beat), scans (block by block in a snake), rides (the brightest block
 *  under the front, from `tones`), blinks (between two blocks) or stands. */
export function tealAt(move: Move, p: TealSpec, tones: readonly number[], t: number): number {
  const n = p.cols * p.rows;
  const b = Math.floor(t * p.beat);
  if (move === 'ride') return tones.reduce((best, v, k) => (v > (tones[best] ?? 0) ? k : best), p.at[0]);
  if (move === 'hop') return Math.floor(((((Math.sin((b + p.salt) * 91.37) * 43758.5) % 1) + 1) % 1) * n);
  if (move === 'blink') return b % 2 ? p.at[1] : p.at[0];
  if (move === 'scan') {
    const row = Math.floor(b / p.cols) % p.rows;
    return row * p.cols + (row % 2 ? p.cols - 1 - (b % p.cols) : b % p.cols);
  }
  if (move === 'wander') {
    const [ax, ay, px, py] = p.wander;
    const at = (f: number, ph: number, m: number): number =>
      Math.min(m - 1, Math.floor((0.5 + 0.5 * Math.sin(t * f + ph)) * m));
    return at(ay, py, p.rows) * p.cols + at(ax, px, p.cols);
  }
  return p.at[0];
}
