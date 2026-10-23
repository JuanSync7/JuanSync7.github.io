import { defineTemplate } from '../defineTemplate';
import { ink } from '../kit/ink';
import { follow } from '../kit/motion';
import { between, pick, type Rng } from '../kit/rng';

/** A snowflake drawn from a seed. Ice grows six arms at sixty degrees, every arm the same,
 *  and every branch leaves its arm at sixty degrees too; the seed picks the habit (a stellar
 *  dendrite, a fern, a sectored plate, a stellar plate or a simple star, after Nakaya's and
 *  Libbrecht's classes), how many branches, how their length runs along the arm, the plates
 *  at the tips and the plate in the middle. One arm is built and turned six times. A front
 *  in the signal runs out from the centre to the tips, as the crystal grew; the pointer's
 *  distance from the centre holds the front there. */

const HABITS = ['stellar dendrite', 'fern', 'sectored plate', 'stellar plate', 'simple star'] as const;
type Habit = (typeof HABITS)[number];
const PROFILES = ['taper', 'bulge', 'even'] as const;

interface P {
  habit: Habit;
  centre: number;
  branches: number;
  reach: number;
  profile: (typeof PROFILES)[number];
  twigs: number;
  tip: number;
  twigTip: number;
  bands: number;
  turn: number;
}
interface S {
  /** Segments of the whole flake in unit radius: x0, y0, x1, y1, and the radius it reaches. */
  segs: number[];
  front: number;
  spin: number;
}

const TAU = Math.PI * 2;
const S60 = Math.sin(Math.PI / 3);

/** A hexagon of radius r round (x, y), turned by a (a plate grows its flat faces between
 *  the arms, so its corners lie on them). */
function hex(o: number[], x: number, y: number, r: number, a = 0): void {
  for (let i = 0; i < 6; i++) {
    const [p, q] = [a + (i / 6) * TAU, a + ((i + 1) / 6) * TAU];
    o.push(x + Math.cos(p) * r, y + Math.sin(p) * r, x + Math.cos(q) * r, y + Math.sin(q) * r);
  }
}

/** One arm along +x, both sides of it. */
function arm(p: P, rng: Rng): number[] {
  const o: number[] = [0, 0, 1, 0];
  const plate = p.habit === 'sectored plate' ? between(rng, 0.5, 0.8) : 0;
  if (plate) {
    // A sector of the plate: its outer edge, and growth bands parallel to it, cut by ridges.
    for (let k = 1; k <= p.bands; k++) {
      const r = (plate * k) / p.bands;
      o.push(r, 0, r * 0.5, r * S60);
    }
    o.push(plate * 0.5, plate * S60 * 0.35, plate * 0.82, plate * 0.12);
  }
  const length = (u: number): number =>
    p.profile === 'taper' ? 1 - u : p.profile === 'bulge' ? Math.sin(Math.PI * u) : 0.7;
  if (p.habit !== 'simple star')
    for (let i = 0; i < p.branches; i++) {
      const u = p.centre + (1 - p.centre) * ((i + 0.6 + (rng() - 0.5) * 0.3) / (p.branches + 0.4));
      if (u < plate) continue;
      // A branch stays inside its arm's sixth of the flake: no longer than its distance out.
      const len = Math.min(u * 0.9, p.reach * length(u) * between(rng, 0.8, 1.1) * (plate ? 0.35 : 1));
      const [ex, ey] = [u + len * 0.5, len * S60];
      o.push(u, 0, ex, ey);
      const twigs = p.habit === 'fern' ? p.twigs + 2 : p.habit === 'stellar dendrite' ? p.twigs : 0;
      for (let k = 1; k <= twigs; k++) {
        const f = k / (twigs + 1);
        const [bx, by] = [u + len * 0.5 * f, len * S60 * f];
        o.push(bx, by, bx + len * 0.3 * (1 - f), by);
      }
      if (p.twigTip > 0.05) hex(o, ex, ey, p.twigTip * len, Math.PI / 6);
    }
  if (p.tip > 0.02) hex(o, 1 - p.tip, 0, p.tip, Math.PI / 6);
  // Mirror across the arm, then the plate in the middle once, its corners on the arms.
  const out = [...o];
  for (let i = 0; i < o.length; i += 4) out.push(o[i] ?? 0, -(o[i + 1] ?? 0), o[i + 2] ?? 0, -(o[i + 3] ?? 0));
  return out;
}

export default defineTemplate<P, S>({
  id: 'snowflake',
  title: 'Snowflake',
  idea: 'A snowflake grown from a seed: six identical arms at sixty degrees, branches leaving them at sixty degrees, the habit (dendrite, fern, sectored plate, stellar plate, star) chosen by the grammar; a teal front runs out from the centre as the crystal grew, and the pointer holds it at its distance.',
  style: 'trace',
  motion: 'ambient',
  answers: true,
  aspect: 2,
  grammar: (rng) => {
    const habit = pick(rng, HABITS);
    return {
      habit,
      centre: between(rng, 0.06, 0.24),
      branches: 2 + Math.floor(rng() * 6),
      reach: between(rng, 0.25, 0.6),
      profile: pick(rng, PROFILES),
      twigs: Math.floor(rng() * 4),
      tip:
        habit === 'stellar plate'
          ? between(rng, 0.1, 0.2)
          : habit === 'simple star' || rng() < 0.3
            ? between(rng, 0.05, 0.1)
            : 0,
      twigTip: habit === 'stellar plate' && rng() < 0.6 ? between(rng, 0.12, 0.3) : 0,
      bands: 2 + Math.floor(rng() * 3),
      turn: (rng() < 0.5 ? -1 : 1) * between(rng, 0.02, 0.05),
    };
  },
  name: (p) => p.habit,
  alt: (p) =>
    `A line drawing of a six-armed snowflake, a ${p.habit}, every arm alike, with a teal front running out from its centre to its tips.`,
  setup: ({ rng, params }) => {
    const one = arm(params, rng);
    const segs: number[] = [];
    for (let k = 0; k < 6; k++) {
      const [c, s] = [Math.cos((k / 6) * TAU), Math.sin((k / 6) * TAU)];
      for (let i = 0; i < one.length; i += 4) {
        const [x0, y0, x1, y1] = [one[i] ?? 0, one[i + 1] ?? 0, one[i + 2] ?? 0, one[i + 3] ?? 0];
        // In short pieces, so the front lights a ring and not whole arms at once.
        const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.04));
        for (let j = 0; j < n; j++) {
          const [a, b] = [j / n, (j + 1) / n];
          const [ax, ay, bx, by] = [x0 + (x1 - x0) * a, y0 + (y1 - y0) * a, x0 + (x1 - x0) * b, y0 + (y1 - y0) * b];
          segs.push(ax * c - ay * s, ax * s + ay * c, bx * c - by * s, bx * s + by * c);
          segs.push(Math.max(Math.hypot(ax, ay), Math.hypot(bx, by)));
        }
      }
    }
    // The centre plate, drawn once.
    const plate: number[] = [];
    hex(plate, 0, 0, params.centre);
    hex(plate, 0, 0, params.centre * 0.55);
    for (let i = 0; i < plate.length; i += 4) segs.push(...plate.slice(i, i + 4), params.centre);
    return { segs, front: 0, spin: 0 };
  },
  draw: ({ ctx, w, h, t, dt, pointer, hover, still, params, state }) => {
    const R = Math.min(w, h) * 0.45;
    const [cx, cy] = [w / 2, h / 2];
    // The front runs out over four seconds and starts again; the pointer holds it.
    const near = Math.hypot((pointer.x * w - cx) / R, (pointer.y * h - cy) / R);
    const target = pointer.active && hover > 0.5 ? Math.min(1.05, near) : ((t * 0.25 + 0.15) % 1.25) - 0.05;
    state.front = still || Math.abs(target - state.front) > 0.5 ? target : follow(state.front, target, dt, 8);
    state.spin = params.turn * t;
    const [c, s] = [Math.cos(state.spin), Math.sin(state.spin)];
    const at = (x: number, y: number): [number, number] => [cx + (x * c - y * s) * R, cy + (x * s + y * c) * R];
    const stroke = (lit: boolean, style: string): void => {
      ctx.beginPath();
      for (let i = 0; i < state.segs.length; i += 5) {
        const r = state.segs[i + 4] ?? 0;
        // Grown wood is grey; the band just inside the front is the signal; beyond it, faint.
        const on = r <= state.front && r > state.front - 0.08;
        if (on !== lit) continue;
        const [a, b] = [
          at(state.segs[i] ?? 0, state.segs[i + 1] ?? 0),
          at(state.segs[i + 2] ?? 0, state.segs[i + 3] ?? 0),
        ];
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
      }
      ctx.strokeStyle = style;
      ctx.stroke();
    };
    stroke(false, ink.line(0.62));
    stroke(true, ink.signal(0.95));
    // Held by the pointer, the ice past the front has not grown yet: drawn over in ground.
    if (pointer.active && hover > 0.5) {
      ctx.beginPath();
      for (let i = 0; i < state.segs.length; i += 5) {
        if ((state.segs[i + 4] ?? 0) <= state.front) continue;
        const [a, b] = [
          at(state.segs[i] ?? 0, state.segs[i + 1] ?? 0),
          at(state.segs[i + 2] ?? 0, state.segs[i + 3] ?? 0),
        ];
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
      }
      ctx.strokeStyle = ink.ground(0.8);
      ctx.stroke();
    }
    return pointer.active ? `r ${Math.max(0, Math.min(1, state.front)).toFixed(2)}` : params.habit;
  },
});
