import type { Pt } from './brush';
import { sample, swell, type Ink } from './inkpath';
import type { Noise2 } from './noise';
import { between, type Rng } from './rng';

/** Shading and atmosphere for ink mountains. The light comes from the upper left, so a face
 *  that falls away to the right is in shade, and its ridge is drawn again in two or three
 *  broken lines just under it, running with it, which reads as a darker edge on the side away
 *  from the light. The faces themselves stay clear: Juan compared this with strokes down the
 *  slopes and with no shading at all, and chose it (27 November 2026). Far ranges get it at
 *  half strength, plus the minute marks of distant trees along their ridges, and fog that
 *  cuts across them. */

/** Shading that hugs the ridge: broken lines a little under the ridge line and running with
 *  it, two or three deep on a face in shade, one faint row on a lit face. */
export function hug(k: Ink, noise: Noise2, top: readonly Pt[], seed: number, u: number, near: boolean): void {
  const rows = near ? 3 : 2;
  for (let r = 0; r < rows; r++) {
    const off = (0.006 + r * 0.007) * u * (near ? 1 : 0.6);
    let seg: Pt[] = [];
    const flush = (): void => {
      if (seg.length > 2) k.line(seg);
      seg = [];
    };
    for (let j = 1; j < top.length - 1; j++) {
      const [a, b, p] = [top[j - 1], top[j + 1], top[j]];
      if (!a || !b || !p) continue;
      const shade = b[1] - a[1] > 0;
      const keep = noise(j * 0.45 + r * 2.3, seed) > (shade ? -0.25 + r * 0.2 : 0.2 + r);
      if (!keep) {
        flush();
        continue;
      }
      const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
      const l = Math.hypot(dx, dy) || 1;
      seg.push([p[0] - (dy / l) * off, p[1] + (dx / l) * off]);
    }
    flush();
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
