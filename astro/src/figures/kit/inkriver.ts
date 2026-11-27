import type { Pt } from './brush';
import { Ink, root, sample, type Mark } from './inkpath';
import { between, type Rng } from './rng';

/** A river in an ink landscape, from a saddle high between two summits down to the lake: a
 *  narrow stream winding down the gully, a waterfall where it drops off a ledge, then a river
 *  widening and opening at its mouth. Its banks are brush strokes, the paper between them is
 *  water, and its current is dashed hairlines that run downstream (the mark's `flow`). */

/** `(x0, y0)` is where it rises and `y1` the water it runs into; `u` is the frame's height. */
export function river(k: Ink, rng: Rng, x0: number, y0: number, y1: number, u: number): Mark {
  const fall = between(rng, 0.25, 0.45);
  const drop = between(rng, 0.06, 0.12);
  const drift = between(rng, 0.08, 0.22) * u * (rng() < 0.5 ? -1 : 1);
  const swing = between(rng, 0.03, 0.06) * u;
  const phase = between(rng, 0, 6);
  // v runs 0..1 from source to mouth; over [fall, fall + drop] the water falls straight down.
  const at = (v: number): Pt => {
    const run = v < fall ? v : v < fall + drop ? fall : v - drop;
    const x = x0 + drift * run + Math.sin(run * 7 + phase) * swing * Math.sqrt(run);
    return [x, y0 + (y1 - y0) * v];
  };
  const half = (v: number): number => (0.003 + 0.02 * v * v + (v > 0.88 ? (v - 0.88) * 0.3 : 0)) * u;
  const mid = sample(40, at);
  const side = (sd: number): Pt[] => mid.map((p, i): Pt => [p[0] + sd * half(i / 40), p[1]]);
  const [left, right] = [side(-1), side(1)];
  k.cover([...left, ...[...right].reverse()]);
  k.stroke(left, 0.006 * u, root, 0.35);
  k.stroke(right, 0.005 * u, root, 0.35, 4);
  // The ledge the fall leaves, and a splash where it lands.
  const lip = at(fall);
  const foot = at(fall + drop);
  k.stroke(
    [
      [lip[0] - half(fall) * 3, lip[1]],
      [lip[0] + half(fall) * 3, lip[1] + 0.002 * u],
    ],
    0.005 * u,
  );
  for (let s = -2; s <= 2; s++)
    k.line([
      [foot[0] + s * half(fall) * 0.9, foot[1] - 0.004 * u],
      [foot[0] + s * half(fall) * 2.2, foot[1] + 0.004 * u],
    ]);
  // The current: a few lines down the river, each keeping its own share of the width.
  for (const share of [-0.3, 0.3]) k.line(sample(40, (v) => [at(v)[0] + share * half(v), at(v)[1]]));
  // At the mouth the river spreads into the lake in widening ripples.
  const mouth = mid[mid.length - 1] ?? [x0, y1];
  for (let r = 1; r <= 3; r++) {
    const w = half(1) * (1 + r * 0.8);
    k.line([
      [mouth[0] - w, y1 + r * 0.006 * u],
      [mouth[0] + w, y1 + r * 0.006 * u],
    ]);
  }
  const m = k.done('river', 0.55, x0, (y0 + y1) / 2, Math.max(0.04 * u, (y1 - y0) / 2));
  m.flow = true;
  return m;
}
