import { defineTemplate } from '../defineTemplate';
import { ink } from '../kit/ink';
import { noise2, type Noise2 } from '../kit/noise';
import { bayer, cell, pixelGrid, type PixelGrid } from '../kit/pixel';
import { between, pick } from '../kit/rng';
import { MAKERS, type Sprite } from '../kit/sprites';

/** A greyscale pixel-art still life with no image behind it: objects grown from the seed
 *  (`kit/sprites.ts`: cups, vases, bottles, teapots, plants, lamps, books, candles), how
 *  many and which, staged on a podium, a shelf, a table or the ground, with steam or smoke
 *  off the hot ones and weather or stars behind. One object carries the teal: a drink, a
 *  glaze, a flower, a flame, a spine. The pointer lifts the object under it. */

const STAGES = ['podium', 'shelf', 'table', 'ground'] as const;
const AIRS = ['rain', 'snow', 'stars', 'dust'] as const;

interface Item {
  s: Sprite;
  x: number;
  base: number;
  tone: number;
}
interface P {
  cols: number;
  rows: number;
  stage: (typeof STAGES)[number];
  air: (typeof AIRS)[number];
  items: Item[];
  /** Which item's accent is teal. */
  lit: number;
  /** Podium steps: x, top, half-width. */
  steps: [number, number, number][];
  floor: number;
}
interface S {
  noise: Noise2;
}

export default defineTemplate<P, S>({
  id: 'pixel-still',
  title: 'Pixel still life',
  idea: 'A greyscale pixel-art still life with no image to start from: seeded vessels, plants, lamps, books and candles staged on a podium, shelf, table or ground, steam and weather moving round them.',
  style: 'pixel',
  motion: 'ambient',
  answers: true,
  aspect: 2,
  grammar: (rng) => {
    const cols = 2 * Math.floor(between(rng, 28, 37));
    const rows = cols / 2;
    const stage = pick(rng, STAGES);
    const max = stage === 'podium' ? 3 : 2 + Math.floor(rng() * 4);
    const sprites: Sprite[] = [];
    let used = 0;
    for (let k = 0; k < 12 && sprites.length < max; k++) {
      const s = (MAKERS[Math.floor(rng() * MAKERS.length)] ?? MAKERS[0])(rng);
      if (s.height > rows - 9 || used + s.half * 2 + 5 > cols - 10) continue;
      sprites.push(s);
      used += s.half * 2 + 5;
    }
    const floor =
      stage === 'ground'
        ? rows - 5
        : stage === 'table'
          ? rows - 10
          : stage === 'shelf'
            ? Math.round(rows * 0.78)
            : rows - 3;
    // Spread the objects over the width, the slack shared out between them at random.
    const slack = cols - 8 - used;
    const share = sprites.map(() => rng() + 0.3);
    const total = share.reduce((a, b) => a + b, 0) + 0.3;
    let x = 4 + (slack * 0.3) / total;
    const steps: P['steps'] = [];
    const items = sprites.map((s, i) => {
      x += s.half + 2;
      const at = Math.round(x);
      x += s.half + 3 + (slack * (share[i] ?? 0)) / total;
      let base = floor;
      if (stage === 'podium') {
        base = floor - 2 - Math.floor(rng() * 9);
        steps.push([at, base, s.half + 3]);
      }
      return { s, x: at, base, tone: between(rng, 0.5, 0.9) };
    });
    return { cols, rows, stage, air: pick(rng, AIRS), items, lit: Math.floor(rng() * items.length), steps, floor };
  },
  name: (p) => `${p.items.map((i) => i.s.name).join(', ')} on ${p.stage === 'ground' ? 'the ground' : `a ${p.stage}`}`,
  alt: (p) =>
    `Greyscale pixel art of ${p.items.map((i) => (i.s.name === 'books' ? 'some books' : `a ${i.s.name}`)).join(', ')} on ${p.stage === 'ground' ? 'the ground' : `a ${p.stage}`}, with ${p.air} behind; one small part of the ${p.items[p.lit]?.s.name ?? 'scene'} is teal.`,
  setup: ({ rng }) => ({ noise: noise2(rng) }),
  draw: ({ ctx, w, h, t, pointer, hover, params: p, state }) => {
    const g: PixelGrid = pixelGrid(w, h, p.cols, p.rows);
    const hash = (k: number): number => (((Math.sin(k * 127.1 + 311.7) * 43758.5453) % 1) + 1) % 1;
    // The air behind everything.
    for (let k = 0; k < 48; k++) {
      const [a, b] = [hash(k), hash(k + 99)];
      if (p.air === 'rain') {
        const y = Math.floor(((b + t * (0.9 + a * 0.5)) % 1) * (p.rows + 4)) - 2;
        const x = Math.floor(a * p.cols + y * 0.4) % p.cols;
        for (let s = 0; s < 3; s++) cell(ctx, g, x - Math.round(s * 0.4), y - s, ink.line(0.16));
      } else if (p.air === 'snow') {
        const y = Math.floor(((b + t * (0.12 + a * 0.1)) % 1) * p.rows);
        cell(ctx, g, Math.floor(a * p.cols + Math.sin(t + k) * 1.5), y, ink.line(0.32));
      } else if (p.air === 'stars') {
        const tw = 0.5 + 0.5 * Math.sin(t * (1 + a * 2) + k);
        if (tw > bayer(k, 3))
          cell(ctx, g, Math.floor(a * p.cols), Math.floor(b * p.rows * 0.5), ink.line(0.2 + tw * 0.3));
      } else
        cell(
          ctx,
          g,
          Math.floor((a * p.cols + t * (0.6 + b)) % p.cols),
          Math.floor(b * p.rows * 0.8 + Math.sin(t * 0.7 + k) * 2),
          ink.line(0.22),
        );
    }
    // The stage.
    const line = ink.line(0.35);
    if (p.stage === 'podium')
      for (const [x, top, hw] of p.steps)
        for (let y = top + 1; y < p.rows - 2; y++)
          for (let dx = -hw; dx <= hw; dx++)
            if (y === top + 1 || Math.abs(dx) === hw) cell(ctx, g, x + dx, y, ink.line(0.3));
    if (p.stage === 'table' || p.stage === 'shelf') {
      for (let x = 3; x < p.cols - 3; x++) {
        cell(ctx, g, x, p.floor + 1, line);
        cell(ctx, g, x, p.floor + 2, ink.line(0.2));
      }
      for (const x of [6, p.cols - 7])
        for (let y = p.floor + 3; y < (p.stage === 'table' ? p.rows - 1 : p.floor + 7); y++)
          cell(ctx, g, p.stage === 'shelf' ? x + (y - p.floor - 3) : x, y, line);
    }
    if (p.stage === 'ground' || p.stage === 'podium')
      for (let y = p.floor + 1; y < p.rows; y++)
        for (let x = 0; x < p.cols; x++) {
          const fade = y === p.floor + 1 ? 1 : 0.35 - (y - p.floor) * 0.06;
          if (fade > bayer(x, y)) cell(ctx, g, x, y, ink.line(0.2));
        }
    const pick =
      pointer.active && hover > 0.3
        ? p.items.reduce(
            (m, it, i) =>
              Math.abs(it.x - pointer.x * p.cols) < Math.abs((p.items[m]?.x ?? 0) - pointer.x * p.cols) ? i : m,
            0,
          )
        : -1;
    p.items.forEach((it, i) => {
      const lift = i === pick ? 2 : 0;
      const [ox, oy] = [it.x, it.base - lift];
      // A soft shadow under each object on open ground.
      if (p.stage === 'ground')
        for (let dx = -it.s.half - 1; dx <= it.s.half + 1; dx++)
          if (0.5 > bayer(ox + dx, oy + 1)) cell(ctx, g, ox + dx, oy + 1, ink.line(0.12));
      for (const [x, y] of it.s.px) cell(ctx, g, ox + x, oy + y, ink.ground());
      for (const [x, y, r] of it.s.px) {
        const [cx, cy] = [ox + x, oy + y];
        if (r === 0) cell(ctx, g, cx, cy, ink.line(0.6));
        else if (r === 2) cell(ctx, g, cx, cy, i === p.lit ? ink.signal(0.9) : ink.line(0.45));
        else if (r === 1) {
          // Lit from the left: a dim body, its highlight dithered in towards the lit side.
          cell(ctx, g, cx, cy, ink.line(0.13));
          if (it.tone * 2 * (0.5 - x / (2 * it.s.half + 1)) > bayer(cx, cy)) cell(ctx, g, cx, cy, ink.line(0.45));
        } else if (0.1 + 0.08 * Math.sin(t * 2 + i) > bayer(cx, cy)) cell(ctx, g, cx, cy, ink.line(0.3));
      }
      if (!it.s.vent) return;
      // Steam off a hot drink, smoke off a flame: dithered wisps curling up.
      const tall = i === pick ? 15 : 11;
      for (let wisp = -1; wisp <= 1; wisp++)
        for (let s = 1; s <= tall; s++) {
          const y = oy + it.s.vent[1] - s;
          const drift = state.noise(s * 0.22 - t * 1.1, i * 5 + wisp * 1.7) * 2.4;
          const x = ox + it.s.vent[0] + wisp * (it.s.name === 'candle' ? 0 : 2) + Math.round(drift);
          const fade = 1 - s / (tall + 1);
          if (fade * 0.9 > bayer(x, y)) cell(ctx, g, x, y, ink.line(0.18 + fade * 0.3));
        }
    });
    return pick >= 0 ? (p.items[pick]?.s.name ?? 'rest') : 'rest';
  },
});
