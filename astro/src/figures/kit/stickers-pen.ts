import { brush, type Pt } from './brush';
import { ink } from './ink';
import type { Noise2 } from './noise';

export type { Pt };
/** Hand-drawn hobby stickers for `hobby-sticker.ts`: each a small ink illustration on a unit
 *  square (y down), drawn with tapered brush outlines, hatched shade and grey washes, with
 *  one part in the signal. The page cuts the sticker paper around it; the canvas only inks. */

export const HOBBIES = ['frisbee', 'badminton', 'swimming', 'piano', 'travelling'] as const;
export type Hobby = (typeof HOBBIES)[number];

export interface Pen {
  ctx: CanvasRenderingContext2D;
  s: number;
  ox: number;
  oy: number;
  noise: Noise2;
}

export const P = (p: Pen, x: number, y: number): Pt => [p.ox + x * p.s, p.oy + y * p.s];

/** An ellipse (or an arc of one) as unit points, turned by `rot`. */
export function ell(cx: number, cy: number, rx: number, ry: number, rot = 0, a0 = 0, a1 = Math.PI * 2, n = 40): Pt[] {
  const [c, s] = [Math.cos(rot), Math.sin(rot)];
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    const [x, y] = [Math.cos(a) * rx, Math.sin(a) * ry];
    return [cx + x * c - y * s, cy + x * s + y * c] as Pt;
  });
}

/** A hand line: a tapered brush along unit points, slightly wandering. */
export function line(p: Pen, pts: Pt[], w = 2.2, a = 0.9, seed = 0): void {
  p.ctx.fillStyle = ink.line(a);
  brush(
    p.ctx,
    pts.map(([x, y]) => P(p, x, y)),
    { width: w * (p.s / 160), noise: p.noise, wobble: 0.45, seed, profile: (t) => 0.55 + 0.45 * Math.sin(t * Math.PI) },
  );
}

/** A flat wash inside unit points. */
export function wash(p: Pen, pts: Pt[], style: string): void {
  p.ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? p.ctx.lineTo(...P(p, x, y)) : p.ctx.moveTo(...P(p, x, y))));
  p.ctx.closePath();
  p.ctx.fillStyle = style;
  p.ctx.fill();
}

/** Diagonal hand hatching clipped to unit points. */
export function hatch(p: Pen, pts: Pt[], gap = 0.03, a = 0.4): void {
  const { ctx } = p;
  ctx.save();
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(...P(p, x, y)) : ctx.moveTo(...P(p, x, y))));
  ctx.closePath();
  ctx.clip();
  ctx.beginPath();
  for (let k = -1; k < 2; k += gap) {
    const j = p.noise(k * 9, 3) * 0.01;
    ctx.moveTo(...P(p, k + j, 1));
    ctx.lineTo(...P(p, k + 1 + j, 0));
  }
  ctx.strokeStyle = ink.line(a);
  ctx.stroke();
  ctx.restore();
}
