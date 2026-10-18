import { defineTemplate } from '../defineTemplate';
import { spiral } from '../kit/arms';
import { drawField, drawGalaxy, field, type Galaxy, type Pt, type Star } from '../kit/cosmos';
import { follow, smoothstep } from '../kit/motion';
import { between, mulberry32 } from '../kit/rng';

/** An endless dive into spiral galaxies: the camera flies into a spiral's heart, its arms
 *  streaming past, and the bright core opens into the next spiral, which is flown into in
 *  turn. Every spiral is seeded arm by arm (`kit/arms.ts`): its design, and each arm's
 *  length, width and light along it. The camera never jumps: the zoom is one exponential
 *  through every galaxy, the roll and drift run on the flight's own distance, and each
 *  spiral swings toward face-on as the camera closes, so it is met at its own angle and
 *  left from above. The next spiral's core is the signal. The pointer slows the flight. */

/** How much bigger a galaxy looks than the one in its core, when that one first shows. */
const R = 9;

interface P {
  speed: number;
  salt: number;
  /** Roll per galaxy flown through, in radians, and which way. */
  roll: number;
}
interface Level {
  g: Galaxy;
  stars: Star[];
}
interface S {
  u: number;
  pace: number;
  cache: Map<number, Level>;
}

function level(salt: number, n: number): Level {
  const rng = mulberry32((salt + n * 7919) >>> 0);
  return { g: spiral(rng, 1900), stars: field(rng, 160, 6, 3.4) };
}

export default defineTemplate<P, S>({
  id: 'galaxy-dive',
  title: 'Galaxy dive',
  idea: 'An endless flight into spiral galaxies: into the heart of one, its arms streaming past, and out of its core the next spiral, each seeded arm by arm and met from its own angle.',
  style: 'perspective',
  motion: 'ambient',
  answers: true,
  aspect: 2,
  grammar: (rng) => ({
    speed: between(rng, 0.08, 0.13),
    salt: Math.floor(rng() * 1e6),
    roll: (rng() < 0.5 ? -1 : 1) * between(rng, 0.15, 0.45),
  }),
  name: () => 'galaxy dive',
  alt: () =>
    'An endless zoom into spiral galaxies: grey arms of points and soft light stream past as the camera flies into a bright teal core, which opens into the next spiral, and so on.',
  setup: ({ params }) => ({ u: 0.3 + (params.salt % 7) / 10, pace: params.speed, cache: new Map() }),
  draw: ({ ctx, w, h, dt, t, hover, pointer, params, state }) => {
    // The pace eases to the pointer's, so slowing and speeding up are never a jolt.
    state.pace = follow(state.pace, params.speed * (1 - 0.85 * hover), dt, 2.5);
    state.u += dt * state.pace;
    const n = Math.floor(state.u);
    const f = state.u - n;
    const at = (k: number): Level => {
      const hit = state.cache.get(k);
      if (hit) return hit;
      const made = level(params.salt, k);
      for (const key of state.cache.keys()) if (key < n - 1) state.cache.delete(key);
      state.cache.set(k, made);
      return made;
    };
    const U = Math.min(w / 4.2, h / 2.2) * 0.95;
    // The camera, on the flight's distance u: a slow roll, and a drift that keeps the
    // centre of the view moving a little, both smooth through every galaxy boundary.
    const spin = state.u * params.roll;
    const [dx, dy] = [Math.sin(state.u * 0.9) * 0.12 * U, Math.cos(state.u * 0.65) * 0.08 * U];
    const [cs, sn] = [Math.cos(spin), Math.sin(spin)];
    // Galaxy n + d sits in galaxy n's core, R^d times smaller; the view is zoomed by S.
    const map =
      (d: number, S: number) =>
      (x: number, y: number): Pt => {
        const k = Math.pow(R, -d) * S * U;
        const [px, py] = [x * k, y * k];
        return [w / 2 + dx + px * cs - py * sn, h / 2 + dy + px * sn + py * cs];
      };
    const S = Math.pow(R, f);
    // Where everything was a moment ago: its streak, longer the faster it flies out.
    const was = Math.pow(R, f - Math.max(0.002, state.pace * 0.16));
    for (let d = 2; d >= -1; d--) {
      const size = S * Math.pow(R, -d);
      const a = smoothstep(0.012, 0.1, size) * (1 - smoothstep(2.4, 6, size));
      if (a <= 0.01) continue;
      const L = at(n + d);
      // Closing in, the spiral swings toward face-on: the camera comes down over it.
      const g = { ...L.g, tilt: L.g.tilt + (Math.PI / 2 - L.g.tilt) * 0.8 * smoothstep(0.25, 2, size) };
      const trail = size > 0.5 ? map(d, was) : undefined;
      drawField(ctx, L.stars, t, map(d, S), a * 0.7, trail);
      drawGalaxy(ctx, g, t, map(d, S), { alpha: a, size: size * U, hot: d === 1, was: trail });
    }
    return pointer.active ? `next: ${at(n + 1).g.kind}` : 'rest';
  },
});
