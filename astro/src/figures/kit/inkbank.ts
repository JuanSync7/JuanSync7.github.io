import type { Pt } from './brush';
import { sample, swell, type Ink } from './inkpath';
import type { Noise2 } from './noise';
import { between, type Rng } from './rng';

/** The near riverbank in ink: stones set along the water's edge with grass between them, and
 *  lily pads, now and then with a lotus, floating on the water in front. */

/** The bank's height at x, read off its edge. */
function heightAt(edge: readonly Pt[], x: number): number {
  for (let i = 1; i < edge.length; i++) {
    const a = edge[i - 1];
    const b = edge[i];
    if (a && b && x <= b[0]) return a[1] + ((b[1] - a[1]) * (x - a[0])) / Math.max(1e-6, b[0] - a[0]);
  }
  return edge[edge.length - 1]?.[1] ?? 0;
}

/** Stones along the edge, each a lumpy outline with one crease, set half into the bank, with
 *  tufts of grass between some of them. */
export function bankEdge(k: Ink, noise: Noise2, rng: Rng, edge: readonly Pt[], u: number): void {
  const first = edge[0]?.[0] ?? 0;
  const last = edge[edge.length - 1]?.[0] ?? 0;
  for (let x = first + rng() * 0.05 * u; x < last - 0.02 * u; ) {
    // Stones of every size, some flat and wide, some tall, leaning either way, now and then
    // two set together; never a row of the same bump.
    const big = rng() < 0.2;
    const w = (big ? between(rng, 0.06, 0.1) : between(rng, 0.015, 0.055)) * u;
    const y = heightAt(edge, x) + between(rng, 0, 0.008) * u;
    const tall = between(rng, 0.2, big ? 0.55 : 0.75) * w;
    const crest = between(rng, 0.25, 0.75);
    const seed = rng() * 40;
    const rim = sample(
      9,
      (v): Pt => [
        x + (v - 0.5) * w,
        y -
          Math.pow(Math.sin(v * Math.PI), 0.6) *
            (1 - Math.abs(v - crest) * 0.8) *
            tall *
            (0.85 + 0.3 * noise(v * 3, seed)),
      ],
    );
    k.cover([...rim, [x + w / 2, y + 0.006 * u], [x - w / 2, y + 0.006 * u]]);
    k.stroke(rim, (big ? 0.008 : 0.005) * u, swell, 0.4, seed);
    k.line(rim.slice(3, 7).map((p): Pt => [p[0] + 0.15 * w, p[1] + tall * 0.45]));
    if (rng() < 0.55) {
      const gx = x + w * between(rng, 0.55, 0.9);
      for (let b = 0; b < 5; b++) {
        const lean = between(rng, -0.6, 0.6);
        const len = between(rng, 0.008, 0.02) * u;
        k.line([
          [gx + b * 0.002 * u, y],
          [gx + b * 0.002 * u + lean * len * 0.5, y - len],
        ]);
      }
    }
    x += rng() < 0.25 ? w * between(rng, 0.4, 0.7) : w * between(rng, 1, 3.5) + between(rng, 0, 0.06) * u;
  }
}

/** A cluster of lily pads on the water around (x, y), each an oval with its notch cut, and
 *  sometimes a lotus bud on its stem. */
export function lilies(k: Ink, rng: Rng, x: number, y: number, u: number): void {
  for (let n = 3 + Math.floor(rng() * 5); n > 0; n--) {
    const px = x + between(rng, -0.06, 0.06) * u;
    const py = y - between(rng, 0.004, 0.03) * u;
    const rx = between(rng, 0.01, 0.02) * u;
    const notch = rng() * Math.PI * 2;
    const pad = sample(14, (v): Pt => {
      const a = notch + 0.35 + v * (Math.PI * 2 - 0.7);
      return [px + Math.cos(a) * rx, py + Math.sin(a) * rx * 0.32];
    });
    k.cover([[px, py], ...pad]);
    k.line([[px, py], ...pad, [px, py]]);
    if (rng() < 0.3) {
      k.line([
        [px, py],
        [px + rx * 0.2, py - 0.03 * u],
      ]);
      const bx = px + rx * 0.2;
      const by = py - 0.03 * u;
      for (const sd of [-1, 1])
        k.stroke(
          [
            [bx, by + 0.004 * u],
            [bx + sd * 0.006 * u, by - 0.004 * u],
            [bx, by - 0.014 * u],
          ],
          0.004 * u,
        );
    }
  }
}

/** Grass on open ground between the bank and the bottom of the frame: small tufts, scattered. */
export function grass(k: Ink, rng: Rng, x0: number, x1: number, y0: number, y1: number, u: number): void {
  for (let n = 4 + Math.floor(rng() * 8); n > 0; n--) {
    const x = between(rng, x0, x1);
    const y = between(rng, y0, y1);
    for (let b = 0; b < 3 + Math.floor(rng() * 3); b++) {
      const len = between(rng, 0.006, 0.014) * u;
      const lean = between(rng, -0.5, 0.5);
      k.line([
        [x + b * 0.0025 * u, y],
        [x + b * 0.0025 * u + lean * len, y - len],
      ]);
    }
  }
}
