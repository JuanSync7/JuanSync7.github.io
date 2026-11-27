import type { Pt } from './brush';
import { sample, swell, type Ink } from './inkpath';
import type { Noise2 } from './noise';
import { between, type Rng } from './rng';

/** Shading and atmosphere for ink mountains. The light comes from the upper left, so a face
 *  that falls away to the right is in shade. Shade is built the way a brush builds it: many
 *  short, broken strokes laid along the fall line of the slope, close together just under the
 *  ridge and thinning out row by row toward the foot, so the face reads rough and dark rather
 *  than striped. A lit face gets a few strokes just under its ridge. A saddle in the ridge is a
 *  gully, a concave the light cannot reach, and gets the same short strokes packed into a
 *  narrowing V. Far ranges get it all at half strength, plus the minute marks of distant trees
 *  along their ridges, and fog that cuts across them. */

/** One short stroke from (x, y) down a fall line leaning `lean`, `len` long, bowed a little. */
function dash(k: Ink, x: number, y: number, lean: number, len: number, bow: number): void {
  const l = Math.hypot(lean, 1);
  const [dx, dy] = [(lean / l) * len, len / l];
  k.line([
    [x, y],
    [x + dx * 0.5 - dy * bow, y + dy * 0.5 + dx * bow],
    [x + dx, y + dy],
  ]);
}

/** Shading for one mountain whose ridge is `top` and foot is `base`. `near` is a nearer range,
 *  with its full rows of strokes and moss dots. */
export function hatch(
  k: Ink,
  noise: Noise2,
  top: readonly Pt[],
  base: number,
  seed: number,
  u: number,
  near: boolean,
): void {
  const scale = near ? 1 : 0.55;
  for (let j = 1; j < top.length - 1; j++) {
    const [a, b, p] = [top[j - 1], top[j + 1], top[j]];
    if (!a || !b || !p) continue;
    const depth = base - p[1];
    if (depth < 0.03 * u) continue;
    const fall = (b[1] - a[1]) / Math.max(1e-6, b[0] - a[0]);
    const shade = fall > 0.05;
    if (!shade && j % 3) continue;
    const lean = shade ? Math.min(fall, 2) * 0.6 : -0.3;
    const rows = shade ? (near ? 9 : 5) : near ? 2 : 1;
    for (let r = 0; r < rows; r++) {
      const n = noise(j * 0.7 + r * 3.1, seed);
      // Each row down the face keeps fewer strokes, so the shade fades toward the foot.
      if (n < -0.55 + r * (shade ? 0.1 : 0.3)) continue;
      const reach = ((r + 0.2 + 0.5 * Math.abs(noise(j * 1.3, seed + r))) / rows) * (shade ? 0.6 : 0.15);
      const len = (0.01 + 0.018 * Math.abs(n)) * u * scale * (1 - r * 0.06);
      dash(k, p[0] + lean * reach * depth, p[1] + 2 + reach * depth, lean, len, n * 0.15);
    }
    if (near && j % 10 === 1 && noise(j, seed + 9) > 0.1) k.dab(p[0], p[1] + 0.006 * u, 0.0045 * u, 0.0028 * u, j);
  }
  for (let j = 4; j < top.length - 4; j++) {
    const [p, l4, r4, l1, r1] = [top[j], top[j - 4], top[j + 4], top[j - 1], top[j + 1]];
    if (!p || !l4 || !r4 || !l1 || !r1) continue;
    const saddle = p[1] > l4[1] + 0.01 * u && p[1] > r4[1] + 0.01 * u && p[1] >= l1[1] && p[1] >= r1[1];
    if (!saddle) continue;
    const depth = (base - p[1]) * (0.35 + 0.3 * Math.abs(noise(j, seed + 1))) * scale;
    for (let r = 0; r < 10; r++) {
      const v = r / 10;
      const width = 0.03 * u * (1 - v * 0.8);
      for (let c = 0; c < 4; c++) {
        const n = noise(r * 1.7 + c * 4.3, seed + 2);
        if (n < -0.2 + v * 0.5) continue;
        dash(k, p[0] + n * width, p[1] + 2 + depth * v, n * 0.3, (0.01 + 0.01 * Math.abs(n)) * u * scale, n * 0.2);
      }
    }
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
