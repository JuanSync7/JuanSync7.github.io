import { defineTemplate } from '../defineTemplate';
import { ink } from '../kit/ink';
import { city, district, region } from '../kit/maps';
import { block, building, floor } from '../kit/rooms';
import { smoothstep } from '../kit/motion';
import { between, mulberry32, pick } from '../kit/rng';
import { cell, core, die, pkg } from '../kit/dies';
import { board, rack } from '../kit/silicon';
import { A, finish, R, Sketch, type Plan, type Pt } from '../kit/sketch';

/** Powers of ten without scrolling: an endless dive through nested plans drawn as traces.
 *  Each level is a drawing of the real thing, seeded: a row of racks, a motherboard, a
 *  package, a die floorplan, a core's blocks, rows of standard cells; or a region map, a
 *  city, a district, a block, a building's plan, a floor plan. One part of each, in the
 *  signal, is the window the next level lives in. The camera zooms toward that window
 *  until it fills the frame, which is then the next level, and the chain loops. Fine detail
 *  fades in as a level grows. The pointer slows the dive. */

const CHAINS = {
  silicon: [
    ['rack', rack],
    ['board', board],
    ['package', pkg],
    ['die', die],
    ['core', core],
    ['cell', cell],
  ],
  city: [
    ['region', region],
    ['city', city],
    ['district', district],
    ['block', block],
    ['building', building],
    ['floor', floor],
  ],
} as const;
type Chain = keyof typeof CHAINS;

/** The silicon dive's era: a sparse analog or RF test chip, a bipolar die like the 741, a
 *  1970s NMOS die like the 4004, or a modern one; the test chip, the simplest, most often. */
const ERAS = ['testchip', 'testchip', 'bipolar', 'nmos', 'modern', 'modern'] as const;

const ERA_ALT: Record<(typeof ERAS)[number], string> = {
  testchip: 'a sparse analog test chip with spiral inductors and pads, in a wire-bonded package',
  bipolar: 'a bipolar chip like an old op-amp, transistors as nested rectangles, in a wire-bonded package',
  nmos: 'a 1970s chip with hand-drawn wiring, a PLA and a bit-sliced datapath, in a wire-bonded package',
  modern: 'a modern chip, cores and caches under a flip-chip package',
};

interface P {
  chain: Chain;
  era: (typeof ERAS)[number];
  /** Which level of the chain the dive starts at. */
  start: number;
  speed: number;
  salt: number;
}
interface S {
  u: number;
  cache: Map<number, Plan>;
}

const at = (chain: Chain, n: number): (typeof CHAINS)[Chain][number] => {
  const kinds = CHAINS[chain];
  return kinds[((n % kinds.length) + kinds.length) % kinds.length] ?? kinds[0];
};

/** Level n's plan, the same every time it is asked for. The window sits off-centre so each
 *  dive drifts, never straight down the middle. */
function plan(chain: Chain, n: number, salt: number, era: string): Plan {
  const rng = mulberry32((salt + n * 7919) >>> 0);
  const w: Pt = [between(rng, -A * 0.45, A * 0.45), between(rng, -0.45, 0.45)];
  const S = new Sketch(rng, w);
  S.era = era;
  at(chain, n)[1](S);
  return finish(S);
}

export default defineTemplate<P, S>({
  id: 'zoom-dive',
  title: 'Zoom dive',
  idea: 'Powers of ten without scrolling: an endless dive through nested, seeded drawings of real things, rack to board to package to die to core to cells (or region down to a floor plan), each opening through its lit window into the next.',
  style: 'trace',
  motion: 'ambient',
  answers: true,
  aspect: 2,
  grammar: (rng) => ({
    chain: pick(rng, ['silicon', 'city'] as const),
    era: pick(rng, ERAS),
    speed: between(rng, 0.16, 0.26),
    salt: Math.floor(rng() * 1e6),
    start: Math.floor(rng() * 6),
  }),
  name: (p) => (p.chain === 'silicon' ? `${p.era} silicon dive` : 'city dive'),
  alt: (p) =>
    `An endless zoom through nested line drawings${p.chain === 'silicon' ? ` of ${ERA_ALT[p.era]}` : ''}, ${CHAINS[p.chain].map((k) => k[0]).join(', ')}, each with one part outlined in teal that opens into the next level.`,
  setup: ({ params }) => ({ u: params.start + 0.35, cache: new Map() }),
  draw: ({ ctx, w, h, dt, hover, pointer, params, state }) => {
    state.u += dt * params.speed * (1 - 0.85 * hover);
    const n = Math.floor(state.u);
    const f = state.u - n;
    const level = (k: number): Plan => {
      const hit = state.cache.get(k);
      if (hit) return hit;
      const made = plan(params.chain, k, params.salt, params.era);
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
    const toScreen = (d: number, x: number, y: number): Pt => {
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
      // Bold, mid and fine lines; the fine ones only once the level is near full size.
      const near = smoothstep(0.25, 0.8, size);
      const tones = [0.5 * a, 0.34 * a * (0.55 + 0.45 * near), 0.2 * a * near];
      L.segs.forEach((segs, k) => {
        if ((tones[k] ?? 0) < 0.01) return;
        ctx.strokeStyle = ink.line(tones[k] ?? 0);
        ctx.beginPath();
        for (const [x0, y0, x1, y1] of segs) {
          const [p0, p1] = [toScreen(d, x0, y0), toScreen(d, x1, y1)];
          ctx.moveTo(p0[0], p0[1]);
          ctx.lineTo(p1[0], p1[1]);
        }
        ctx.stroke();
      });
      ctx.fillStyle = ink.line(0.4 * a * near);
      for (const [x, y] of L.dots) {
        const p = toScreen(d, x, y);
        ctx.fillRect(Math.round(p[0]) - 1, Math.round(p[1]) - 1, 2, 2);
      }
      // The window into the next level: the one lit part of each plan.
      const [wx, wy] = L.w;
      const [p0, p1] = [toScreen(d, wx - A / R, wy - 1 / R), toScreen(d, wx + A / R, wy + 1 / R)];
      ctx.strokeStyle = d === 0 ? ink.signal(0.95) : ink.signal(0.35 * a);
      ctx.strokeRect(p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1]);
    }
    return pointer.active ? at(params.chain, n)[0] : 'rest';
  },
});
