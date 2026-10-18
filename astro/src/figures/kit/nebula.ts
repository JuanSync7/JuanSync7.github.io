import { beacon } from './glow';
import { ink, rgb } from './ink';
import { fbm, noise2 } from './noise';
import { between, pick, type Rng } from './rng';

/** Nebulae as grey gas: a density field from warped noise, shaped as a cloud, pillars
 *  rising from a dark floor, a ring (a planetary nebula) or a veil of filaments, with dark
 *  lanes of dust cut through it. Baked once into a small image the figure draws scaled up,
 *  so the gas is soft while the stars over it stay sharp. */

export const SHAPES = ['cloud', 'pillars', 'ring', 'veil'] as const;
export type Shape = (typeof SHAPES)[number];

export interface Gas {
  shape: Shape;
  image: HTMLCanvasElement;
  /** The density at (u, v) in 0..1, for placing stars where the gas is thick. */
  at: (u: number, v: number) => number;
}

/** A gw × gh density field, baked as the ink grey at the density's opacity. */
export function gas(rng: Rng, gw = 240, gh = 120, shape: Shape = pick(rng, SHAPES)): Gas {
  const [n, m, k] = [noise2(rng), noise2(rng), noise2(rng)];
  const [ox, oy] = [between(rng, 0.3, 0.7), between(rng, 0.35, 0.65)];
  const cols = 2 + Math.floor(rng() * 3);
  const d = new Float32Array(gw * gh);
  for (let j = 0; j < gh; j++)
    for (let i = 0; i < gw; i++) {
      const [u, v] = [i / gw, j / gh];
      const [x, y] = [u * 4, v * 2];
      // Warp the domain by another noise, so the gas folds and streams instead of blotching.
      const [wx, wy] = [x + fbm(m, x, y, 3) * 1.2, y + fbm(m, x + 7, y + 3, 3) * 1.2];
      const base = Math.max(0, Math.min(1, fbm(n, wx, wy, 5) * 1.3 + 0.5));
      const [dx, dy] = [(u - ox) * 2, v - oy];
      const r = Math.hypot(dx, dy);
      let s: number;
      if (shape === 'ring') s = Math.exp(-Math.pow((r - 0.28) / 0.07, 2)) * 1.3 + Math.exp(-r * 9) * 0.5;
      else if (shape === 'pillars') {
        const p = Math.pow(Math.max(0, Math.cos((u * cols + fbm(k, u * 3, v, 2) * 0.4) * Math.PI)), 6);
        s = p * Math.pow(v, 0.9) * 2.4 + Math.max(0, v - 0.7) * 2.5;
      } else if (shape === 'veil') s = Math.pow(1 - Math.abs(fbm(k, wx * 0.8, wy * 1.6, 4)), 8) * 1.4;
      else s = Math.exp(-r * r * 4.5) * 1.3;
      const lane = Math.pow(Math.max(0, 1 - Math.abs(fbm(k, x * 1.4 + 11, y * 1.4, 4)) * 3), 2);
      d[j * gw + i] = Math.max(0, Math.min(1, base * s - lane * 0.35));
    }
  const image = document.createElement('canvas');
  [image.width, image.height] = [gw, gh];
  const c2 = image.getContext('2d');
  if (c2) {
    const img = c2.createImageData(gw, gh);
    const [r, g, b] = rgb('ink');
    d.forEach((v, i) => {
      img.data.set([r, g, b, Math.round(Math.pow(v, 1.4) * 115)], i * 4);
    });
    c2.putImageData(img, 0, 0);
  }
  const at = (u: number, v: number): number =>
    d[Math.min(gh - 1, Math.max(0, Math.floor(v * gh))) * gw + Math.min(gw - 1, Math.max(0, Math.floor(u * gw)))] ?? 0;
  return { shape, image, at };
}

/** Draw the gas over the frame twice, at two depths, so it parallaxes as `shift` moves (it
 *  takes a depth and gives a sideways offset in pixels), then the young stars over it with
 *  their diffraction spikes, the first in the signal. */
export function drawGas(
  ctx: CanvasRenderingContext2D,
  g: Gas,
  young: readonly [number, number][],
  w: number,
  h: number,
  shift: (depth: number) => number,
  t: number,
): void {
  ctx.imageSmoothingEnabled = true;
  for (const [k, s, a] of [
    [0.6, 1.08, 0.35],
    [1, 1.02, 0.9],
  ] as const) {
    ctx.globalAlpha = a;
    ctx.drawImage(g.image, (w - w * s) / 2 + shift(k), (h - h * s) / 2, w * s, h * s);
  }
  ctx.globalAlpha = 1;
  young.forEach(([u, v], i) => {
    const [x, y] = [u * w + shift(1), v * h];
    const hot = i === 0;
    const b = hot ? 1 : 0.4 + 0.5 * ((i * 0.37) % 1);
    const spike = (hot ? 9 : 3 + (i % 4) * 2) * (0.85 + 0.15 * Math.sin(t * 1.5 + i));
    ctx.strokeStyle = hot ? ink.signal(0.45) : ink.line(b * 0.6);
    ctx.beginPath();
    ctx.moveTo(x - spike, y);
    ctx.lineTo(x + spike, y);
    ctx.moveTo(x, y - spike);
    ctx.lineTo(x, y + spike);
    ctx.stroke();
    if (hot) beacon(ctx, x, y, 8);
    else {
      ctx.fillStyle = ink.line(b);
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
  });
}
