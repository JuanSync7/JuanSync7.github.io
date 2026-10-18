import { defineTemplate } from '../defineTemplate';
import { ink } from '../kit/ink';
import { noise2 } from '../kit/noise';
import { bayer, cell, pixelGrid, type PixelGrid } from '../kit/pixel';
import { between, pick, type Rng } from '../kit/rng';
import { order, SWEEPS, type Order, type Sweep } from '../kit/sweeps';

/** A fabric of pixel blocks in a grid, with a wave of dithered tone passing over it, all
 *  from the seed: how many blocks and how big, the gaps and routing channels, what each
 *  block's pixels are (solid, a frame, dots, rows, a cross or a look-up pattern), how heavy
 *  each block is, the order the wave takes (one of `kit/sweeps.ts`, sometimes two at once),
 *  its timing (smooth, stepped, missing a beat, eased) and the shape of its front (a blip,
 *  a trail, a wipe, a swell). The teal is a whole block, half blocks, a column, a corner or
 *  the block riding the front. The pointer lights the block under it and its neighbours. */

const FILLS = ['solid', 'frame', 'dots', 'rows', 'cross', 'lut'] as const;
const WEIGHTS = ['even', 'random', 'gradient', 'clusters', 'sparse', 'bands'] as const;
const TIMES = ['smooth', 'stepped', 'skip', 'ease'] as const;
const FRONTS = ['blip', 'trail', 'wipe', 'swell'] as const;
const TEALS = ['block', 'halves', 'column', 'corner', 'rider'] as const;

interface P {
  bw: number;
  bh: number;
  gap: number;
  /** A routing channel every this many blocks (0: none). */
  channel: number;
  cols: number;
  rows: number;
  fill: (typeof FILLS)[number];
  /** A look-up pattern per block, bw × bh bits. */
  luts: boolean[][];
  weight: number[];
  /** Tone a block keeps when the wave is elsewhere: configured blocks stay faintly lit. */
  idle: number[];
  sweeps: Sweep[];
  speeds: number[];
  time: (typeof TIMES)[number];
  steps: number;
  front: (typeof FRONTS)[number];
  width: number;
  teal: (typeof TEALS)[number];
  /** The teal's blocks, by index. */
  at: [number, number];
  salt: number;
}
interface S {
  orders: Order[];
}

function weights(rng: Rng, kind: (typeof WEIGHTS)[number], cols: number, rows: number): number[] {
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

/** Whether pixel (x, y) of a bw × bh block is part of it, for the block's fill. */
function lit(p: P, k: number, x: number, y: number): boolean {
  const edge = x === 0 || y === 0 || x === p.bw - 1 || y === p.bh - 1;
  if (p.fill === 'frame') return edge || (x + y) % 2 === 0;
  if (p.fill === 'dots') return (x + y) % 2 === 0;
  if (p.fill === 'rows') return y % 2 === 0;
  if (p.fill === 'cross') return edge || x === Math.floor(p.bw / 2) || y === Math.floor(p.bh / 2);
  if (p.fill === 'lut') return p.luts[k % p.luts.length]?.[y * p.bw + x] ?? true;
  return true;
}

/** Where block i or j starts, in pixels, with the channels widened. */
const origin = (i: number, b: number, p: P): number =>
  i * (b + p.gap) + (p.channel ? Math.floor(i / p.channel) * 2 : 0);

/** How lit a block is by a front at f, for its phase, in 0..1. */
function wave(p: P, f: number, ph: number): number {
  const d = f - ph;
  if (p.front === 'wipe') return d >= 0 && d < 0.85 ? 1 - d * 0.6 : 0;
  if (p.front === 'trail') return d >= 0 ? Math.exp(-d / p.width) : Math.max(0, 1 + d / 0.03);
  const w = p.front === 'swell' ? p.width * 2.5 : p.width;
  return Math.max(0, Math.cos(Math.min(Math.PI / 2, (Math.abs(d) / w) * (Math.PI / 2))));
}

export default defineTemplate<P, S>({
  id: 'pixel-fabric',
  title: 'Pixel fabric',
  idea: 'Logic blocks in pixels with activity sweeping across them, the grid, the blocks, their wiring and the way the wave travels all drawn from the seed: rain, snake, ripple, wipe or scatter.',
  style: 'pixel',
  motion: 'ambient',
  answers: true,
  aspect: 2,
  grammar: (rng) => {
    const bw = 2 + Math.floor(rng() * 6);
    const bh = rng() < 0.6 ? bw : 2 + Math.floor(rng() * 6);
    const gap = rng() < 0.75 ? 1 : 2;
    const cols = Math.max(4, Math.min(28, Math.floor(between(rng, 48, 110) / (bw + gap))));
    const fit = (cols * (bw + gap)) / (2 * (bh + gap));
    const rows = Math.max(2, Math.round(fit * between(rng, 0.55, 1)));
    const n = cols * rows;
    const sweeps = [pick(rng, SWEEPS)];
    if (rng() < 0.3) sweeps.push(pick(rng, SWEEPS));
    return {
      bw,
      bh,
      gap,
      channel: pick(rng, [0, 0, 2, 3, 4]),
      cols,
      rows,
      fill: pick(rng, FILLS),
      luts: Array.from({ length: 7 }, () => Array.from({ length: bw * bh }, () => rng() < 0.6)),
      weight: weights(rng, pick(rng, WEIGHTS), cols, rows),
      idle: Array.from({ length: n }, () => (rng() < 0.3 ? between(rng, 0.12, 0.35) : 0.04)),
      sweeps,
      speeds: sweeps.map(() => between(rng, 0.15, 0.45)),
      time: pick(rng, TIMES),
      steps: 4 + Math.floor(rng() * 9),
      front: pick(rng, FRONTS),
      width: between(rng, 0.1, 0.28),
      teal: pick(rng, bw >= 4 && bh >= 4 ? TEALS : (['block', 'halves', 'rider'] as const)),
      at: [Math.floor(rng() * n), Math.floor(rng() * n)],
      salt: Math.floor(rng() * 1e6),
    };
  },
  name: (p) => `${p.cols} × ${p.rows}, ${p.sweeps.join(' + ')}`,
  alt: (p) =>
    `A pixel grid of ${p.cols} by ${p.rows} grey logic blocks separated by thin channels; brighter dithered activity passes over them in a ${p.sweeps.join(' and ')} pattern, and part of the fabric is teal.`,
  setup: ({ params: p }) => {
    let s = p.salt;
    const rng = (): number => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    return { orders: p.sweeps.map((k) => order(k, p.cols, p.rows, rng)) };
  },
  draw: ({ ctx, w, h, t, pointer, hover, params: p, state }) => {
    const W = origin(p.cols - 1, p.bw, p) + p.bw;
    const H = origin(p.rows - 1, p.bh, p) + p.bh;
    const g: PixelGrid = pixelGrid(w * 0.92, h * 0.86, W, H);
    g.ox += Math.floor(w * 0.04);
    g.oy += Math.floor(h * 0.07);
    const clock = (u: number): number => {
      if (p.time === 'stepped') return Math.floor(u * p.steps) / p.steps;
      if (p.time === 'skip') {
        // A step is missed every third beat: the front holds, then jumps two.
        const b = Math.floor(u * p.steps);
        return (b - (b % 3 === 2 ? 1 : 0)) / p.steps;
      }
      if (p.time === 'ease') return Math.floor(u) + (1 - Math.cos((u % 1) * Math.PI)) / 2;
      return u;
    };
    const span = p.front === 'trail' ? 1 + p.width * 4 : p.front === 'wipe' ? 1.9 : 1 + p.width * 2;
    const at = (k: number): number =>
      state.orders.reduce((m, o, s) => {
        const u = clock(t * (p.speeds[s] ?? 0.3) * (o.rate[k] ?? 1));
        const f = o.bounce ? 1 - Math.abs(((u * 2) % 2) - 1) : u % 1;
        return Math.max(m, wave(p, f * span - (span - 1) / 2, o.phase[k] ?? 0));
      }, 0);
    // The pointer's block: the last block whose origin is left of and above it.
    const [gx, gy] = [(pointer.x * w - g.ox) / g.cell, (pointer.y * h - g.oy) / g.cell];
    let [pi, pj] = [-1, -1];
    if (pointer.active && hover > 0.2)
      for (let i = 0; i < p.cols; i++)
        for (let j = 0; j < p.rows; j++) if (gx >= origin(i, p.bw, p) && gy >= origin(j, p.bh, p)) [pi, pj] = [i, j];
    const tones = Array.from({ length: p.cols * p.rows }, (_, k) => at(k) * (p.weight[k] ?? 0.5));
    let rider = 0;
    if (p.teal === 'rider') tones.forEach((v, k) => (v > (tones[rider] ?? 0) ? (rider = k) : 0));
    const teal = (k: number, x: number, y: number): boolean => {
      if (Math.floor(k / p.cols) === pj && k % p.cols === pi) return true;
      if (p.teal === 'rider') return k === rider;
      if (p.teal === 'halves') return (k === p.at[0] && x < p.bw / 2) || (k === p.at[1] && x >= p.bw / 2);
      if (p.teal === 'column') return k === p.at[0] && x === Math.floor(p.bw / 2);
      if (p.teal === 'corner') return k === p.at[0] && (x === 0 || y === p.bh - 1);
      return k === p.at[0];
    };
    for (let j = 0; j < p.rows; j++)
      for (let i = 0; i < p.cols; i++) {
        const k = j * p.cols + i;
        const near = pi >= 0 ? Math.max(0, 1 - Math.hypot(i - pi, (j - pj) * 1.4) / 3) * hover : 0;
        const tone = Math.min(1, (tones[k] ?? 0) * 0.8 + (p.idle[k] ?? 0) + near * 0.6);
        const [x0, y0] = [origin(i, p.bw, p), origin(j, p.bh, p)];
        for (let y = 0; y < p.bh; y++)
          for (let x = 0; x < p.bw; x++) {
            if (teal(k, x, y)) {
              cell(ctx, g, x0 + x, y0 + y, ink.signal(0.9), 1);
              continue;
            }
            if (!lit(p, k, x, y)) continue;
            cell(ctx, g, x0 + x, y0 + y, ink.line(0.08), 1);
            if (tone > bayer(x0 + x, y0 + y)) cell(ctx, g, x0 + x, y0 + y, ink.line(0.55), 1);
          }
      }
    return pi >= 0 ? `clb ${pi}·${pj}` : 'rest';
  },
});
