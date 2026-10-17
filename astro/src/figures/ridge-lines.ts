import { defineCanvasFigure } from './define';
import { ink } from './kit/ink';
import { noise2, type Noise2 } from './kit/noise';

/** Stacked ridge lines, back to front, each hiding the ones behind it (the "Unknown
 *  Pleasures" plot). Read as attention over a sequence: one ridge at a time lights as the
 *  model decodes, and the peaks rise under the pointer. */

interface State {
  noise: Noise2;
}

const RIDGES = 15;

export default defineCanvasFigure<State>({
  id: 'ridge-lines',
  title: 'Ridge lines',
  alt: 'Fifteen stacked ridge lines in perspective, like a range of hills; one line at a time lights up in teal, front to back.',
  idea: 'A ridgeline plot of attention: each ridge is one decoding step, and the lit ridge walks forward like the next token.',
  style: 'field',
  motion: 'ambient',
  answers: true,
  group: 'cover',
  seed: 1406,
  aspect: 16 / 9,
  setup: ({ rng }) => ({ noise: noise2(rng) }),
  draw: ({ ctx, w, h, t, hover, state }) => {
    const top = h * 0.2;
    const span = h * 0.7;
    const lit = Math.floor(t * 2.2) % RIDGES;
    for (let i = 0; i < RIDGES; i++) {
      const y0 = top + (i * span) / RIDGES;
      const depth = i / (RIDGES - 1);
      const m = w * (0.2 - depth * 0.12);
      const pts: [number, number][] = [];
      for (let x = m; x <= w - m + 0.1; x += 4) {
        const u = (x - m) / (w - 2 * m);
        const bump = Math.exp(-Math.pow(u - 0.5, 2) / 0.03);
        const n = state.noise(u * 9 + i * 1.3, t * 0.35) + 0.5 * state.noise(u * 23, i + t * 0.2);
        const lift = (7 + hover * 14) * bump * (1.15 + n) + 1.4 * Math.sin(u * 9 + i);
        pts.push([x, y0 - Math.max(0, lift) * (h / 220)]);
      }
      const first = pts[0];
      if (!first) continue;
      ctx.beginPath();
      ctx.moveTo(first[0], first[1]);
      for (const p of pts) ctx.lineTo(p[0], p[1]);
      ctx.lineTo(w - m, h);
      ctx.lineTo(m, h);
      ctx.closePath();
      ctx.fillStyle = ink.ground();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(first[0], first[1]);
      for (const p of pts) ctx.lineTo(p[0], p[1]);
      ctx.strokeStyle = i === lit ? ink.signal(0.95) : ink.line(0.14 + depth * 0.45);
      ctx.stroke();
    }
  },
});
