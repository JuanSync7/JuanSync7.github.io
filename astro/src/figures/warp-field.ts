import { defineCanvasFigure } from './define';
import { ink } from './kit/ink';
import { follow } from './kit/motion';

/** A starfield in true perspective: points fly out of a vanishing point and stretch into
 *  streaks as they pass. One star is the signal. The pointer steers, moving the vanishing
 *  point, and the field leans after it. */

interface Star {
  x: number;
  y: number;
  z: number;
}

interface State {
  stars: Star[];
  vx: number;
  vy: number;
}

const COUNT = 220;
const DEPTH = 6;
const SPEED = 1.1;

export default defineCanvasFigure<State>({
  id: 'warp-field',
  title: 'Warp field',
  alt: 'Grey points and short streaks rushing outward from a point near the centre of a dark frame, longer and brighter near the edges, one of them teal.',
  idea: 'The starfield every canvas tutorial starts with, done as perspective should be: depth is speed, and nearness is brightness and length.',
  style: 'perspective',
  motion: 'ambient',
  answers: true,
  group: 'cover',
  seed: 2201,
  aspect: 2,
  setup: ({ rng }) => ({
    stars: Array.from({ length: COUNT }, () => ({ x: (rng() - 0.5) * 2.4, y: (rng() - 0.5) * 1.4, z: rng() * DEPTH })),
    vx: 0.5,
    vy: 0.5,
  }),
  draw: ({ ctx, w, h, t, dt, pointer, hover, still, state }) => {
    const tx = pointer.active ? 0.5 + (pointer.x - 0.5) * 0.6 * hover : 0.5 + Math.sin(t * 0.2) * 0.04;
    const ty = pointer.active ? 0.5 + (pointer.y - 0.5) * 0.6 * hover : 0.5;
    state.vx = still ? tx : follow(state.vx, tx, dt, 2);
    state.vy = still ? ty : follow(state.vy, ty, dt, 2);
    const cx = w * state.vx;
    const cy = h * state.vy;
    const f = Math.min(w, h) * 0.9;
    state.stars.forEach((s, i) => {
      const z = DEPTH - ((DEPTH - s.z + t * SPEED) % DEPTH);
      if (z < 0.08) return;
      const z0 = z + 0.12 * SPEED;
      const ax = cx + (s.x / z) * f;
      const ay = cy + (s.y / z) * f;
      const bx = cx + (s.x / z0) * f;
      const by = cy + (s.y / z0) * f;
      if (ax < -20 || ax > w + 20 || ay < -20 || ay > h + 20) return;
      const near = 1 - z / DEPTH;
      const hot = i === 7;
      ctx.strokeStyle = hot ? ink.signal(0.4 + near * 0.6) : ink.line(0.08 + near * near * 0.75);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(ax + 0.01, ay);
      ctx.stroke();
    });
    return pointer.active && hover > 0.3 ? 'steer' : 'rest';
  },
});
