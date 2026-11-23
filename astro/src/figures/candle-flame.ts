import { defineCanvasFigure } from './define';
import { ink, tone } from './kit/ink';
import { noise2, type Noise2 } from './kit/noise';

/** A candle flame in the room's pen and wash: the same teardrop the pen-and-wash kernel draws on a
 *  lit candle (an orange wash, a pale core, a fine ink outline), made live. Its tip sways and
 *  stretches on slow noise, now and then it gutters, and the core follows the tip by half. It
 *  draws only the flame, its base on a wick 4/5 of the way down its box, so it stands on a baked
 *  drawing's unlit candle and is the only flame there. It takes the page's colours like every
 *  figure: dark ink and a cream core by day, chalk-light ink and a dark core by night. The pointer
 *  is a breath: the flame leans away from it and shrinks. A page may hand it `{ seed }` so candles
 *  side by side do not sway together. */

interface State {
  noise: Noise2;
  lean: number;
}

/** The box is 30 units across; the flame stands on the wick at (15, 24) and is 15 tall at rest,
 *  the kernel's FLAME_H. */
const BOX = 30;
const WICK_X = 15;
const WICK_Y = 24;
const TALL = 15;
const WASH = ink.signal(1);
const CORE = tone('line2');
const LINE = tone('ink');

function seedOf(data: unknown): number {
  if (typeof data !== 'object' || data === null || !('seed' in data)) return 0;
  return typeof data.seed === 'number' ? data.seed : 0;
}

/** One teardrop from its tip down to the wick, as the kernel draws it: `half` is its width at the
 *  belly, `drop` how far the tip stands above the base, `lean` how far the tip has moved across. */
function teardrop(
  ctx: CanvasRenderingContext2D,
  s: number,
  x: number,
  b: number,
  half: number,
  drop: number,
  lean: number,
): void {
  const k = drop / TALL;
  ctx.beginPath();
  ctx.moveTo((x + lean) * s, (b - drop) * s);
  ctx.bezierCurveTo(
    (x + half + lean * 0.5) * s,
    (b - 7 * k) * s,
    (x + half * 0.83 + lean * 0.1) * s,
    (b - 1) * s,
    x * s,
    b * s,
  );
  ctx.bezierCurveTo(
    (x - half * 0.83 + lean * 0.1) * s,
    (b - 1) * s,
    (x - half + lean * 0.5) * s,
    (b - 7 * k) * s,
    (x + lean) * s,
    (b - drop) * s,
  );
  ctx.closePath();
}

export default defineCanvasFigure<State>({
  id: 'candle-flame',
  title: 'Candle flame',
  alt: 'A small candle flame in pen and wash: an orange teardrop with a pale core and a fine ink outline, swaying.',
  idea: 'A candle flame that burns: the flame of the pen-and-wash room, swaying, stretching and now and then guttering, and leaning away from a breath.',
  style: 'ink',
  motion: 'ambient',
  answers: true,
  group: 'feature',
  seed: 1122,
  aspect: 1,
  setup: ({ rng }) => ({ noise: noise2(rng), lean: 0 }),
  draw: ({ ctx, w, h, t, dt, pointer, hover, state, data }) => {
    const s = Math.min(w, h) / BOX;
    const p = seedOf(data) * 1.7;
    const breath = pointer.active ? hover : 0;
    const away = pointer.active ? (0.5 - pointer.x) * 6 * hover : 0;
    state.lean += (state.noise(t * 0.6, p) * 1.6 + away - state.lean) * Math.min(1, dt * 4);
    const lean = state.lean + state.noise(t * 2.4, p + 3) * 0.9;
    // A gutter is a quick dip in height, now and then.
    const gutter = Math.max(0, state.noise(t * 5.5, p + 9) - 0.45) * 0.5;
    const drop = TALL * (1 + state.noise(t * 1.9, p + 5) * 0.12 - gutter) * (1 - breath * 0.2);
    const half = 6 * (1 + state.noise(t * 2.7, p + 7) * 0.07);
    const x0 = (w / s - BOX) / 2 + WICK_X;
    const y0 = (h / s - BOX) / 2 + WICK_Y;
    teardrop(ctx, s, x0, y0, half, drop, lean);
    ctx.fillStyle = WASH;
    ctx.fill();
    // The core is a wash of the page's own paper, lower and narrower, following the tip by half.
    teardrop(ctx, s, x0, y0 - 1, half * 0.68, drop * 0.76, lean * 0.5);
    ctx.fillStyle = CORE;
    ctx.fill();
    teardrop(ctx, s, x0, y0, half, drop, lean);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 0.6 * s;
    ctx.stroke();
    return breath > 0.3 ? 'leaning' : 'rest';
  },
});
