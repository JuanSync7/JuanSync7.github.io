import type { Point, Stroke } from './glyphs';

/** The pen's ink as closed outlines: every segment of every stroke becomes a capsule (a bar with
 *  round ends) of width `width`, all wound the same way, so their overlaps fill as one shape
 *  under the non-zero rule fonts use. A dot is a circle. */

const CAP = 8;

function circle(c: Point, r: number): Point[] {
  return Array.from({ length: 2 * CAP }, (_, k): Point => {
    const a = (k * Math.PI) / CAP;
    return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
  });
}

function capsule(p: Point, q: Point, r: number): Point[] {
  const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
  if (len < 1e-9) return circle(p, r);
  const a = Math.atan2(q[1] - p[1], q[0] - p[0]);
  const half = (c: Point, from: number): Point[] =>
    Array.from({ length: CAP + 1 }, (_, k): Point => {
      const t = from + (k * Math.PI) / CAP;
      return [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)];
    });
  // Round the far end from one side to the other, then the near end back: counter-clockwise.
  return [...half(q, a - Math.PI / 2), ...half(p, a + Math.PI / 2)];
}

/** Signed area: positive when the outline runs counter-clockwise (y up). */
export function area(poly: Point[]): number {
  return (
    poly.reduce((s, [x, y], k) => {
      const [nx, ny] = poly[(k + 1) % poly.length] ?? [x, y];
      return s + x * ny - nx * y;
    }, 0) / 2
  );
}

export function outlines(strokes: Stroke[], width: number): Point[][] {
  const out: Point[][] = [];
  for (const s of strokes) {
    if (s.length === 1 && s[0]) out.push(circle(s[0], width / 2));
    for (let k = 0; k + 1 < s.length; k++) {
      const [p, q] = [s[k], s[k + 1]];
      if (p && q) out.push(capsule(p, q, width / 2));
    }
  }
  return out.map((poly) => (area(poly) < 0 ? poly.reverse() : poly));
}
