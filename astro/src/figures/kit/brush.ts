import type { Noise2 } from './noise';

/** Ink-brush strokes in the manner of shan-shui-inf (LingDong-): a polyline becomes a
 *  filled shape whose width swells in the middle and tapers at both ends, with a little
 *  noise in the edge so it reads as a brush, not a vector line. */

export type Pt = readonly [number, number];

export interface BrushOpts {
  /** Widest point of the stroke, in pixels. */
  width: number;
  noise: Noise2;
  /** How much the edge wanders, 0..1. */
  wobble?: number;
  /** Shapes width along the stroke: t in 0..1 to a factor. Default swells in the middle. */
  profile?: (t: number) => number;
  seed?: number;
}

const swell = (t: number): number => Math.pow(Math.sin(t * Math.PI), 0.6);

/** Fills a tapered stroke along `pts` with the current fillStyle. */
export function brush(ctx: CanvasRenderingContext2D, pts: readonly Pt[], o: BrushOpts): void {
  if (pts.length < 2) return;
  const prof = o.profile ?? swell;
  const wob = o.wobble ?? 0.35;
  const seed = o.seed ?? 0;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i] ?? [0, 0];
    const a = pts[Math.max(0, i - 1)] ?? p;
    const b = pts[Math.min(pts.length - 1, i + 1)] ?? p;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const t = i / (pts.length - 1);
    const w = (o.width / 2) * prof(t);
    const nl = w * (1 + wob * o.noise(i * 0.35, seed));
    const nr = w * (1 + wob * o.noise(i * 0.35, seed + 9.1));
    left.push([p[0] - (dy / l) * nl, p[1] + (dx / l) * nl]);
    right.push([p[0] + (dy / l) * nr, p[1] - (dx / l) * nr]);
  }
  ctx.beginPath();
  left.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
  for (let i = right.length - 1; i >= 0; i--) {
    const p = right[i];
    if (p) ctx.lineTo(p[0], p[1]);
  }
  ctx.closePath();
  ctx.fill();
}

/** A ridge line sampled from noise across [x0, x1]: the outline of a mountain range.
 *  `peak` sharpens the envelope from a rounded hill (0) to a pointed summit (1). */
export function ridge(noise: Noise2, x0: number, x1: number, base: number, height: number, seed: number, step = 6, peak = 0): Pt[] {
  const out: Pt[] = [];
  for (let x = x0; x <= x1 + 0.1; x += step) {
    const u = (x - x0) / Math.max(1, x1 - x0);
    const round = Math.sin(u * Math.PI);
    const point = Math.pow(1 - Math.abs(2 * u - 1), 1.4);
    const env = round + (point - round) * peak;
    const n = noise(x * 0.006, seed) * 0.7 + noise(x * 0.02, seed + 3) * 0.3;
    out.push([x, base - height * env * (0.55 + 0.45 * n)]);
  }
  return out;
}

/** Short dry-brush texture marks under a ridge, like the cun strokes of a landscape. */
export function texture(ctx: CanvasRenderingContext2D, top: readonly Pt[], depth: number, noise: Noise2, every = 3): void {
  for (let i = 0; i < top.length; i += every) {
    const p = top[i];
    if (!p) continue;
    const len = depth * (0.3 + 0.7 * Math.abs(noise(p[0] * 0.05, 7.7)));
    const lean = noise(p[0] * 0.03, 2.2) * 6;
    ctx.beginPath();
    ctx.moveTo(p[0], p[1] + 2);
    ctx.lineTo(p[0] + lean, p[1] + 2 + len);
    ctx.stroke();
  }
}
