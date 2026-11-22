import { defineCanvasFigure } from './define';
import { ink, tone } from './kit/ink';
import { noise2, type Noise2 } from './kit/noise';
import { cell, pixelGrid } from './kit/pixel';

/** A candle flame as a grid of pixels, after the old Doom fire: a heat field is fed from the wick
 *  row and, step by step, every cell takes the heat of a cell under it, one to either side and a
 *  little cooler, so it churns by itself. Here that churn shakes the edges of a teardrop, a
 *  candle's shape, whose height and tip wander on slow noise. A white body, orange at its edge
 *  and tip, a grey wisp above. It draws only the flame (the rest of its box stays clear), so it
 *  can stand on a baked drawing's candle. The pointer is a breath: the flame leans away from it
 *  and gutters. A page may hand it `{ seed }` so candles side by side do not flicker together. */

interface State {
  heat: Uint8Array;
  noise: Noise2;
  acc: number;
  lean: number;
  phase: number;
  ready: boolean;
}

/** A square box: the flame takes the middle columns and the rest stays clear. */
const COLS = 18;
const ROWS = 18;
const MAX = 9;
const CORE = (COLS - 1) / 2;
/** The wick row, the flame's height in rows and its widest half-width, at rest. */
const BASE = ROWS - 2;
const TALL = 11;
const WIDE = 2.6;
/** Steps a second of the heat field: fast enough to churn, slow enough to read as pixels. */
const RATE = 22;
const BODY = [tone('inkStrong'), tone('inkStrong', 0.88)];
const EDGE = [ink.signal(1), ink.signal(0.7)];
const SMOKE = tone('inkFaint', 0.45);

function seedOf(data: unknown): number {
  if (typeof data !== 'object' || data === null || !('seed' in data)) return 0;
  return typeof data.seed === 'number' ? data.seed : 0;
}

/** One step of the Doom fire: the wick row held hot, every cell above pulling from below. */
function step(heat: Uint8Array, rng: () => number, gust: number): void {
  for (let x = 0; x < COLS; x++) heat[(ROWS - 1) * COLS + x] = rng() < 0.1 + gust * 0.4 ? MAX - 2 : MAX;
  for (let y = 0; y < ROWS - 1; y++) {
    for (let x = 0; x < COLS; x++) {
      const from = Math.min(COLS - 1, Math.max(0, x + Math.floor(rng() * 3) - 1));
      const src = heat[(y + 1) * COLS + from] ?? 0;
      heat[y * COLS + x] = Math.max(0, src - (rng() < 0.45 ? 1 : 0) - (rng() < gust * 0.3 ? 1 : 0));
    }
  }
}

/** How far a cell is inside the teardrop, 1 on its axis and 0 at its edge, and its height in it. */
function inside(x: number, y: number, tall: number, tip: number): [number, number] {
  const u = (BASE - y) / tall;
  if (u < 0 || u > 1) return [0, u];
  const half = WIDE * (u < 0.3 ? Math.sqrt(u / 0.3) : Math.pow((1 - u) / 0.7, 0.8));
  const cx = CORE + tip * Math.pow(u, 1.6);
  return [Math.max(0, 1 - Math.abs(x - cx) / Math.max(half, 0.9)), u];
}

export default defineCanvasFigure<State>({
  id: 'pixel-flame',
  title: 'Pixel flame',
  alt: 'A small candle flame drawn in square pixels: a white body, orange at its edge and tip and a grey wisp above it, flickering.',
  idea: 'A candle flame as the Doom fire: heat rises cell by cell from the wick and cools as it goes, shaking the flame so it flickers on its own and leans from a breath.',
  style: 'pixel',
  motion: 'ambient',
  answers: true,
  group: 'feature',
  seed: 1122,
  aspect: COLS / ROWS,
  setup: ({ rng }) => ({
    heat: new Uint8Array(COLS * ROWS),
    noise: noise2(rng),
    acc: 0,
    lean: 0,
    phase: 0,
    ready: false,
  }),
  draw: ({ ctx, w, h, t, dt, pointer, hover, state, rng, data }) => {
    if (!state.ready) {
      state.phase = seedOf(data);
      for (let k = 0; k < 24 + (state.phase % 13); k++) step(state.heat, rng, 0);
      state.ready = true;
    }
    const breath = pointer.active ? hover : 0;
    const p = state.phase;
    const target = state.noise(t * 0.9, p) * 1.2 + (pointer.active ? (0.5 - pointer.x) * 5 * hover : 0);
    state.lean += (target - state.lean) * Math.min(1, dt * 5);
    state.acc = Math.min(state.acc + dt * RATE, 6);
    while (state.acc >= 1) {
      step(state.heat, rng, breath);
      state.acc -= 1;
    }
    const tall = TALL * (0.9 + state.noise(t * 2.3, p + 7) * 0.12) * (1 - breath * 0.25);
    const g = pixelGrid(w, h, COLS, ROWS);
    let tipY = BASE;
    let tipX = CORE;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const [d, u] = inside(x, y, tall, state.lean);
        // The churn of the fire shakes the edge: a cell near it lives or dies by its heat.
        const v = d + ((state.heat[y * COLS + x] ?? 0) / MAX - 0.6) * 0.5;
        if (d <= 0 || v <= 0.12) continue;
        const rim = u > 0.72 || (v < 0.42 && u > 0.35);
        cell(ctx, g, x, y, rim ? (EDGE[u > 0.88 ? 1 : 0] ?? '') : (BODY[v > 0.7 ? 0 : 1] ?? ''));
        if (y < tipY) [tipY, tipX] = [y, x];
      }
    }
    // A wisp of smoke above the tip, now and then.
    const wisp = state.noise(t * 1.4, p + 3);
    if (wisp > -0.1) cell(ctx, g, tipX + Math.round(wisp * 1.5), tipY - 2, SMOKE);
    if (wisp > 0.35) cell(ctx, g, tipX + Math.round(wisp * 2.5), tipY - 3, SMOKE);
    return breath > 0.3 ? 'leaning' : 'rest';
  },
});
