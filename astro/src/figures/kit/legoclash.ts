import { apply, rotate, type V3 } from './legopose.ts';
import { cellsOf, PLATE, type Piece } from './legoset.ts';

/** Clipping between sub-assemblies: their grids do not line up, so each cell a piece takes is a
 *  box turned with its sub-assembly, and two boxes of different sub-assemblies may not overlap
 *  (separating-axis test, each box shrunk by `GRACE` so faces that touch pass). Pairs joined by a
 *  hinge are let off: their knuckles interleave. Pure. */

const GRACE = 0.03;
interface Box {
  c: V3;
  ax: [V3, V3, V3];
  e: V3;
  i: number;
}

const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

function boxesOf(p: Piece, i: number): Box[] {
  const q = p.pose;
  const ax = ([[1, 0, 0], [0, 1, 0], [0, 0, 1]] as V3[]).map((v) => (q ? rotate(q, v) : v)) as [V3, V3, V3]; // prettier-ignore
  return cellsOf(p).map((c) => {
    const [x = 0, y = 0, z = 0] = c.split(',').map(Number);
    return { c: apply(q, [x + 0.5, (y + 0.5) * PLATE, z + 0.5]), ax, e: [0.5 - GRACE, PLATE / 2 - GRACE, 0.5 - GRACE], i }; // prettier-ignore
  });
}

function overlaps(a: Box, b: Box): boolean {
  const axes: V3[] = [...a.ax, ...b.ax];
  for (const u of a.ax)
    for (const v of b.ax) {
      const c = cross(u, v);
      const n = Math.hypot(...c);
      if (n > 1e-6) axes.push([c[0] / n, c[1] / n, c[2] / n]);
    }
  const t: V3 = [b.c[0] - a.c[0], b.c[1] - a.c[1], b.c[2] - a.c[2]];
  const reach = (x: Box, l: V3): number => x.ax.reduce((s, u, k) => s + (x.e[k] ?? 0) * Math.abs(dot(u, l)), 0);
  return axes.every((l) => Math.abs(dot(t, l)) <= reach(a, l) + reach(b, l));
}

/** Pairs of pieces (by index) in different sub-assemblies whose cells overlap. */
export function clashes(pieces: Piece[], apart: Set<string>): [number, number][] {
  const boxes = pieces.flatMap((p, i) => boxesOf(p, i));
  const bins = new Map<string, number[]>();
  boxes.forEach((b, k) => {
    const r = [0, 1, 2].map((d) => b.ax.reduce((s, u, n) => s + (b.e[n] ?? 0) * Math.abs(u[d] ?? 0), 0));
    const lo = [0, 1, 2].map((d) => Math.floor((b.c[d] ?? 0) - (r[d] ?? 0)));
    const hi = [0, 1, 2].map((d) => Math.floor((b.c[d] ?? 0) + (r[d] ?? 0)));
    for (let x = lo[0] ?? 0; x <= (hi[0] ?? 0); x++)
      for (let y = lo[1] ?? 0; y <= (hi[1] ?? 0); y++)
        for (let z = lo[2] ?? 0; z <= (hi[2] ?? 0); z++) {
          const key = `${x},${y},${z}`;
          const list = bins.get(key);
          if (list) list.push(k);
          else bins.set(key, [k]);
        }
  });
  const seen = new Set<string>();
  const out: [number, number][] = [];
  for (const list of bins.values())
    for (let m = 0; m < list.length; m++)
      for (let n = m + 1; n < list.length; n++) {
        const [a, b] = [boxes[list[m] ?? 0], boxes[list[n] ?? 0]];
        if (!a || !b || a.i === b.i || (pieces[a.i]?.sub ?? '') === (pieces[b.i]?.sub ?? '')) continue;
        const pair = `${Math.min(a.i, b.i)}-${Math.max(a.i, b.i)}`;
        if (seen.has(pair) || apart.has(pair)) continue;
        if (overlaps(a, b)) {
          seen.add(pair);
          out.push([Math.min(a.i, b.i), Math.max(a.i, b.i)]);
        }
      }
  return out;
}
