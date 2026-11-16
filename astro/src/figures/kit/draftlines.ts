import { BufferGeometry, Float32BufferAttribute } from 'three';

/** Line work for drawings (kit/draftplan): centre lines, dimensions, the projection symbol and
 *  sections, as flat lists of 2D segment end points in drawing units (y down). Lengths scale with
 *  `m`, the drawing's unit of spacing. */

export type P2 = [number, number];

/** Segments (pairs of points, y down) as one geometry in the scene's frame (y up). */
export function segs(pts: P2[], z = 0): BufferGeometry {
  return new BufferGeometry().setAttribute('position', new Float32BufferAttribute(pts.flatMap(([x, y]) => [x, -y, z]), 3)); // prettier-ignore
}

/** A chain (centre or cutting-plane) line from a to b: long dash, gap, short dash, gap. */
export function chain(a: P2, b: P2, m: number): P2[] {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const at = (s: number): P2 => {
    const t = Math.min(s, len) / len;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  };
  const pts: P2[] = [];
  for (let s = 0; s < len; s += 0.2 * m) pts.push(at(s), at(s + 0.13 * m), at(s + 0.16 * m), at(s + 0.17 * m));
  return pts;
}

/** An arrowhead at `tip` pointing along (ux, uy): two strokes `head` long at 15° (ISO 129-1). */
export function arrow(tip: P2, ux: number, uy: number, head: number): P2[] {
  const [x, y] = tip;
  const k = Math.tan((15 * Math.PI) / 180);
  return [-k, k].flatMap((t): P2[] => [[x, y], [x - head * (ux - t * uy), y - head * (uy + t * ux)]]); // prettier-ignore
}

/** A dimension from a to b, `away` from the part along the unit normal (nx, ny): extension lines
 *  that leave a `gap` at the part and run `over` past the line, the line, and an arrowhead at
 *  each end (ISO 129-1). Lengths in drawing units. */
export function dimLines(a: P2, b: P2, [nx, ny]: P2, away: number, head: number, gap: number, over: number): P2[] {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const [ux, uy] = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  const ext = ([x, y]: P2): P2[] => [[x - nx * (away - gap), y - ny * (away - gap)], [x + nx * over, y + ny * over]]; // prettier-ignore
  return [...ext(a), ...ext(b), a, b, ...arrow(a, -ux, -uy, head), ...arrow(b, ux, uy, head)];
}

/** The first-angle symbol in a box: a truncated cone's elevation, narrow end left, and its end
 *  view (two circles) on the right. */
export function symbolLines(x0: number, y0: number, x1: number, y1: number): P2[] {
  const [cy, hh] = [(y0 + y1) / 2, (y1 - y0) / 2];
  const xm = x0 + (x1 - x0) * 0.45;
  const cone: P2[] = [[x0, cy - hh * 0.5], [xm, cy - hh], [xm, cy + hh], [x0, cy + hh * 0.5]]; // prettier-ignore
  const pts: P2[] = cone.flatMap((p, k): P2[] => [p, cone[(k + 1) % 4] ?? p]);
  const cx = x1 - hh;
  for (const r of [hh, hh * 0.5])
    for (let k = 0; k < 48; k++)
      pts.push(...[k, k + 1].map((j): P2 => [cx + r * Math.cos((j * Math.PI) / 24), cy + r * Math.sin((j * Math.PI) / 24)])); // prettier-ignore
  return pts;
}

/** Where the solids cross the plane z = `z`: segments in their own (x, y), y up. */
export function sectionAt(geos: BufferGeometry[], z: number): P2[] {
  const out: P2[] = [];
  for (const g of geos) {
    const flat = g.index ? g.toNonIndexed() : g;
    const p = flat.getAttribute('position');
    for (let t = 0; t + 2 < p.count; t += 3) {
      const v = [0, 1, 2].map((k) => [p.getX(t + k), p.getY(t + k), p.getZ(t + k) - z] as const);
      const hits: P2[] = [];
      v.forEach((a, k) => {
        const b = v[(k + 1) % 3];
        if (!b || a[2] < 0 === b[2] < 0) return;
        const s = a[2] / (a[2] - b[2]);
        hits.push([a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s]);
      });
      if (hits.length === 2) out.push(...hits);
    }
    if (flat !== g) flat.dispose();
  }
  return out;
}

/** Hatching at 45° inside closed outlines given as unordered segments (even-odd), `gap` apart. */
export function hatch(outline: P2[], gap: number): P2[] {
  const r = Math.SQRT1_2;
  const uv = ([x, y]: P2): P2 => [(x + y) * r, (x - y) * r];
  const xy = ([u, v]: P2): P2 => [(u + v) * r, (u - v) * r];
  const lines: [P2, P2][] = [];
  for (let k = 0; k + 1 < outline.length; k += 2) lines.push([uv(outline[k] ?? [0, 0]), uv(outline[k + 1] ?? [0, 0])]);
  const vs = lines.flatMap(([a, b]) => [a[1], b[1]]);
  const out: P2[] = [];
  for (let c = Math.ceil(Math.min(...vs) / gap) * gap; c < Math.max(...vs); c += gap) {
    const us = lines
      .filter(([a, b]) => a[1] < c !== b[1] < c)
      .map(([a, b]) => a[0] + ((b[0] - a[0]) * (c - a[1])) / (b[1] - a[1]))
      .sort((p, q) => p - q);
    for (let k = 0; k + 1 < us.length; k += 2) out.push(xy([us[k] ?? 0, c]), xy([us[k + 1] ?? 0, c]));
  }
  return out;
}
