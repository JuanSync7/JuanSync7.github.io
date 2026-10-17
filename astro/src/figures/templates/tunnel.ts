import { defineTemplate } from '../defineTemplate';
import { ink } from '../kit/ink';
import { follow } from '../kit/motion';
import { between, pick } from '../kit/rng';

/** Tunnels in true perspective, flowing toward the viewer: square, round, hexagonal, a
 *  twisting vortex, a corridor of arches, a grid-walled shaft. One frame travels through
 *  in the signal. The pointer steers, moving the vanishing point. */

const FORMS = ['square', 'round', 'hexagon', 'vortex', 'arches', 'grid'] as const;
type Form = (typeof FORMS)[number];

interface P {
  form: Form;
  sides: number;
  twist: number;
  speed: number;
  frames: number;
  wide: number;
}

interface S {
  vx: number;
  vy: number;
}

const DEPTH = 10;

export default defineTemplate<P, S>({
  id: 'tunnel',
  title: 'Tunnel',
  idea: 'Motion through a tunnel in perspective, frames rushing out of a vanishing point, in one of several shapes: square, round, hexagonal, a twisting vortex, arches, a grid.',
  style: 'perspective',
  motion: 'ambient',
  answers: true,
  aspect: 2,
  grammar: (rng) => {
    const form = pick(rng, FORMS);
    const sides = form === 'square' || form === 'grid' ? 4 : form === 'hexagon' ? 6 : form === 'arches' ? 12 : 48;
    return { form, sides, twist: form === 'vortex' ? between(rng, 0.25, 0.6) * (rng() < 0.5 ? -1 : 1) : form === 'hexagon' ? between(rng, 0, 0.08) : 0, speed: between(rng, 0.8, 1.6), frames: 14 + Math.floor(rng() * 12), wide: between(rng, 1.3, 1.9) };
  },
  name: (p) => (p.form === 'vortex' ? 'vortex' : `${p.form} tunnel`),
  alt: (p) => `A ${p.form} tunnel drawn in grey lines receding to a vanishing point, its frames flowing toward the viewer, one of them teal.`,
  setup: () => ({ vx: 0.5, vy: 0.5 }),
  draw: ({ ctx, w, h, t, dt, pointer, hover, still, params, state }) => {
    const tx = pointer.active ? 0.5 + (pointer.x - 0.5) * 0.7 * hover : 0.5 + Math.sin(t * 0.25) * 0.04;
    const ty = pointer.active ? 0.5 + (pointer.y - 0.5) * 0.7 * hover : 0.5;
    state.vx = still ? tx : follow(state.vx, tx, dt, 3);
    state.vy = still ? ty : follow(state.vy, ty, dt, 3);
    const cx = w * state.vx;
    const cy = h * state.vy;
    const f = Math.min(w, h) * 0.5;
    const gap = DEPTH / params.frames;
    const flow = (t * params.speed) % gap;
    const n = params.sides;
    const arch = params.form === 'arches';
    const ring = (z: number): [number, number][] => {
      const rot = params.twist * z * 3 + (params.form === 'vortex' ? t * 0.4 : 0);
      const pts: [number, number][] = [];
      const count = arch ? n + 1 : n;
      for (let i = 0; i < count; i++) {
        const a = arch ? Math.PI + (i / n) * Math.PI : rot + (i / n) * Math.PI * 2 + (n === 4 ? Math.PI / 4 : 0);
        const sx = n === 4 ? params.wide * Math.SQRT2 : params.wide;
        const sy = n === 4 ? Math.SQRT2 : 1;
        pts.push([cx + (Math.cos(a) * sx * f) / z, cy + (Math.sin(a) * sy * f) / z + (arch ? (0.4 * f) / z : 0)]);
      }
      if (!arch) return pts;
      // An arch stands on two legs: drop each end of the curve to the floor.
      const left = pts[0]?.[0] ?? cx;
      const right = pts[pts.length - 1]?.[0] ?? cx;
      return [[left, cy + f / z], ...pts, [right, cy + f / z]];
    };
    const zs: number[] = [];
    for (let k = params.frames; k >= 0; k--) {
      const z = 0.55 + k * gap - flow;
      if (z > 0.5) zs.push(z);
    }
    const hot = zs[Math.floor(zs.length * 0.55 + ((t * 2) % 1))] ?? -1;
    let prev: [number, number][] | null = null;
    for (const z of zs) {
      const pts = ring(z);
      const fade = 1 - z / (DEPTH + 1);
      ctx.strokeStyle = z === hot ? ink.signal(0.9) : ink.line(0.05 + fade * fade * 0.55);
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      if (!arch) ctx.closePath();
      ctx.stroke();
      // Lines along the walls join each frame to the next: every vertex for a grid or a
      // vortex, every few for the rest.
      if (prev) {
        const every = params.form === 'grid' || params.form === 'vortex' ? (params.form === 'vortex' ? 6 : 1) : Math.max(1, Math.floor(n / 4));
        ctx.strokeStyle = ink.line(0.04 + fade * 0.2);
        ctx.beginPath();
        for (let i = 0; i < pts.length; i += every) {
          const a = pts[i];
          const b = prev[i];
          if (!a || !b) continue;
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
        }
        ctx.stroke();
      }
      if (params.form === 'grid' && prev) {
        ctx.strokeStyle = ink.line(0.03 + fade * 0.12);
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = pts[i];
          const b = pts[(i + 1) % 4];
          if (!a || !b) continue;
          for (let k = 1; k < 4; k++) {
            const x = a[0] + ((b[0] - a[0]) * k) / 4;
            const y = a[1] + ((b[1] - a[1]) * k) / 4;
            const pa = prev[i];
            const pb = prev[(i + 1) % 4];
            if (!pa || !pb) continue;
            ctx.moveTo(x, y);
            ctx.lineTo(pa[0] + ((pb[0] - pa[0]) * k) / 4, pa[1] + ((pb[1] - pa[1]) * k) / 4);
          }
        }
        ctx.stroke();
      }
      prev = pts;
    }
    return pointer.active ? `${params.form} · steer` : 'rest';
  },
});
