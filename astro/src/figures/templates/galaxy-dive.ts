import { defineTemplate } from '../defineTemplate';
import { drawField, drawGalaxy, field, galaxy, type Galaxy, type Pt, type Star } from '../kit/cosmos';
import { smoothstep } from '../kit/motion';
import { between, mulberry32 } from '../kit/rng';

/** An endless dive through galaxies: the camera flies at one galaxy, through its stars
 *  (which stream past as streaks), toward a smaller galaxy far behind it, which grows to
 *  fill the view and is then flown through in turn. Every galaxy is seeded (spiral, barred,
 *  elliptical or irregular) and seen at its own tilt and roll, so each one is met from a
 *  new angle. The next galaxy's core is the signal. The pointer slows the flight. */

/** How much bigger a galaxy looks than the next one, far behind it, when first in view. */
const R = 9;

interface P {
  speed: number;
  salt: number;
}
interface Level {
  g: Galaxy;
  stars: Star[];
  /** Where the next galaxy sits on this one's sky. */
  w: Pt;
}
interface S {
  u: number;
  cache: Map<number, Level>;
}

function level(salt: number, n: number): Level {
  const rng = mulberry32((salt + n * 7919) >>> 0);
  const g = galaxy(rng, 1700);
  const [r, a] = [between(rng, 0.45, 0.9), rng() * Math.PI * 2];
  return { g, stars: field(rng, 180, 7, 3.6), w: [Math.cos(a) * r * 1.4, Math.sin(a) * r * 0.7] };
}

export default defineTemplate<P, S>({
  id: 'galaxy-dive',
  title: 'Galaxy dive',
  idea: 'An endless flight through galaxies: through the stars of one, which stream past, toward the next one far behind it, each galaxy seeded and met from a new angle.',
  style: 'perspective',
  motion: 'ambient',
  answers: true,
  aspect: 2,
  grammar: (rng) => ({ speed: between(rng, 0.09, 0.15), salt: Math.floor(rng() * 1e6) }),
  name: () => 'galaxy dive',
  alt: () =>
    'An endless zoom through space: a galaxy of grey points grows and streams past as streaks while a smaller galaxy behind it, its core teal, grows to fill the view, and so on.',
  setup: ({ params }) => ({ u: 0.3 + (params.salt % 7) / 10, cache: new Map() }),
  draw: ({ ctx, w, h, dt, t, hover, pointer, params, state }) => {
    const pace = params.speed * (1 - 0.85 * hover);
    state.u += dt * pace;
    const n = Math.floor(state.u);
    const f = state.u - n;
    const at = (k: number): Level => {
      const hit = state.cache.get(k);
      if (hit) return hit;
      const made = level(params.salt, k);
      if (state.cache.size > 10) state.cache.clear();
      state.cache.set(k, made);
      return made;
    };
    const here = at(n);
    const [qx, qy] = [(here.w[0] * R) / (R - 1), (here.w[1] * R) / (R - 1)];
    const U = Math.min(w / 4.2, h / 2.2) * 0.95;
    // Galaxy n + d's sky mapped into galaxy n's, through each one's place for the next,
    // then zoomed by S about the point that carries galaxy n + 1 onto the whole view.
    const map =
      (d: number, S: number) =>
      (x: number, y: number): Pt => {
        let [px, py] = [x, y];
        for (let k = d - 1; k >= 0; k--) {
          const l = at(n + k);
          [px, py] = [l.w[0] + px / R, l.w[1] + py / R];
        }
        if (d < 0) {
          const up = at(n - 1);
          [px, py] = [(px - up.w[0]) * R, (py - up.w[1]) * R];
        }
        return [w / 2 + (qx + (px - qx) * S) * U, h / 2 + (qy + (py - qy) * S) * U];
      };
    const S = Math.pow(R, f);
    // Where everything was a moment ago: its streak, longer the faster it moves out.
    const was = Math.pow(R, f - Math.max(0.003, pace * 0.2));
    for (let d = 2; d >= -1; d--) {
      const size = S * Math.pow(R, -d);
      const a = smoothstep(0.015, 0.12, size) * (1 - smoothstep(2.2, 5.5, size));
      if (a <= 0.01) continue;
      const L = at(n + d);
      const trail = size > 0.6 ? map(d, was) : undefined;
      drawField(ctx, L.stars, t, map(d, S), a * 0.8, trail);
      drawGalaxy(ctx, L.g, t, map(d, S), { alpha: a, size: size * U, hot: d === 1, was: trail });
    }
    return pointer.active ? `next: ${at(n + 1).g.kind}` : 'rest';
  },
});
