import { between, type Rng } from './rng';

/** Flat line drawings in three weights (bold, mid, fine) on a 4 × 2 plane, for plans that
 *  nest: each plan has one window, the box the next plan is drawn in, and `finish` clips
 *  every line out of it. Helpers to split a plane into rooms or blocks around the window,
 *  and to place parts without overlap. Zoom dive draws them. */

/** Half the width of a plan (it is 2 high, as the frame is 2:1). */
export const A = 2;
/** How much bigger a plan is than its window. */
export const R = 4;
export const WX = A / R;
export const WY = 1 / R;

export type Pt = [number, number];
export type Box = [number, number, number, number];
export type Seg = [number, number, number, number];
/** 0 bold, 1 mid, 2 fine. */
export type Tone = 0 | 1 | 2;

export interface Plan {
  segs: [Seg[], Seg[], Seg[]];
  dots: Pt[];
  /** The window's centre; it is 2·WX by 2·WY. */
  w: Pt;
}

/** The area a plan draws in, inside the frame the dive draws round it. */
export const BOUND: Box = [-1.86, -0.9, 1.86, 0.9];

export const inset = ([x0, y0, x1, y1]: Box, d: number): Box => [x0 + d, y0 + d, x1 - d, y1 - d];
export const overlaps = (a: Box, b: Box, m = 0): boolean =>
  a[0] < b[2] + m && a[2] > b[0] - m && a[1] < b[3] + m && a[3] > b[1] - m;
export const within = (a: Box, b: Box): boolean => a[0] >= b[0] && a[1] >= b[1] && a[2] <= b[2] && a[3] <= b[3];

export class Sketch {
  readonly segs: [Seg[], Seg[], Seg[]] = [[], [], []];
  readonly dots: Pt[] = [];
  readonly win: Box;
  /** Boxes already used, for `place`; the window is always one. */
  readonly taken: Box[];

  constructor(
    readonly rng: Rng,
    readonly w: Pt,
  ) {
    this.win = [w[0] - WX, w[1] - WY, w[0] + WX, w[1] + WY];
    this.taken = [this.win];
  }
  r(lo: number, hi: number): number {
    return between(this.rng, lo, hi);
  }
  int(lo: number, hi: number): number {
    return lo + Math.floor(this.rng() * (hi - lo + 1));
  }
  chance(p: number): boolean {
    return this.rng() < p;
  }
  seg(x0: number, y0: number, x1: number, y1: number, t: Tone = 1): void {
    this.segs[t].push([x0, y0, x1, y1]);
  }
  poly(pts: readonly Pt[], t: Tone = 1, closed = false): void {
    for (let i = 1; i < pts.length; i++) {
      const [a, b] = [pts[i - 1], pts[i]];
      if (a && b) this.seg(a[0], a[1], b[0], b[1], t);
    }
    const [a, b] = [pts[pts.length - 1], pts[0]];
    if (closed && a && b) this.seg(a[0], a[1], b[0], b[1], t);
  }
  rect([x0, y0, x1, y1]: Box, t: Tone = 1): void {
    this.poly(
      [
        [x0, y0],
        [x1, y0],
        [x1, y1],
        [x0, y1],
      ],
      t,
      true,
    );
  }
  arc(x: number, y: number, r: number, a0: number, a1: number, t: Tone = 2, n = 10): void {
    this.poly(
      Array.from({ length: n + 1 }, (_, i): Pt => {
        const a = a0 + ((a1 - a0) * i) / n;
        return [x + Math.cos(a) * r, y + Math.sin(a) * r];
      }),
      t,
    );
  }
  circle(x: number, y: number, r: number, t: Tone = 2): void {
    this.arc(x, y, r, 0, Math.PI * 2, t, r > 0.05 ? 24 : 10);
  }
  /** Parallel lines across a box, `gap` apart: rows (h) or columns (v). */
  hatch([x0, y0, x1, y1]: Box, gap: number, t: Tone = 2, dir: 'h' | 'v' = 'h'): void {
    if (dir === 'h') for (let y = y0 + gap; y < y1 - gap / 3; y += gap) this.seg(x0, y, x1, y, t);
    else for (let x = x0 + gap; x < x1 - gap / 3; x += gap) this.seg(x, y0, x, y1, t);
  }
  /** A box cut into cols × rows cells. */
  grid([x0, y0, x1, y1]: Box, cols: number, rows: number, t: Tone = 2): void {
    for (let i = 1; i < cols; i++) this.seg(x0 + ((x1 - x0) * i) / cols, y0, x0 + ((x1 - x0) * i) / cols, y1, t);
    for (let j = 1; j < rows; j++) this.seg(x0, y0 + ((y1 - y0) * j) / rows, x1, y0 + ((y1 - y0) * j) / rows, t);
  }
  dashed(x0: number, y0: number, x1: number, y1: number, on: number, off: number, t: Tone = 2): void {
    const len = Math.hypot(x1 - x0, y1 - y0);
    for (let s = 0; s < len; s += on + off) {
      const e = Math.min(len, s + on);
      this.seg(
        x0 + ((x1 - x0) * s) / len,
        y0 + ((y1 - y0) * s) / len,
        x0 + ((x1 - x0) * e) / len,
        y0 + ((y1 - y0) * e) / len,
        t,
      );
    }
  }
  dot(x: number, y: number): void {
    this.dots.push([x, y]);
  }
  /** A free w × h box inside `bound`, clear of everything taken by `gap`, or null. */
  place(w: number, h: number, bound: Box = BOUND, gap = 0.04): Box | null {
    for (let k = 0; k < 60; k++) {
      const x = this.r(bound[0], bound[2] - w);
      const y = this.r(bound[1], bound[3] - h);
      const b: Box = [x, y, x + w, y + h];
      if (this.taken.every((o) => !overlaps(o, b, gap))) {
        this.taken.push(b);
        return b;
      }
    }
    return null;
  }
  /** A line that wanders off the straight from a to b by up to `amp`, the same each seed. */
  wavy(a: Pt, b: Pt, amp: number, n = 28): Pt[] {
    const ph = [this.r(0, 6.3), this.r(0, 6.3), this.r(0, 6.3)] as const;
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const len = Math.hypot(dx, dy) || 1;
    return Array.from({ length: n + 1 }, (_, i): Pt => {
      const t = i / n;
      const e =
        Math.sin(t * Math.PI) *
        amp *
        (Math.sin(t * 6 + ph[0]) + 0.5 * Math.sin(t * 15 + ph[1]) + 0.25 * Math.sin(t * 33 + ph[2]));
      return [a[0] + dx * t - (dy / len) * e, a[1] + dy * t + (dx / len) * e];
    });
  }
  /** A closed loop round (x, y) whose radius wanders by `amp` of itself. */
  blob(x: number, y: number, rx: number, ry: number, amp = 0.25, n = 36): Pt[] {
    const ph = [this.r(0, 6.3), this.r(0, 6.3)] as const;
    return Array.from({ length: n }, (_, i): Pt => {
      const a = (i / n) * Math.PI * 2;
      const k = 1 + amp * (0.6 * Math.sin(a * 2 + ph[0]) + 0.4 * Math.sin(a * 5 + ph[1]));
      return [x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k];
    });
  }
}

/** Cut `bound` into rooms of about `size` across: first along the edges of `keep` (so it is
 *  one room of its own, left out of the result), then each piece in two across its longer
 *  side until it is small enough. Rooms touch; inset them for walls or streets. */
export function partition(S: Sketch, bound: Box, keep: Box | null, size: number): Box[] {
  const out: Box[] = [];
  const split = (b: Box): void => {
    const [w, h] = [b[2] - b[0], b[3] - b[1]];
    if (w < 0.02 || h < 0.02) return;
    if (w * h < size * size * S.r(0.7, 1.5) || (w < size && h < size)) {
      out.push(b);
      return;
    }
    const f = S.r(0.32, 0.68);
    if (w > h * S.r(0.8, 1.6)) {
      const x = b[0] + w * f;
      split([b[0], b[1], x, b[3]]);
      split([x, b[1], b[2], b[3]]);
    } else {
      const y = b[1] + h * f;
      split([b[0], b[1], b[2], y]);
      split([b[0], y, b[2], b[3]]);
    }
  };
  if (!keep) split(bound);
  else {
    split([bound[0], bound[1], keep[0], bound[3]]);
    split([keep[2], bound[1], bound[2], bound[3]]);
    split([keep[0], bound[1], keep[2], keep[1]]);
    split([keep[0], keep[3], keep[2], bound[3]]);
  }
  return out;
}

/** The parts of a segment outside a box (Liang–Barsky): none, one or two pieces. */
function outside(s: Seg, [X0, Y0, X1, Y1]: Box): Seg[] {
  const [x0, y0, x1, y1] = s;
  const [dx, dy] = [x1 - x0, y1 - y0];
  let [t0, t1] = [0, 1];
  for (const [p, q] of [
    [-dx, x0 - X0],
    [dx, X1 - x0],
    [-dy, y0 - Y0],
    [dy, Y1 - y0],
  ] as const) {
    if (p === 0) {
      if (q < 0) return [s];
    } else if (p < 0) t0 = Math.max(t0, q / p);
    else t1 = Math.min(t1, q / p);
  }
  if (t0 >= t1) return [s];
  const at = (t: number): Pt => [x0 + dx * t, y0 + dy * t];
  const out: Seg[] = [];
  if (t0 > 1e-6) out.push([x0, y0, ...at(t0)]);
  if (t1 < 1 - 1e-6) out.push([...at(t1), x1, y1]);
  return out;
}

/** The finished plan: everything inside the window cut away, for the next plan to fill. */
export function finish(S: Sketch): Plan {
  const clip = (l: Seg[]): Seg[] => l.flatMap((s) => outside(s, S.win));
  const [x0, y0, x1, y1] = S.win;
  return {
    segs: [clip(S.segs[0]), clip(S.segs[1]), clip(S.segs[2])],
    dots: S.dots.filter(([x, y]) => x < x0 || x > x1 || y < y0 || y > y1),
    w: S.w,
  };
}
