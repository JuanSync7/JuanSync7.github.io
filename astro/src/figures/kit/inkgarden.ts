import type { Pt } from './brush';
import { reeds } from './inkflora';
import { root, sample, type Ink } from './inkpath';
import type { Noise2 } from './noise';
import { between, type Rng } from './rng';

/** The near ground of an ink landscape: rocks laid with a lumpy outline and dry cun strokes,
 *  a bonsai in its shallow pot, and a pond ringed by its bank with reeds at one end. */

/** A rock `s` wide sitting on y. Returns its height at the middle, for something to stand on. */
export function rock(k: Ink, noise: Noise2, rng: Rng, x: number, y: number, s: number): number {
  const seed = between(rng, 0, 50);
  const tall = between(rng, 0.5, 0.9) * s;
  const crest = between(rng, 0.25, 0.75);
  // A lopsided crest, not a dome: the high point sits off centre and the outline is lumpy.
  const rim = sample(16, (u): Pt => {
    const hump = Math.pow(Math.sin(u * Math.PI), 0.7) * (1 - Math.abs(u - crest) * 0.9);
    return [x + (u - 0.5) * s, y - tall * Math.max(0, hump) * (0.8 + 0.35 * noise(u * 4, seed))];
  });
  k.cover([...rim, [x + 0.5 * s, y + 0.02 * s], [x - 0.5 * s, y + 0.02 * s]]);
  k.stroke(rim, 0.05 * s, undefined, 0.4, seed);
  const fold = rim.slice(4, 12).map((p): Pt => [p[0] + 0.06 * s, p[1] + (y - p[1]) * 0.45]);
  k.stroke(fold, 0.025 * s, undefined, 0.5, seed + 1);
  for (let j = 2; j < 15; j += 2) {
    const p = rim[j];
    if (!p) continue;
    const len = (y - p[1]) * (0.3 + 0.4 * Math.abs(noise(j, seed)));
    k.line([p, [p[0] + noise(j, seed + 2) * 0.06 * s, p[1] + len]]);
  }
  for (let d = 0; d < 3; d++) {
    const p = rim[3 + d * 4];
    if (p) k.dab(p[0], p[1] + 0.03 * s, 0.03 * s, 0.018 * s);
  }
  // Where the middle of the rock is, for a pot set on it.
  return y - (rim[8]?.[1] ?? y);
}

/** A bonsai `s` tall in a shallow pot standing on y: an S-bent trunk and cloud pads. */
export function bonsai(k: Ink, rng: Rng, x: number, y: number, s: number): void {
  const rimY = y - 0.16 * s;
  const pot: Pt[] = [
    [x - 0.42 * s, rimY],
    [x + 0.42 * s, rimY],
    [x + 0.34 * s, y - 0.03 * s],
    [x - 0.34 * s, y - 0.03 * s],
  ];
  k.cover(pot);
  k.line([...pot, pot[0] ?? [x, y]]);
  k.line([
    [x - 0.44 * s, rimY - 0.02 * s],
    [x + 0.44 * s, rimY - 0.02 * s],
  ]);
  for (const f of [-0.26, 0.26])
    k.line([
      [x + f * s, y - 0.03 * s],
      [x + f * s, y],
    ]);
  const dir = rng() < 0.5 ? -1 : 1;
  const stem = sample(12, (u): Pt => [x + dir * (Math.sin(u * 5) * 0.12 + u * 0.18) * s, rimY - u * 0.78 * s]);
  k.stroke(stem, 0.13 * s, root, 0.3);
  const pads: [number, number][] = [
    [5, -1],
    [8, 1],
    [12, 0],
  ];
  for (const [at, side] of pads) {
    const p = stem[at];
    if (!p) continue;
    const c: Pt = [p[0] + side * dir * 0.28 * s, p[1] - 0.06 * s];
    k.stroke([p, c], 0.05 * s, root, 0.2);
    k.coverOval(c[0], c[1], 0.24 * s, 0.075 * s);
    for (let d = 0; d < 20; d++) {
      const v = between(rng, -1, 1);
      k.dab(c[0] + v * 0.21 * s, c[1] - (1 - v * v) * between(rng, 0, 0.07) * s, 0.03 * s, 0.014 * s, rng());
    }
    k.stroke(
      sample(6, (u) => [c[0] + (u - 0.5) * 0.46 * s, c[1] + 0.02 * s + Math.sin(u * Math.PI) * 0.01 * s]),
      0.014 * s,
    );
  }
}

/** A pond `s` across, its middle at (x, y): a bank broken in two strokes, ripples, lily
 *  pads and reeds at one end. */
export function pond(k: Ink, rng: Rng, x: number, y: number, s: number): void {
  const rx = s / 2;
  const ry = s * 0.12;
  k.coverOval(x, y, rx, ry);
  const arc = (a0: number, a1: number): Pt[] =>
    sample(14, (u) => [x + Math.cos(a0 + (a1 - a0) * u) * rx, y + Math.sin(a0 + (a1 - a0) * u) * ry]);
  k.stroke(arc(0.15, Math.PI - 0.1), 0.03 * s, undefined, 0.3);
  k.stroke(arc(Math.PI + 0.25, Math.PI * 2 - 0.3), 0.016 * s, undefined, 0.3);
  for (let j = 0; j < 4; j++) {
    const py = y + between(rng, -0.5, 0.5) * ry;
    const px = x + between(rng, -0.45, 0.25) * rx;
    k.line([
      [px, py],
      [px + between(rng, 0.12, 0.3) * s, py],
    ]);
  }
  for (let j = 0; j < 3; j++)
    k.dab(x + between(rng, -0.4, 0.3) * rx, y + between(rng, -0.3, 0.4) * ry, 0.04 * s, 0.012 * s);
  const end = rng() < 0.5 ? -1 : 1;
  reeds(k, rng, x + end * rx * 0.85, y + ry * 0.2, s * 0.35);
}
