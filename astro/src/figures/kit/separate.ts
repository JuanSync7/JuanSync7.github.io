import type { Part, PartKind } from './city';
import { bodyOf } from './city';

/** Keeps a district's parts from standing in each other (`templates/district.ts`). Every part
 *  on the ground has a footprint, a turned rectangle; they are placed one at a time, the
 *  landmark first, then buildings, largest first, then the small things of a park. A part
 *  that cuts into one already placed is pushed out along the shortest way clear (the
 *  separating axis with the least overlap), a few times if it must; if it still cuts in, or
 *  is pushed off the board, it is left out. The same seed always gives the same result.
 *
 *  Overlaps that are meant are kept: the masses of one building, anything
 *  standing on another (y > 0), a machine wholly inside its hall, rocks piled on rocks, and
 *  ground that other things stand on (a lawn, a lake, a conveyor, a wall ring, the dam). */

const FLAT: readonly PartKind[] = ['park', 'lake', 'reservoir', 'belt', 'wall', 'damwall', 'cell', 'macro'];
const PROPS: readonly PartKind[] = [
  'tree',
  'pine',
  'birch',
  'cypress',
  'oak',
  'bush',
  'flowers',
  'bench',
  'lamp',
  'person',
  'fountain',
];
const STONE: readonly PartKind[] = ['rock', 'mesa'];
/** The masses one building is made of (a library's storeys, portico and clock tower). */
const MASSES: readonly PartKind[] = ['storey', 'portico', 'clocktower'];
/** Footprints are taken a little inside their outline, so parts may touch. */
const SHRINK = 0.86;

interface Box {
  x: number;
  z: number;
  hw: number;
  hd: number;
  c: number;
  s: number;
}
const boxOf = (p: Part): Box => {
  const r = p.rot ?? 0;
  return { x: p.x, z: p.z, hw: (p.w / 2) * SHRINK, hd: (p.d / 2) * SHRINK, c: Math.cos(r), s: Math.sin(r) };
};
/** The four corners of a footprint. */
const corners = (b: Box): [number, number][] =>
  [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([u = 0, v = 0]) => [b.x + u * b.hw * b.c - v * b.hd * b.s, b.z + u * b.hw * b.s + v * b.hd * b.c]);

/** The shortest push that takes b clear of a, as [dx, dz], or null when they do not overlap. */
function push(a: Box, b: Box): [number, number] | null {
  const [ca, cb] = [corners(a), corners(b)];
  let best: [number, number] | null = null;
  let least = Infinity;
  for (const [ax, az] of [
    [a.c, a.s],
    [-a.s, a.c],
    [b.c, b.s],
    [-b.s, b.c],
  ] as const) {
    const span = (pts: [number, number][]): [number, number] => {
      const d = pts.map(([x, z]) => x * ax + z * az);
      return [Math.min(...d), Math.max(...d)];
    };
    const [[a0, a1], [b0, b1]] = [span(ca), span(cb)];
    const over = Math.min(a1, b1) - Math.max(a0, b0);
    if (over <= 0) return null;
    if (over < least) {
      least = over;
      const sign = (b0 + b1) / 2 >= (a0 + a1) / 2 ? 1 : -1;
      best = [ax * (over + 0.004) * sign, az * (over + 0.004) * sign];
    }
  }
  return best;
}
/** Whether b lies wholly inside a. */
const inside = (a: Box, b: Box): boolean =>
  corners(b).every(([x, z]) => {
    const [dx, dz] = [x - a.x, z - a.z];
    return Math.abs(dx * a.c + dz * a.s) <= a.hw + 1e-6 && Math.abs(-dx * a.s + dz * a.c) <= a.hd + 1e-6;
  });

const meant = (a: Part, b: Part, ba: Box, bb: Box): boolean =>
  (MASSES.includes(a.kind) && MASSES.includes(b.kind)) ||
  (STONE.includes(a.kind) && STONE.includes(b.kind)) ||
  (!PROPS.includes(a.kind) && !PROPS.includes(b.kind) && (inside(ba, bb) || inside(bb, ba)));

/** The district's parts with no unmeant overlaps, on a board w × d. */
export function separate(parts: readonly Part[], w: number, d: number, landmark?: Part): Part[] {
  const free = parts.filter((p) => (p.y ?? 0) > 0 || FLAT.includes(p.kind));
  const rank = (p: Part): number =>
    p === landmark ? -1e9 : (PROPS.includes(p.kind) ? 0 : -1e3) - p.w * p.d * (bodyOf(p.kind) ? 2 : 1);
  const ground = parts.filter((p) => !free.includes(p)).sort((a, b) => rank(a) - rank(b));
  const placed: Part[] = [];
  for (const p0 of ground) {
    const p = { ...p0 };
    let ok = false;
    for (let k = 0; k < 6 && !ok; k++) {
      ok = true;
      for (const q of placed) {
        const [bq, bp] = [boxOf(q), boxOf(p)];
        if (meant(q, p, bq, bp)) continue;
        const m = push(bq, bp);
        if (!m) continue;
        [p.x, p.z, ok] = [p.x + m[0], p.z + m[1], false];
        break;
      }
    }
    // On the board: its footprint may lean over the edge a little, as a rock does, not its middle.
    const k = Math.min(p.w, p.d) * 0.3;
    const on = Math.abs(p.x) + k < w / 2 && Math.abs(p.z) + k < d / 2;
    if (ok && on) placed.push(p);
  }
  return [...free, ...placed];
}
