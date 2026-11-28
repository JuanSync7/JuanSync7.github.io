import type { Pt } from './brush';
import { root, sample, type Ink } from './inkpath';
import { between, type Rng } from './rng';

/** Water in ink: mostly bare paper, said with a few ripple lines that lengthen as they come
 *  near; a sampan with its crew; a fish under the surface. */

export type BoatKind = 'fisherman' | 'boatman' | 'sampan';

/** Ripple lines across [x0, x1] between two heights, longer toward the viewer. */
export function ripples(k: Ink, rng: Rng, x0: number, x1: number, y0: number, y1: number, n: number, u: number): void {
  for (let i = 0; i < n; i++) {
    const d = Math.pow(rng(), 0.7);
    const y = y0 + (y1 - y0) * d;
    const x = between(rng, x0, x1);
    const len = (0.015 + 0.06 * d) * u * between(rng, 0.6, 1.4);
    k.line([
      [x, y],
      [x + len * 0.5, y - 0.002 * u],
      [x + len, y],
    ]);
  }
}

/** A seated figure in a conical hat; returns where the hands are. */
function figure(k: Ink, x: number, y: number, s: number, tall: number): Pt {
  k.stroke(
    [
      [x, y],
      [x + 0.015 * s, y - tall * s],
    ],
    0.075 * s,
    undefined,
    0.15,
  );
  const hy = y - tall * s - 0.01 * s;
  const hat: Pt[] = [
    [x - 0.075 * s, hy + 0.012 * s],
    [x + 0.015 * s, hy - 0.07 * s],
    [x + 0.105 * s, hy + 0.012 * s],
  ];
  k.cover(hat);
  k.stroke(hat, 0.03 * s, undefined, 0.1);
  return [x + 0.05 * s, y - tall * s * 0.55];
}

/** A sampan: a crescent hull, and a fisherman with his rod, a boatman with his pole, or a
 *  hooded cabin. `s` is the hull's length, `(x, y)` its middle on the water. */
export function boat(k: Ink, kind: BoatKind, x: number, y: number, s: number): void {
  const ends = (u: number): number => Math.pow(Math.abs(2 * u - 1), 3);
  const top = sample(14, (u) => [x + (u - 0.5) * s, y - 0.05 * s - 0.09 * s * ends(u)]);
  const keel = sample(14, (u) => [x + (u - 0.5) * s * 0.92, y + 0.03 * s * Math.sin(u * Math.PI) - 0.07 * s * ends(u)]);
  k.cover([...top, ...[...keel].reverse()]);
  k.stroke(top, 0.04 * s, undefined, 0.2);
  k.line(keel);
  if (kind === 'sampan') {
    const hood = sample(10, (u) => [
      x - 0.05 * s + (u - 0.5) * 0.36 * s,
      y - 0.06 * s - Math.sin(u * Math.PI) * 0.17 * s,
    ]);
    k.cover(hood);
    k.stroke(hood, 0.035 * s, undefined, 0.2);
    for (let j = 1; j < 4; j++) {
      const p = hood[j * 2 + 1];
      if (p) k.line([p, [p[0], y - 0.06 * s]]);
    }
    figure(k, x + 0.3 * s, y - 0.06 * s, s, 0.12);
  } else if (kind === 'fisherman') {
    const hand = figure(k, x - 0.12 * s, y - 0.06 * s, s, 0.13);
    const tip: Pt = [x + 0.85 * s, y - 0.4 * s];
    k.line(sample(8, (u) => [hand[0] + (tip[0] - hand[0]) * u, hand[1] + (tip[1] - hand[1]) * Math.pow(u, 0.6)]));
    k.line([tip, [tip[0] + 0.01 * s, y + 0.03 * s]]);
    k.line([
      [tip[0] - 0.04 * s, y + 0.035 * s],
      [tip[0] + 0.06 * s, y + 0.035 * s],
    ]);
  } else {
    const hand = figure(k, x + 0.3 * s, y - 0.06 * s, s, 0.24);
    k.line([
      [hand[0] - 0.12 * s, y - 0.42 * s],
      [hand[0] + 0.22 * s, y + 0.06 * s],
    ]);
  }
  k.line([
    [x - 0.3 * s, y + 0.06 * s],
    [x + 0.1 * s, y + 0.06 * s],
  ]);
  k.line([
    [x - 0.1 * s, y + 0.1 * s],
    [x + 0.3 * s, y + 0.1 * s],
  ]);
}

/** A fish just under the surface, `s` long, heading `dir` (1 right, -1 left): a body that
 *  swells behind the head, a forked tail and two small fins. */
export function fish(k: Ink, x: number, y: number, s: number, dir: number, bend: number): void {
  const body = sample(8, (v): Pt => [x + dir * (v - 0.5) * s, y + Math.sin(v * Math.PI) * bend * s]);
  k.stroke(body, 0.26 * s, (t) => Math.pow(Math.sin(Math.pow(t, 0.75) * Math.PI), 0.8), 0.1);
  const tail = body[0] ?? [x, y];
  for (const sd of [-1, 1])
    k.stroke(
      [
        [tail[0], tail[1]],
        [tail[0] - dir * 0.2 * s, tail[1] + sd * 0.13 * s],
      ],
      0.07 * s,
      root,
      0.1,
    );
  for (const sd of [-1, 1]) k.dab(x + dir * 0.12 * s, y + sd * 0.12 * s, 0.07 * s, 0.025 * s, sd * dir * 0.6);
}
