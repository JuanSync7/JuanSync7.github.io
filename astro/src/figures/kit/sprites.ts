import { pick, type Rng } from './rng';

/** Pixel-art objects grown from the seed, with no image to start from: vessels turned on a
 *  lathe from a seeded profile (cups, mugs, vases, bottles, glasses, jars, teapots), potted
 *  plants that grow by random walk, lamps, rows of books and candles. Each is a list of
 *  pixels with a role, standing on its base at (0, 0), y up. */

/** 0 outline, 1 body (drawn as a dithered tone), 2 accent (the one place teal may go),
 *  3 light (a faint glow). */
export type Role = 0 | 1 | 2 | 3;
export interface Sprite {
  name: string;
  px: [number, number, Role][];
  /** Half its width, in pixels. */
  half: number;
  height: number;
  /** Where steam or smoke leaves it, if it gives any off. */
  vent: [number, number] | null;
}

const VESSELS = {
  cup: { w: [3, 4, 5, 5], h: [5, 7], open: true, handle: true, hot: true },
  mug: { w: [4, 4, 4, 4], h: [6, 9], open: true, handle: true, hot: true },
  vase: { w: [3, 5, 6, 4, 2, 3], h: [10, 16], open: true, handle: false, hot: false },
  bottle: { w: [4, 4, 4, 4, 2, 1, 1], h: [12, 18], open: false, handle: false, hot: false },
  glass: { w: [0, 0, 0, 1, 4, 5, 5], h: [9, 13], open: true, handle: false, hot: false },
  jar: { w: [5, 5, 5, 5, 4], h: [7, 10], open: false, handle: false, hot: false },
  teapot: { w: [4, 6, 6, 5, 3], h: [7, 9], open: false, handle: true, hot: true },
} as const;
type Vessel = keyof typeof VESSELS;

/** The half-width at height t (0 base, 1 top) along a profile, smoothly between its points. */
function along(w: readonly number[], t: number): number {
  const u = t * (w.length - 1);
  const i = Math.min(w.length - 2, Math.floor(u));
  const f = u - i;
  const s = f * f * (3 - 2 * f);
  return (w[i] ?? 0) * (1 - s) + (w[i + 1] ?? 0) * s;
}

/** A vessel turned from its kind's profile, every width and its height nudged by the seed. */
export function vessel(rng: Rng, kind: Vessel = pick(rng, Object.keys(VESSELS) as Vessel[])): Sprite {
  const v = VESSELS[kind];
  const h = v.h[0] + Math.floor(rng() * (v.h[1] - v.h[0] + 1));
  const prof = v.w.map((x) => Math.max(0, x + (x > 1 ? Math.round((rng() - 0.5) * 2) : 0)));
  const px: Sprite['px'] = [];
  let last = -1;
  let half = 0;
  for (let y = 0; y < h; y++) {
    const w = kind === 'glass' && y === 0 ? 3 : Math.round(along(prof, y / (h - 1)));
    half = Math.max(half, w);
    for (const s of [-1, 1]) {
      px.push([s * w, -y, 0]);
      // Where the profile steps out or in, the outline runs along the row to stay unbroken.
      if (last >= 0) for (let x = Math.min(w, last) + 1; x < Math.max(w, last); x++) px.push([s * x, -y, 0]);
    }
    if (y === 0 || (!v.open && y === h - 1)) for (let x = -w + 1; x < w; x++) px.push([x, -y, 0]);
    else if (w > 1) for (let x = -w + 1; x < w; x++) px.push([x, -y, kind === 'glass' && y < h * 0.45 ? 3 : 1]);
    last = w;
  }
  const top = Math.round(along(prof, 1));
  // Drink in a cup, glass or mug; a glaze band on a vase; a label on a bottle or jar.
  if (v.open && kind !== 'vase') for (let x = -top + 1; x < top; x++) px.push([x, -(h - 2), 2]);
  else {
    const y0 = Math.floor(h * (kind === 'vase' ? 0.55 : 0.3));
    for (let y = y0; y < y0 + 2; y++) {
      const w = Math.round(along(prof, y / (h - 1)));
      for (let x = -w + 1; x < w; x++) px.push([x, -y, 2]);
    }
  }
  if (v.handle) {
    const [x0, y0, y1] = [Math.round(along(prof, 0.5)) + 1, Math.floor(h * 0.25), Math.floor(h * 0.7)];
    for (let y = y0; y <= y1; y++) px.push([x0 + (y === y0 || y === y1 ? 0 : 1), -y, 0]);
  }
  if (kind === 'teapot') {
    const x0 = -Math.round(along(prof, 0.4));
    for (let k = 1; k <= 4; k++) px.push([x0 - k, -Math.floor(h * 0.4) - k, 0]);
    px.push([0, -h, 0], [0, -h - 1, 0]);
  }
  if (!v.open && kind === 'jar') for (let x = -top; x <= top; x++) px.push([x, -h, 0]);
  return { name: kind, px, half: half + (v.handle ? 2 : 0), height: h, vent: v.hot ? [0, -h] : null };
}

/** A pot with stems that wander up from it, leaves along them and a flower on one. */
export function plant(rng: Rng): Sprite {
  const pot = vessel(rng, 'cup');
  const px: Sprite['px'] = pot.px.filter(([, , r]) => r !== 2).map(([x, y, r]): [number, number, Role] => [x, y, r]);
  const base = -pot.height;
  const stems = 2 + Math.floor(rng() * 4);
  let tip: [number, number] = [0, base];
  let tall = pot.height;
  for (let s = 0; s < stems; s++) {
    let [x, y] = [Math.round((rng() - 0.5) * 4), base];
    const len = 4 + Math.floor(rng() * 9);
    const lean = rng() - 0.5;
    for (let k = 0; k < len; k++) {
      y -= 1;
      if (rng() < Math.abs(lean) + 0.2) x += lean > 0 ? 1 : -1;
      px.push([x, y, 0]);
      if (k % 2 === 1) px.push([x + (k % 4 === 1 ? 1 : -1), y, 1], [x + (k % 4 === 1 ? 2 : -2), y + 1, 1]);
    }
    if (y < tip[1]) tip = [x, y];
    tall = Math.max(tall, -y);
  }
  for (const [dx, dy] of [
    [0, -1],
    [-1, 0],
    [1, 0],
    [0, 1],
  ] as const)
    px.push([tip[0] + dx, tip[1] - 1 + dy, 2]);
  return { name: 'plant', px, half: Math.max(pot.half, 6), height: tall + 2, vent: null };
}

/** A lamp: a turned base, a pole, a shade, and the light falling from it. */
export function lamp(rng: Rng): Sprite {
  const pole = 8 + Math.floor(rng() * 8);
  const [top, bot] = [2 + Math.floor(rng() * 2), 5 + Math.floor(rng() * 2)];
  const px: Sprite['px'] = [];
  for (let x = -3; x <= 3; x++) px.push([x, 0, 0]);
  for (let x = -2; x <= 2; x++) px.push([x, -1, 0]);
  for (let y = 2; y <= pole; y++) px.push([0, -y, 0]);
  for (let k = 0; k < 4; k++) {
    const w = Math.round(top + ((bot - top) * k) / 3);
    const y = -(pole + 4 - k);
    px.push([-w, y, 0], [w, y, 0]);
    if (k === 0 || k === 3) for (let x = -w + 1; x < w; x++) px.push([x, y, k === 3 ? 2 : 0]);
  }
  for (let y = pole - 1; y > 2; y--) {
    const w = bot + Math.floor((pole - y) / 2);
    for (let x = -w; x <= w; x++) if (x !== 0) px.push([x, -y, 3]);
  }
  return { name: 'lamp', px, half: bot + Math.floor(pole / 2), height: pole + 5, vent: null };
}

/** A row of books, their heights and widths seeded, with bands on their spines. */
export function books(rng: Rng): Sprite {
  const px: Sprite['px'] = [];
  const n = 3 + Math.floor(rng() * 5);
  const lit = Math.floor(rng() * n);
  let x = 0;
  let tall = 0;
  for (let b = 0; b < n; b++) {
    const [w, h] = [2 + Math.floor(rng() * 2), 6 + Math.floor(rng() * 6)];
    tall = Math.max(tall, h);
    for (let y = 0; y < h; y++)
      for (let k = 0; k <= w; k++) {
        const edge = k === 0 || k === w || y === 0 || y === h - 1;
        const band = y === 2 || y === h - 3;
        px.push([x + k, -y, edge ? 0 : band ? (b === lit ? 2 : 1) : 3]);
      }
    x += w + 1;
  }
  const half = Math.ceil(x / 2);
  return { name: 'books', px: px.map(([a, y, r]) => [a - half, y, r]), half, height: tall, vent: null };
}

/** A candle in its holder, its flame the accent, its smoke rising. */
export function candle(rng: Rng): Sprite {
  const [w, h] = [1 + Math.floor(rng() * 2), 4 + Math.floor(rng() * 6)];
  const px: Sprite['px'] = [];
  for (let x = -4; x <= 4; x++) px.push([x, 0, 0]);
  for (let y = 1; y <= h + 1; y++)
    for (let x = -w; x <= w; x++) px.push([x, -y, x === -w || x === w || y === h + 1 ? 0 : 3]);
  px.push([0, -h - 2, 0], [0, -h - 3, 2], [0, -h - 4, 2]);
  return { name: 'candle', px, half: 4, height: h + 5, vent: [0, -h - 5] };
}

export const MAKERS = [vessel, vessel, vessel, plant, lamp, books, candle] as const;
