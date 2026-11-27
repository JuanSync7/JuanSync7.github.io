import type { Pt } from './brush';
import { rect, sample, type Ink } from './inkpath';

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
  for (let j = 1; j < 6; j++) {
    const a = low[Math.round((j / 6) * 18)];
    const b = top[Math.round((j / 6) * 18)];
    if (a && b) k.line([a, b]);
  }
}

/** A hall: stone terrace with steps, columns, one or two roofs. Returns its height. */
export function hall(k: Ink, x: number, y: number, s: number, tiers: number): number {
  const up = (v: number): number => y - v * s;
  k.cover(rect(x - 0.58 * s, up(0.08), x + 0.58 * s, y + 0.18 * s));
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
