import { defineTemplate } from '../defineTemplate';
import { ink } from '../kit/ink';
import { smoothstep } from '../kit/motion';
import { between, mulberry32, pick, type Rng } from '../kit/rng';

/** Powers of ten without scrolling: an endless dive through nested plans drawn as traces.
 *  Each level is a floor plan (a rack's slots, a board's chips and traces, a package's ball
 *  ring, a die's floorplan, a core's blocks, a row of gates; or region, city, district,
 *  block, building, floor), and one part of it, in the signal, is the window the next level
 *  lives in. The camera zooms toward that window until it fills the frame, which is then
 *  the next level, and the chain loops back to the start. The pointer slows the dive. */

const CHAINS = {
  silicon: ['rack', 'board', 'package', 'die', 'core', 'cell'],
  city: ['region', 'city', 'district', 'block', 'building', 'floor'],
} as const;
type Chain = keyof typeof CHAINS;
type Layout = 'rows' | 'grid' | 'ring' | 'gates';
const LAYOUT: Record<string, Layout> = {
  rack: 'rows',
  building: 'rows',
  package: 'ring',
  cell: 'gates',
  floor: 'gates',
};

/** How much bigger a level is than the window into the next. */
const R = 4;
/** Half-width of a level in its own units (it is 2 high, as the frame is 2:1). */
const A = 2;

interface P {
  chain: Chain;
  /** Which level of the chain the dive starts at. */
  start: number;
  speed: number;
  salt: number;
}
type Rect = [number, number, number, number];
interface Level {
  rects: Rect[];
  lines: Rect[];
  dots: [number, number][];
  /** The window's centre: the next level, R times smaller, fills the rect round it. */
  w: [number, number];
}
interface S {
  u: number;
  cache: Map<number, Level>;
}

/** Level n's plan, the same every time it is asked for. */
function plan(chain: Chain, n: number, salt: number): Level {
  const kinds = CHAINS[chain];
  const kind = kinds[((n % kinds.length) + kinds.length) % kinds.length] ?? 'board';
  const rng: Rng = mulberry32((salt + n * 7919) >>> 0);
  const layout = LAYOUT[kind] ?? 'grid';
  const L: Level = { rects: [], lines: [], dots: [], w: [0, 0] };
  const [ww, wh] = [A / R, 1 / R];
  if (layout === 'rows') {
    const n = 6 + Math.floor(rng() * 4);
    for (let i = 0; i < n; i++) {
      const y = -0.9 + (1.8 * i) / n;
      L.rects.push([-A * 0.86, y + 0.03, A * 0.86, y + 1.8 / n - 0.03]);
      for (let k = 0; k < 6; k++) L.dots.push([A * (0.6 + k * 0.04), y + 0.9 / n]);
    }
  } else if (layout === 'ring') {
    for (let i = 0; i < 28; i++)
      L.dots.push([-A * 0.9 + (i * A * 1.8) / 27, -0.88], [-A * 0.9 + (i * A * 1.8) / 27, 0.88]);
    for (let i = 1; i < 11; i++) L.dots.push([-A * 0.9, -0.88 + (i * 1.76) / 11], [A * 0.9, -0.88 + (i * 1.76) / 11]);
    L.rects.push([-A * 0.7, -0.7, A * 0.7, 0.7]);
  } else {
    // A grid of cells, some merged, joined to their neighbours by orthogonal traces; a row
    // of gates instead draws gate lines over diffusion strips.
    const [cols, rows] = [4 + Math.floor(rng() * 3), 3 + Math.floor(rng() * 2)];
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) {
        if (rng() < 0.18) continue;
        const [x0, y0] = [-A * 0.9 + (i * A * 1.8) / cols, -0.9 + (j * 1.8) / rows];
        const [x1, y1] = [x0 + (A * 1.8) / cols, y0 + 1.8 / rows];
        const pad = between(rng, 0.04, 0.12);
        L.rects.push([x0 + pad, y0 + pad, x1 - pad, y1 - pad]);
        if (layout === 'gates')
          for (let g = 1; g < 5; g++) L.lines.push([x0 + ((x1 - x0) * g) / 5, y0, x0 + ((x1 - x0) * g) / 5, y1]);
        else if (chain === 'silicon' && i + 1 < cols) L.lines.push([x1 - pad, (y0 + y1) / 2, x1 + pad, (y0 + y1) / 2]);
      }
    // In a city the cells are blocks and the gaps between them are roads.
    if (chain === 'city' && layout === 'grid') {
      for (let i = 1; i < cols; i++)
        L.lines.push([-A * 0.9 + (i * A * 1.8) / cols, -0.92, -A * 0.9 + (i * A * 1.8) / cols, 0.92]);
      for (let j = 1; j < rows; j++)
        L.lines.push([-A * 0.92, -0.9 + (j * 1.8) / rows, A * 0.92, -0.9 + (j * 1.8) / rows]);
    }
  }
  // The window sits off-centre so each dive drifts, never straight down the middle.
  const [wx, wy] = [between(rng, -A * 0.45, A * 0.45), between(rng, -0.45, 0.45)];
  L.w = [wx, wy];
  L.rects = L.rects.filter(([x0, y0, x1, y1]) => x1 < wx - ww || x0 > wx + ww || y1 < wy - wh || y0 > wy + wh);
  L.lines = L.lines.filter(([x0, y0]) => Math.abs(x0 - wx) > ww || Math.abs(y0 - wy) > wh);
  return L;
}

export default defineTemplate<P, S>({
  id: 'zoom-dive',
  title: 'Zoom dive',
  idea: 'Powers of ten without scrolling: an endless dive through nested plans, rack to board to package to die to core to gates (or region down to a floor), each level opening through its lit window into the next.',
  style: 'trace',
  motion: 'ambient',
  answers: true,
  aspect: 2,
  grammar: (rng) => ({
    chain: pick(rng, ['silicon', 'city'] as const),
    speed: between(rng, 0.16, 0.26),
    salt: Math.floor(rng() * 1e6),
    start: Math.floor(rng() * 6),
  }),
  name: (p) => `${p.chain} dive`,
  alt: (p) =>
    `An endless zoom through nested plans drawn in thin lines, ${CHAINS[p.chain].join(', ')}, each with one part outlined in teal that opens into the next level.`,
  setup: ({ params }) => ({ u: params.start + 0.35, cache: new Map() }),
  draw: ({ ctx, w, h, dt, hover, pointer, params, state }) => {
    state.u += dt * params.speed * (1 - 0.85 * hover);
    const n = Math.floor(state.u);
    const f = state.u - n;
    const level = (k: number): Level => {
      const hit = state.cache.get(k);
      if (hit) return hit;
      const made = plan(params.chain, k, params.salt);
      if (state.cache.size > 12) state.cache.clear();
      state.cache.set(k, made);
      return made;
    };
    // Zoom about the fixed point that carries level n's window onto the whole frame.
    const S = Math.pow(R, f);
    const here = level(n);
    const [qx, qy] = [(here.w[0] * R) / (R - 1), (here.w[1] * R) / (R - 1)];
    const U = Math.min(w / (2 * A), h / 2) * 0.92;
    // Level n + d's points map into level n's frame through each window in turn.
    const toScreen = (d: number, x: number, y: number): [number, number] => {
      let [px, py] = [x, y];
      for (let k = d - 1; k >= 0; k--) {
        const lk = level(n + k);
        [px, py] = [lk.w[0] + px / R, lk.w[1] + py / R];
      }
      if (d < 0) {
        const up = level(n - 1);
        [px, py] = [(px - up.w[0]) * R, (py - up.w[1]) * R];
      }
      return [w / 2 + (qx + (px - qx) * S) * U, h / 2 + (qy + (py - qy) * S) * U];
    };
    for (let d = -1; d <= 2; d++) {
      const size = S * Math.pow(R, -d);
      const a = smoothstep(0.04, 0.3, size) * (1 - smoothstep(3, 7, size));
      if (a <= 0.01) continue;
      const L = level(n + d);
      const box = ([x0, y0, x1, y1]: Rect, style: string): void => {
        const [p0, p1] = [toScreen(d, x0, y0), toScreen(d, x1, y1)];
        ctx.strokeStyle = style;
        ctx.strokeRect(p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1]);
      };
      box([-A * 0.96, -0.96, A * 0.96, 0.96], ink.line(0.18 * a));
      for (const r of L.rects) box(r, ink.line(0.42 * a));
      ctx.strokeStyle = ink.line(0.3 * a);
      ctx.beginPath();
      for (const [x0, y0, x1, y1] of L.lines) {
        const [p0, p1] = [toScreen(d, x0, y0), toScreen(d, x1, y1)];
        ctx.moveTo(p0[0], p0[1]);
        ctx.lineTo(p1[0], p1[1]);
      }
      ctx.stroke();
      ctx.fillStyle = ink.line(0.45 * a);
      for (const [x, y] of L.dots) {
        const p = toScreen(d, x, y);
        ctx.fillRect(Math.round(p[0]) - 1, Math.round(p[1]) - 1, 2, 2);
      }
      // The window into the next level: the one lit part of each plan.
      const [wx, wy] = L.w;
      box([wx - A / R, wy - 1 / R, wx + A / R, wy + 1 / R], d === 0 ? ink.signal(0.95) : ink.signal(0.35 * a));
    }
    const kinds = CHAINS[params.chain];
    return pointer.active ? (kinds[((n % kinds.length) + kinds.length) % kinds.length] ?? 'rest') : 'rest';
  },
});
