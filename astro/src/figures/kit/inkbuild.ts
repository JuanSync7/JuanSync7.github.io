import type { Pt } from './brush';
import { rect, root, sample, type Ink } from './inkpath';
import type { Rng } from './rng';

/** Old Chinese temples in ink: a hall on a stone terrace and a pagoda. Both are built from
 *  the same parts as the real thing: a raised platform, columns, and roofs whose eaves sweep
 *  up at the corners. Sizes are in `s`, the building's width in pixels; `y` is the ground. */

/** An eave seen from the front: flat in the middle, swept up at both corners. */
function eave(x: number, y: number, half: number, lift: number): Pt[] {
  return sample(18, (u) => {
    const v = u * 2 - 1;
    return [x + v * half, y - lift * Math.pow(Math.abs(v), 5)];
  });
}

/** One roof: a swept eave, a shorter ridge above it, tiles between them. */
function roof(k: Ink, x: number, y: number, half: number, rise: number, s: number): void {
  const low = eave(x, y, half, 0.08 * s);
  const top = eave(x, y - rise, half * 0.55, 0.035 * s);
  k.cover([...low, ...[...top].reverse()]);
  k.stroke(low, 0.045 * s, undefined, 0.2);
  k.stroke(top, 0.03 * s, undefined, 0.2);
  for (const end of [top[0], top[top.length - 1]]) if (end) k.dab(end[0], end[1] - 0.012 * s, 0.018 * s, 0.01 * s);
  for (let j = 1; j < 6; j++) {
    const a = low[Math.round((j / 6) * 18)];
    const b = top[Math.round((j / 6) * 18)];
    if (a && b) k.line([a, b]);
  }
}

/** The front wall of a hall between its columns at ±half: a door in the middle bay, lattice
 *  windows in the side bays. */
function bays(k: Ink, x: number, y: number, half: number, tall: number): void {
  const door = half / 3;
  k.line([
    [x - door * 0.6, y],
    [x - door * 0.6, y - tall * 0.72],
    [x + door * 0.6, y - tall * 0.72],
    [x + door * 0.6, y],
  ]);
  for (const side of [-1, 1]) {
    const cx = x + side * half * (2 / 3);
    k.line([
      ...rect(cx - door * 0.55, y - tall * 0.78, cx + door * 0.55, y - tall * 0.38),
      [cx - door * 0.55, y - tall * 0.78],
    ]);
    for (const f of [-0.2, 0.2])
      k.line([
        [cx + f * door, y - tall * 0.78],
        [cx + f * door, y - tall * 0.38],
      ]);
  }
}

/** The ledge a temple stands on, cut into a mountain face: a level shelf wider than the
 *  building with its ends turned down into the slope, a stone retaining wall under it in
 *  courses, and a stair zigzagging down from one end. `u` is the frame's height. */
export function terrace(k: Ink, rng: Rng, x: number, y: number, half: number, u: number): void {
  const drop = 0.035 * u;
  const lip = sample(12, (v): Pt => [x + (v * 2 - 1) * half, y + Math.pow(Math.abs(v * 2 - 1), 5) * 0.012 * u]);
  k.cover([...lip, [x + half * 0.9, y + drop], [x - half * 0.9, y + drop]]);
  k.stroke(lip, 0.006 * u, undefined, 0.3);
  for (let c = 1; c <= 2; c++) {
    const cy = y + (drop * c) / 3;
    k.line([
      [x - half * 0.88, cy],
      [x + half * 0.88, cy],
    ]);
    for (let j = 0; j < 6; j++) {
      const jx = x + (-0.8 + (j + (c % 2) * 0.5) * 0.28) * half;
      k.line([
        [jx, cy - drop / 3],
        [jx, cy],
      ]);
    }
  }
  for (const sd of [-1, 1])
    k.stroke(
      sample(6, (v): Pt => [x + sd * (half * 0.9 + v * 0.03 * u), y + drop * 0.4 + v * 0.06 * u]),
      0.006 * u,
      root,
      0.4,
    );
  const sd = rng() < 0.5 ? -1 : 1;
  let [sx, sy] = [x + sd * half * 0.6, y + drop];
  for (let leg = 0; leg < 3; leg++) {
    const dx = (leg % 2 ? -sd : sd) * 0.03 * u;
    const dy = 0.024 * u;
    for (const off of [0, 0.005 * u])
      k.line([
        [sx + off, sy],
        [sx + dx + off, sy + dy],
      ]);
    for (let t = 1; t < 6; t++)
      k.line([
        [sx + (dx * t) / 6, sy + (dy * t) / 6],
        [sx + (dx * t) / 6 + 0.005 * u, sy + (dy * t) / 6],
      ]);
    [sx, sy] = [sx + dx, sy + dy];
  }
}

/** A hall: a stone platform with steps, columns with a door and lattice windows between them,
 *  and one or two roofs. Returns its height. */
export function hall(k: Ink, x: number, y: number, s: number, tiers: number): number {
  const up = (v: number): number => y - v * s;
  k.cover(rect(x - 0.58 * s, up(0.08), x + 0.58 * s, y + 0.02 * s));
  k.line([
    [x - 0.6 * s, y],
    [x + 0.6 * s, y],
  ]);
  k.line([
    [x - 0.54 * s, up(0.08)],
    [x + 0.54 * s, up(0.08)],
  ]);
  for (let i = 1; i < 4; i++)
    k.line([
      [x - 0.09 * s, up(0.02 * i)],
      [x + 0.09 * s, up(0.02 * i)],
    ]);
  let base = 0.08;
  let half = 0.64;
  for (let tier = 0; tier < tiers; tier++) {
    const body = tier ? 0.12 : 0.26;
    const bw = half * 0.66;
    k.cover(rect(x - bw * s, up(base + body), x + bw * s, up(base)));
    const cols = tier ? 2 : 4;
    for (let c = 0; c < cols; c++) {
      const cx = x + bw * s * 0.92 * (-1 + (2 * c) / (cols - 1));
      k.line([
        [cx, up(base)],
        [cx, up(base + body)],
      ]);
    }
    if (!tier) bays(k, x, up(base), bw * s * 0.92, body * s);
    const rise = 0.2 * (half / 0.64);
    roof(k, x, up(base + body), half * s, rise * s, s);
    base += body + rise;
    half *= 0.6;
  }
  return base * s;
}

/** A pagoda of `tiers` storeys, each a little narrower, crowned with a spire. Returns its height. */
export function pagoda(k: Ink, x: number, y: number, s: number, tiers: number): number {
  const up = (v: number): number => y - v * s;
  k.cover(rect(x - 0.4 * s, up(0.06), x + 0.4 * s, y + 0.25 * s));
  k.line([
    [x - 0.42 * s, up(0.06)],
    [x + 0.42 * s, up(0.06)],
  ]);
  let base = 0.06;
  let half = 0.55;
  for (let i = 0; i < tiers; i++) {
    const body = 0.24 * (1 - i * 0.05);
    const bw = half * 0.58;
    k.cover(rect(x - bw * s, up(base + body), x + bw * s, up(base)));
    k.line([
      [x - bw * s, up(base)],
      [x - bw * s, up(base + body)],
    ]);
    k.line([
      [x + bw * s, up(base)],
      [x + bw * s, up(base + body)],
    ]);
    k.line([
      [x, up(base + body * 0.3)],
      [x, up(base + body * 0.7)],
    ]);
    roof(k, x, up(base + body), half * s, 0.08 * s, s * 0.8);
    base += body + 0.08;
    half *= 0.87;
  }
  k.line([
    [x, up(base)],
    [x, up(base + 0.42)],
  ]);
  for (let j = 1; j < 4; j++) k.dab(x, up(base + 0.08 * j), 0.05 * s * (1 - j * 0.15), 0.018 * s);
  return (base + 0.42) * s;
}
