import { defineCanvasFigure } from './define';
import { ink } from './kit/ink';
import { follow } from './kit/motion';

/** Inference as a tunnel of token frames running to a vanishing point. Each cycle begins
 *  with prefill, one fast wave that lights every frame of the prompt at once, then decode:
 *  new tokens are made one at a time and travel out toward the viewer, the newest in the
 *  signal. The pointer looks down the tunnel from another angle. */

interface State {
  vx: number;
  vy: number;
}

const FRAMES = 18;
const CYCLE = 6;
const PREFILL = 1.1;
const DEPTH = 9;

export default defineCanvasFigure<State>({
  id: 'prefill-tunnel',
  title: 'Prefill tunnel',
  alt: 'Square outlines receding down a tunnel to a vanishing point; a bright wave runs through them all, then single frames light one at a time, the newest in teal, and travel toward the viewer.',
  idea: 'Prefill and decode as one tunnel: the prompt is read in a single sweep, then each new token is made alone and comes out to meet you.',
  style: 'perspective',
  motion: 'ambient',
  answers: true,
  group: 'feature',
  seed: 4242,
  aspect: 1.6,
  setup: () => ({ vx: 0.5, vy: 0.5 }),
  draw: ({ ctx, w, h, t, dt, pointer, hover, still, state }) => {
    const tx = pointer.active ? 0.5 + (pointer.x - 0.5) * 0.7 * hover : 0.5;
    const ty = pointer.active ? 0.5 + (pointer.y - 0.5) * 0.7 * hover : 0.46;
    state.vx = still ? tx : follow(state.vx, tx, dt, 3);
    state.vy = still ? ty : follow(state.vy, ty, dt, 3);
    const f = Math.min(w, h) * 0.55;
    const cx = w * state.vx;
    const cy = h * state.vy;
    const phase = t % CYCLE;
    const prefill = phase < PREFILL;
    const wave = (phase / PREFILL) * DEPTH;
    // Decode: one token per 0.5 s, each born at the far end and drifting forward.
    const decodeT = Math.max(0, phase - PREFILL);
    const born = Math.floor(decodeT / 0.5);
    const sq = (z: number, half: number): [number, number, number, number] => {
      const s = (half * f) / z;
      return [cx - s * 1.6, cy - s, s * 3.2, s * 2];
    };

    // The side rails run from the near corners to the far frame, not to the vanishing
    // point, so they never cross the token frames in the middle.
    ctx.strokeStyle = ink.line(0.08);
    const near = sq(0.6, 1);
    const far = sq(DEPTH + 0.7, 1);
    const corners = (r: [number, number, number, number]): [number, number][] => [
      [r[0], r[1]],
      [r[0] + r[2], r[1]],
      [r[0], r[1] + r[3]],
      [r[0] + r[2], r[1] + r[3]],
    ];
    corners(near).forEach(([x, y], k) => {
      const end = corners(far)[k] ?? [cx, cy];
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(end[0], end[1]);
      ctx.stroke();
    });

    // The frames flow toward the viewer, a frame every 0.5 units of depth.
    const gap = DEPTH / FRAMES;
    const flow = (t * 0.7) % gap;
    for (let k = FRAMES; k >= 0; k--) {
      const z = 0.7 + k * gap - flow;
      if (z < 0.62) continue;
      const r = sq(z, 1);
      const fade = 1 - z / (DEPTH + 1);
      const lit = prefill ? Math.max(0, 1 - Math.abs(z - wave) / 1.2) : 0;
      ctx.strokeStyle = ink.line(0.06 + fade * 0.22 + lit * 0.6);
      ctx.strokeRect(r[0], r[1], r[2], r[3]);
    }

    for (let n = 0; n <= born && !prefill; n++) {
      const age = decodeT - n * 0.5;
      const z = DEPTH + 0.7 - age * 2.2;
      if (z < 0.65) continue;
      const r = sq(z, 0.62);
      const newest = n === born;
      ctx.strokeStyle = newest ? ink.signal(0.95) : ink.line(0.25 + (1 - z / DEPTH) * 0.35);
      ctx.strokeRect(r[0], r[1], r[2], r[3]);
    }
    if (prefill) {
      const r = sq(Math.max(0.7, wave), 0.62);
      ctx.strokeStyle = ink.signal(0.9);
      ctx.strokeRect(r[0], r[1], r[2], r[3]);
    }
    return pointer.active ? (prefill ? 'prefill' : `decode · token ${born + 1}`) : 'rest';
  },
});
