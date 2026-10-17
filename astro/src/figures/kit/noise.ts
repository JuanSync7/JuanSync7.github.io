import type { Rng } from './rng';

/** Seeded 2D gradient noise (Perlin style), in roughly [-1, 1]. Smooth fields, ridges
 *  and brush wobble come from this, never from fresh random numbers per frame. */
export interface Noise2 {
  (x: number, y: number): number;
}

const fade = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export function noise2(rng: Rng): Noise2 {
  const perm = new Uint8Array(512);
  const base = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = base[i] ?? 0;
    base[i] = base[j] ?? 0;
    base[j] = tmp;
  }
  for (let i = 0; i < 512; i++) perm[i] = base[i & 255] ?? 0;
  const grad = (h: number, x: number, y: number): number => {
    const g = h & 7;
    const u = g < 4 ? x : y;
    const v = g < 4 ? y : x;
    return ((g & 1) === 0 ? u : -u) + ((g & 2) === 0 ? v : -v);
  };
  return (x: number, y: number): number => {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const p = (i: number): number => perm[i] ?? 0;
    const aa = p(p(xi) + yi);
    const ab = p(p(xi) + yi + 1);
    const ba = p(p(xi + 1) + yi);
    const bb = p(p(xi + 1) + yi + 1);
    const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
    const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);
    return lerp(x1, x2, v) * 0.7;
  };
}

/** Fractal sum of octaves: big shapes with finer detail on top. */
export function fbm(n: Noise2, x: number, y: number, octaves = 4): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let o = 0; o < octaves; o++) {
    sum += amp * n(x * freq, y * freq);
    freq *= 2;
    amp *= 0.5;
  }
  return sum;
}
