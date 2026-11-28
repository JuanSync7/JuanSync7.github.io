import type { Pt } from './brush';
import { root, sample, type Ink } from './inkpath';
import { between, type Rng } from './rng';

/** Birds in an ink landscape: red-crowned cranes gliding in a loose skein, with long necks
 *  stretched forward, legs trailing and black tips to their wings; small birds far off, each
 *  just two strokes; and a crane standing in the shallows on stilt legs. Here `dir` is the way
 *  a bird faces (1 right, -1 left). */

/** A crane in flight, `s` from wingtip to body, its wings `up` or down in the beat. */
export function flyingCrane(k: Ink, x: number, y: number, s: number, dir: number, up: boolean): void {
  const head: Pt = [x + dir * 0.42 * s, y - 0.035 * s];
  k.stroke(
    [
      [x - dir * 0.14 * s, y + 0.01 * s],
      [x + dir * 0.1 * s, y - 0.01 * s],
    ],
    0.08 * s,
    undefined,
    0.1,
  );
  k.stroke([[x + dir * 0.08 * s, y - 0.01 * s], head], 0.022 * s, root, 0.1);
  k.dab(head[0], head[1], 0.03 * s, 0.018 * s);
  k.line([head, [head[0] + dir * 0.08 * s, head[1] + 0.008 * s]]);
  for (const sd of [0, 0.02])
    k.line([
      [x - dir * 0.12 * s, y + 0.01 * s],
      [x - dir * 0.48 * s, y + (0.03 + sd) * s],
    ]);
  const lift = up ? -1 : 0.55;
  const near = sample(6, (v): Pt => [x - dir * 0.2 * s * v * v, y + lift * 0.42 * s * Math.pow(v, 0.8)]);
  const far = sample(5, (v): Pt => [x + dir * 0.1 * s * v, y + lift * 0.26 * s * Math.pow(v, 0.8)]);
  k.stroke(near, 0.1 * s, root, 0.25);
  k.stroke(far, 0.07 * s, root, 0.25);
  for (const wing of [near, far]) {
    const tip = wing[wing.length - 1];
    if (tip) k.dab(tip[0], tip[1], 0.035 * s, 0.02 * s, lift);
  }
}

/** A small bird far off: two arcs meeting at the body. */
export function smallBird(k: Ink, x: number, y: number, s: number, up: boolean): void {
  const lift = up ? -0.25 : 0.1;
  for (const sd of [-1, 1])
    k.stroke(
      [
        [x + sd * 0.5 * s, y + lift * s],
        [x + sd * 0.2 * s, y - 0.12 * s],
        [x, y],
      ],
      0.1 * s,
      undefined,
      0.1,
    );
}

/** A crane standing in the shallows with its feet at (x, y), `s` tall: stilt legs, a full
 *  body with its dark bustle of tail feathers, an S of a neck and a long bill. */
export function standingCrane(k: Ink, rng: Rng, x: number, y: number, s: number, dir: number): void {
  const bend = between(rng, -0.05, 0.05) * s;
  k.line([
    [x, y],
    [x + bend, y - 0.25 * s],
    [x, y - 0.46 * s],
  ]);
  k.line([
    [x + dir * 0.05 * s, y],
    [x + dir * 0.05 * s, y - 0.46 * s],
  ]);
  const back: Pt[] = sample(8, (v): Pt => [x + dir * (-0.24 + 0.4 * v) * s, y - (0.5 + 0.12 * Math.sin(v * 2.6)) * s]);
  k.coverOval(x + dir * -0.04 * s, y - 0.56 * s, 0.22 * s, 0.09 * s);
  k.stroke(back, 0.18 * s, undefined, 0.2);
  for (let d = 0; d < 4; d++)
    k.dab(x - dir * (0.22 + d * 0.03) * s, y - (0.52 - d * 0.02) * s, 0.06 * s, 0.03 * s, dir * 0.4);
  const neck = sample(
    8,
    (v): Pt => [x + dir * (0.14 + 0.08 * Math.sin(v * Math.PI * 1.4)) * s, y - (0.6 + 0.38 * v) * s],
  );
  k.stroke(neck, 0.05 * s, root, 0.15);
  const head = neck[neck.length - 1] ?? [x, y - s];
  k.dab(head[0], head[1], 0.04 * s, 0.025 * s);
  k.line([head, [head[0] + dir * 0.14 * s, head[1] + 0.02 * s]]);
  for (const r of [0.08, 0.14])
    k.line([
      [x - r * s, y + 0.01 * s],
      [x + r * s, y + 0.01 * s],
    ]);
}
