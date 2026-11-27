import type { Pt } from './brush';
import { ink } from './ink';
import type { Noise2 } from './noise';

/** Cached ink for scrolling ink-brush scenes (after shan-shui-inf). A scene builds each thing
 *  once into a `Mark` (three Path2D layers) and each frame only moves and fills it. Every
 *  outline is wound the same way, so strokes that overlap join under one fill instead of
 *  cutting holes, and one alpha covers the whole mark evenly (R-FIG-29's idea for brushes). */

export interface Mark {
  /** What the pointer can pick it as; null for scenery (a range, ripples, the bank). */
  kind: string | null;
  x0: number;
  x1: number;
  cx: number;
  cy: number;
  r: number;
  /** Filled with the ground first, so the mark hides what is behind it. */
  hide: Path2D;
  body: Path2D;
  hair: Path2D;
  /** Ink strength, 0..1. */
  a: number;
  /** Phase of a gentle bob on the water, or null for things on land. */
  bob: number | null;
}

/** Swells in the middle, tapers at both ends: the default brush. */
export const swell = (t: number): number => Math.pow(Math.sin(t * Math.PI), 0.6);
/** Thick at the root, thin at the tip: trunks, branches, blades. */
export const root = (t: number): number => 1 - 0.85 * t;

function area(p: readonly Pt[]): number {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i];
    const b = p[(i + 1) % p.length];
    if (a && b) s += a[0] * b[1] - b[0] * a[1];
  }
  return s;
}

export class Ink {
  readonly hide = new Path2D();
  readonly body = new Path2D();
  readonly hair = new Path2D();
  private lo = Infinity;
  private hi = -Infinity;

  constructor(private readonly noise: Noise2) {}

  private reach(x0: number, x1: number): void {
    if (x0 < this.lo) this.lo = x0;
    if (x1 > this.hi) this.hi = x1;
  }

  private poly(path: Path2D, pts: readonly Pt[]): void {
    const ring = area(pts) < 0 ? [...pts].reverse() : pts;
    ring.forEach((p, i) => (i ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1])));
    path.closePath();
    for (const p of pts) this.reach(p[0], p[0]);
  }

  /** A tapered brush stroke along `pts`, `width` px at its widest. */
  stroke(pts: readonly Pt[], width: number, profile = swell, wobble = 0.3, seed = 0): void {
    if (pts.length < 2) return;
    const left: Pt[] = [];
    const right: Pt[] = [];
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)] ?? p;
      const b = pts[Math.min(pts.length - 1, i + 1)] ?? p;
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      const w = (width / 2) * profile(i / (pts.length - 1));
      const nl = w * (1 + wobble * this.noise(i * 0.35, seed));
      const nr = w * (1 + wobble * this.noise(i * 0.35, seed + 9.1));
      left.push([p[0] - (dy / l) * nl, p[1] + (dx / l) * nl]);
      right.push([p[0] + (dy / l) * nr, p[1] - (dx / l) * nr]);
    });
    this.poly(this.body, [...left, ...right.reverse()]);
  }

  /** A hairline through `pts`. */
  line(pts: readonly Pt[]): void {
    pts.forEach((p, i) => (i ? this.hair.lineTo(p[0], p[1]) : this.hair.moveTo(p[0], p[1])));
    for (const p of pts) this.reach(p[0], p[0]);
  }

  /** A shape that hides what is behind the mark. */
  cover(pts: readonly Pt[]): void {
    this.poly(this.hide, pts);
  }

  /** A dab of the brush: a small filled oval (leaves, moss, lily pads). */
  dab(x: number, y: number, rx: number, ry: number, rot = 0): void {
    this.body.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot));
    this.body.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    this.body.closePath();
    this.reach(x - rx, x + rx);
  }

  /** An oval that hides what is behind it (a crown of leaves, a pond). */
  coverOval(x: number, y: number, rx: number, ry: number): void {
    this.hide.moveTo(x + rx, y);
    this.hide.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    this.hide.closePath();
    this.reach(x - rx, x + rx);
  }

  done(kind: string | null, a: number, cx: number, cy: number, r: number, bob: number | null = null): Mark {
    return { kind, x0: this.lo, x1: this.hi, cx, cy, r, hide: this.hide, body: this.body, hair: this.hair, a, bob };
  }
}

/** Draws a mark shifted by (dx, dy): ground under it, then its brush and its hairlines. */
export function drawMark(ctx: CanvasRenderingContext2D, m: Mark, dx: number, dy: number, lit: boolean): void {
  ctx.save();
  ctx.translate(dx, dy);
  ctx.fillStyle = ink.ground();
  ctx.fill(m.hide);
  ctx.fillStyle = lit ? ink.signal(0.9) : ink.line(m.a);
  ctx.fill(m.body);
  ctx.strokeStyle = lit ? ink.signal(0.8) : ink.line(m.a * 0.7);
  ctx.stroke(m.hair);
  ctx.restore();
}

/** A rectangle as points, for covers. */
export const rect = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];

/** Samples `f(u)` for u in 0..1 into `n + 1` points. */
export function sample(n: number, f: (u: number) => Pt): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => f(i / n));
}
