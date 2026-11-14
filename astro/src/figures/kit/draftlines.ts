import { BufferGeometry, Float32BufferAttribute, type Vector3 } from 'three';

/** Line work for drawings (kit/legodraft): centre lines, dimensions and the projection symbol, as
 *  flat lists of segment end points. Lengths scale with `m`, the drawing's unit of spacing. */

/** A box in fractions of the drawing, from its top left. */
export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Line segments as one geometry: `pts` in pairs. */
export function segs(pts: number[][]): BufferGeometry {
  return new BufferGeometry().setAttribute('position', new Float32BufferAttribute(pts.flat(), 3));
}

/** A chain (centre) line from a to b: long dash, gap, short dash, gap. */
export function chain(a: Vector3, b: Vector3, m: number): number[][] {
  const len = a.distanceTo(b);
  const pts: number[][] = [];
  const at = (s: number): number[] =>
    a
      .clone()
      .lerp(b, Math.min(s, len) / len)
      .toArray();
  for (let s = 0; s < len; s += 0.2 * m) pts.push(at(s), at(s + 0.13 * m), at(s + 0.16 * m), at(s + 0.17 * m));
  return pts;
}

/** A dimension: extension lines off the view edge, the line itself, an arrowhead at each end. */
export function dimLines(a: number[], b: number[], out: number[], m: number): number[][] {
  const [ax = 0, ay = 0] = a;
  const [bx = 0, by = 0] = b;
  const [ux, uy] = [(bx - ax) / Math.hypot(bx - ax, by - ay), (by - ay) / Math.hypot(bx - ax, by - ay)];
  const [ex = 0, ey = 0] = out;
  const head = 0.05 * m;
  const arrow = (x: number, y: number, s: number): number[][] =>
    [-0.35, 0.35].flatMap((k) => [[x, y, 0], [x + s * head * (ux - k * uy), y + s * head * (uy + k * ux), 0]]); // prettier-ignore
  const ext = (x: number, y: number): number[][] => [[x - ex * 0.9, y - ey * 0.9, 0], [x + ex * 0.2, y + ey * 0.2, 0]]; // prettier-ignore
  return [...ext(ax, ay), ...ext(bx, by), [ax, ay, 0], [bx, by, 0], ...arrow(ax, ay, 1), ...arrow(bx, by, -1)];
}

/** The first-angle symbol: a truncated cone's elevation, narrow end left, its end view on the right. */
export function symbolLines(r: Rect, w: number, h: number): number[][] {
  const [x0, y0, x1, y1] = [r.x0 * w, -r.y0 * h, r.x1 * w, -r.y1 * h];
  const [cy, hh] = [(y0 + y1) / 2, (y0 - y1) / 2];
  const cone = [[x0, cy - hh * 0.5], [x0 + (x1 - x0) * 0.45, cy - hh], [x0 + (x1 - x0) * 0.45, cy + hh], [x0, cy + hh * 0.5]]; // prettier-ignore
  const pts: number[][] = [];
  cone.forEach((p, k) => pts.push([...p, 0], [...(cone[(k + 1) % 4] ?? p), 0]));
  const cx = x1 - hh;
  for (const rad of [hh, hh * 0.5])
    for (let k = 0; k < 48; k++)
      pts.push(...[k, k + 1].map((j) => [cx + rad * Math.cos((j * Math.PI) / 24), cy + rad * Math.sin((j * Math.PI) / 24), 0])); // prettier-ignore
  return pts;
}
