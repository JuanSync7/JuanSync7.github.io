import { defineCanvasFigure } from './define';
import { brush, ridge, texture, type Pt } from './kit/brush';
import { ink } from './kit/ink';
import { follow } from './kit/motion';
import { noise2, type Noise2 } from './kit/noise';

/** An endless ink landscape after shan-shui-inf: ranges in three layers, each a run of
 *  mountains drawn with a tapered brush and dry cun strokes beneath the ridge, scrolling at
 *  its own depth. A single moon is the signal. The pointer pans the scroll for parallax. */

interface State {
  noise: Noise2;
  pan: number;
}

const LAYERS = [
  { base: 0.6, height: 0.42, speed: 6, alpha: 0.22, width: 1.6, span: 0.34 },
  { base: 0.78, height: 0.4, speed: 14, alpha: 0.42, width: 2.2, span: 0.3 },
  { base: 0.98, height: 0.36, speed: 26, alpha: 0.7, width: 3, span: 0.26 },
] as const;

export default defineCanvasFigure<State>({
  id: 'ink-mountains',
  title: 'Ink mountains',
  alt: 'An ink-brush landscape of three mountain ranges, pale far away and darker near, with short brush marks under each ridge and a small teal moon outline in the sky.',
  idea: 'A chip as a landscape scroll: ranges drawn with a tapered brush in the shan-shui manner, endless, each layer at its own pace.',
  style: 'ink',
  motion: 'ambient',
  answers: true,
  group: 'cover',
  seed: 1931,
  aspect: 2,
  setup: ({ rng }) => ({ noise: noise2(rng), pan: 0 }),
  draw: ({ ctx, w, h, t, dt, pointer, hover, still, state }) => {
    const target = pointer.active ? (pointer.x - 0.5) * 2 * hover : 0;
    state.pan = still ? target : follow(state.pan, target, dt, 2.5);
    ctx.strokeStyle = ink.signal(0.85);
    ctx.beginPath();
    ctx.arc(w * (0.76 - state.pan * 0.01), h * 0.2, Math.min(w, h) * 0.05, 0, Math.PI * 2);
    ctx.stroke();
    LAYERS.forEach((L, li) => {
      const span = w * L.span;
      const off = t * L.speed + state.pan * L.speed * 6;
      const first = Math.floor(off / span) - 1;
      for (let i = first; i < first + Math.ceil(w / span) + 3; i++) {
        const lift = 0.5 + 0.5 * state.noise(i * 0.71, li * 3.1);
        const broad = 0.5 + 0.5 * state.noise(i * 0.53 + 4.2, li * 1.7);
        const width = span * (0.8 + 1.1 * broad);
        const wx0 = i * span - width * 0.15;
        const top = ridge(state.noise, wx0, wx0 + width, h * L.base, h * L.height * (0.35 + 0.75 * lift), i * 13 + li * 101, 5, 0.35 + 0.6 * lift);
        const pts: Pt[] = top.map((p) => [p[0] - off, p[1]]);
        const head = pts[0];
        const tail = pts[pts.length - 1];
        if (!head || !tail || tail[0] < -10 || head[0] > w + 10) continue;
        // Fill with the ground so nearer ranges hide the ones behind them.
        ctx.beginPath();
        ctx.moveTo(head[0], h);
        for (const p of pts) ctx.lineTo(p[0], p[1]);
        ctx.lineTo(tail[0], h);
        ctx.closePath();
        ctx.fillStyle = ink.ground();
        ctx.fill();
        ctx.fillStyle = ink.line(L.alpha);
        brush(ctx, pts, { width: L.width, noise: state.noise, wobble: 0.5, seed: i + li * 7 });
        ctx.strokeStyle = ink.line(L.alpha * 0.45);
        texture(ctx, pts.filter((_, k) => state.noise(k * 0.9 + i, li + 0.5) > 0.12), h * L.height * 0.3, state.noise, 3);
      }
    });
    return pointer.active && hover > 0.3 ? 'pan' : 'rest';
  },
});
