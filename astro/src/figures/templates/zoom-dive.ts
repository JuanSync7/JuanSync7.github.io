import { defineTemplate } from '../defineTemplate';
import {
  diveCamera,
  journeyOpacity,
  paintDiveLevel,
  CHAINS,
  levelKind,
  makeDivePlan,
  nestConnections,
  type NestConnection,
  type DiveChain,
  type DiveEra,
} from '../kit/dive';
import { between, pick } from '../kit/rng';
import { R, type Plan } from '../kit/sketch';

/** Powers of ten without scrolling: an endless dive through nested plans drawn as traces.
 *  Each level is a drawing of the real thing, seeded: a row of racks, a motherboard, a
 *  package, a die floorplan, a core's blocks, rows of standard cells; or a region map, a
 *  city, a district, a block, a building's plan, a floor plan. One part of each, in the
 *  signal, is the window the next level lives in. The camera zooms toward that window
 *  until it fills the frame, which is then the next level, and the chain loops. Fine detail
 *  fades in as a level grows. The pointer slows the dive. */

/** The silicon dive's era: a sparse analog or RF test chip, a bipolar die like the 741, a
 *  1970s NMOS die like the 6502, or a modern one; the test chip, the simplest, most often. */
const ERAS = ['testchip', 'testchip', 'bipolar', 'nmos', 'modern', 'modern'] as const;

const ERA_ALT: Record<(typeof ERAS)[number], string> = {
  testchip: 'a sparse analog test chip with spiral inductors and pads, in a wire-bonded package',
  bipolar: 'a bipolar chip like an old op-amp, transistors as nested rectangles, in a wire-bonded package',
  nmos: 'a 1970s chip with hand-drawn wiring, a PLA and a bit-sliced datapath, in a wire-bonded package',
  modern: 'a modern chip, cores and caches under a flip-chip package',
};

interface P {
  chain: DiveChain;
  era: DiveEra;
  /** Which level of the chain the dive starts at. */
  start: number;
  speed: number;
  salt: number;
}
interface S {
  u: number;
  cache: Map<number, Plan>;
  links: Map<number, NestConnection | null>;
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
    `An endless zoom through nested line drawings${p.chain === 'silicon' ? ` of ${ERA_ALT[p.era]}` : ''}, ${CHAINS[p.chain].map((k) => k[0]).join(', ')}, each with one part outlined in teal that opens into the next level. The smallest view finishes its own physical detail, then dissolves into a fresh journey.`,
  setup: ({ params }) => ({ u: params.start + 0.35, cache: new Map(), links: new Map() }),
  draw: ({ ctx, w, h, dt, hover, pointer, params, state, unseen }) => {
    state.u += dt * params.speed * (1 - 0.85 * hover);
    if (unseen) return;
    const n = Math.floor(state.u);
    const level = (k: number): Plan => {
      const hit = state.cache.get(k);
      if (hit) return hit;
      const made = makeDivePlan(params.chain, k, params.salt, params.era);
      for (const key of state.cache.keys()) if (key < n - 2 || key > n + 3) state.cache.delete(key);
      state.cache.set(k, made);
      return made;
    };
    const { scale, toScreen } = diveCamera(level, state.u, w, h);
    const link = (k: number): NestConnection | null => {
      if (params.chain !== 'city' || !['block', 'building'].includes(levelKind(params.chain, k)[0])) return null;
      const hit = state.links.get(k);
      if (hit !== undefined) return hit;
      const made = nestConnections(level(k), level(k + 1));
      for (const key of state.links.keys()) if (key < n - 2 || key > n + 3) state.links.delete(key);
      state.links.set(k, made);
      return made;
    };
    for (let d = -1; d <= 2; d++) {
      const size = scale * Math.pow(R, -d);
      const opacity = journeyOpacity(n + d, state.u);
      if (opacity <= 0) continue;
      ctx.save();
      ctx.globalAlpha = opacity;
      paintDiveLevel(ctx, level(n + d), d, size, toScreen, link(n + d));
      ctx.restore();
    }
    return pointer.active ? `${levelKind(params.chain, n)[0]} · ${level(n).selectedKind ?? 'detail'}` : 'rest';
  },
});
