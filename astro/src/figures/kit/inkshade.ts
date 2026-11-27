import type { Pt } from './brush';
import { sample, swell, type Ink } from './inkpath';
import type { Noise2 } from './noise';
import { between, type Rng } from './rng';

/** Shading and atmosphere for ink mountains. The light comes from the upper left, so a face
 *  that falls away to the right is in shade: there the hemp-fibre strokes come in bundles of
 *  two or three, long and close, while a lit face gets a single short stroke now and then.
 *  A saddle in the ridge is a gully, a concave the light cannot reach, drawn as a crease of
 *  lines that gather as they go down. Far ranges get the same at half the length, plus the
 *  minute marks of distant trees along their ridges, and fog that cuts across them. */

/** Hatching for one mountain whose ridge is `top` and foot is `base`. `near` is the nearer
 *  range, with its full strokes and moss dots. */
export function hatch(
  k: Ink,
  noise: Noise2,
  top: readonly Pt[],
  base: number,
  seed: number,
  u: number,
  near: boolean,
): void {
  const scale = near ? 1 : 0.5;
  for (let j = 1; j < top.length - 1; j += near ? 2 : 3) {
    const a = top[j - 1];
    const b = top[j + 1];
    const p = top[j];
    if (!a || !b || !p) continue;
    const fall = (b[1] - a[1]) / Math.max(1e-6, b[0] - a[0]);
    const shade = fall > 0.05;
    const n = noise(j * 0.9 + seed, 3.3);
    if (shade ? n < -0.45 : j % (near ? 6 : 9) || n < 0) continue;
    const depth = base - p[1];
    const rough = Math.abs(noise(p[0] * 0.05, 7.7));
    const len = depth * (shade ? 0.25 + 0.4 * rough : 0.08 + 0.12 * rough) * scale;
    const lean = shade ? Math.min(fall, 2) * 0.22 : -0.15;
    const sway = noise(p[0] * 0.03, 2.2) * 0.2;
    const strokes = shade ? (near ? 3 : 2) : 1;
    for (let s = 0; s < strokes; s++) {
      const [ox, oy] = [s * 0.004 * u, s * 0.004 * u * Math.min(fall, 2)];
      const l = len * (1 - s * 0.25);
      k.line(sample(4, (v): Pt => [p[0] + ox + (lean + sway * v) * l * v, p[1] + 2 + oy + l * v]));
    }
    if (near && j % 10 === 1 && n > 0.1) k.dab(p[0], p[1] + 0.006 * u, 0.0045 * u, 0.0028 * u, n);
  }
  for (let j = 4; j < top.length - 4; j++) {
    const [p, l4, r4, l1, r1] = [top[j], top[j - 4], top[j + 4], top[j - 1], top[j + 1]];
    if (!p || !l4 || !r4 || !l1 || !r1) continue;
    const saddle = p[1] > l4[1] + 0.01 * u && p[1] > r4[1] + 0.01 * u && p[1] >= l1[1] && p[1] >= r1[1];
    if (!saddle) continue;
    const depth = (base - p[1]) * (0.35 + 0.3 * Math.abs(noise(j, seed + 1))) * scale;
    for (let c = -2; c <= 2; c++)
      k.line(
        sample(
          6,
          (v): Pt => [
            p[0] + c * 0.008 * u * (1 - v * 0.7) + Math.sin(v * 3 + c) * 0.004 * u,
            p[1] + 2 + depth * v * (1 - Math.abs(c) * 0.12),
          ],
        ),
      );
  }
}

/** Distant trees along a far ridge: a tick and a dot each, too small to be more. */
export function distant(k: Ink, noise: Noise2, top: readonly Pt[], seed: number, u: number): void {
  top.forEach((p, j) => {
    if (j % 2 || noise(j * 0.4, seed) < 0.05) return;
    const tall = (0.004 + 0.006 * Math.abs(noise(j * 1.7, seed + 3))) * u;
    k.line([
      [p[0], p[1] + 1],
      [p[0], p[1] - tall],
    ]);
    k.dab(p[0], p[1] - tall, 0.0028 * u, 0.0022 * u);
  });
}

/** Fog lying across the far ranges between heights y0 and y1: long wisps that hide what is
 *  behind them, each with a faint line along part of its upper edge. */
export function fog(k: Ink, rng: Rng, x0: number, span: number, y0: number, y1: number, u: number): void {
  for (let n = 1 + Math.floor(rng() * 3); n > 0; n--) {
    const y = between(rng, y0, y1);
    const len = between(rng, 0.3, 0.7) * u;
    const xs = x0 + between(rng, -0.2, 0.8) * span;
    const th = between(rng, 0.012, 0.03) * u;
    const top = sample(12, (v): Pt => [xs + v * len, y - th * swell(v)]);
    const bottom = sample(12, (v): Pt => [xs + v * len, y + th * 0.5 * swell(v)]);
    k.cover([...top, ...bottom.reverse()]);
    k.line(top.slice(2, 8));
  }
}
