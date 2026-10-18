import { ink } from './ink';

type Pt = [number, number];

/** Marks gathered by brightness, so each of a few buckets is one fill colour and one
 *  stroke: thousands of stars cost a handful of canvas state changes, not thousands. */
export class Batch {
  private readonly rects: number[][] = Array.from({ length: 8 }, () => []);
  private readonly segs: number[][] = Array.from({ length: 8 }, () => []);
  private readonly dark: number[] = [];
  /** a in 0..1, relative to the batch's top opacity. */
  private slot(a: number): number {
    return Math.max(0, Math.min(7, Math.floor(a * 8)));
  }
  dot(x: number, y: number, d: number, a: number): void {
    this.rects[this.slot(a)]?.push(x - d / 2, y - d / 2, d);
  }
  dust(x: number, y: number, d: number): void {
    this.dark.push(x - d, y - d, d * 2);
  }
  line(p: Pt, q: Pt, a: number): void {
    this.segs[this.slot(a)]?.push(q[0], q[1], p[0], p[1]);
  }
  flush(ctx: CanvasRenderingContext2D, top: number, width = 1): void {
    ctx.lineWidth = width;
    this.rects.forEach((r, k) => {
      if (!r.length) return;
      ctx.fillStyle = ink.line((top * (k + 0.5)) / 8);
      for (let i = 0; i < r.length; i += 3) ctx.fillRect(r[i] ?? 0, r[i + 1] ?? 0, r[i + 2] ?? 1, r[i + 2] ?? 1);
    });
    this.segs.forEach((l, k) => {
      if (!l.length) return;
      ctx.strokeStyle = ink.line((top * (k + 0.5)) / 8);
      ctx.beginPath();
      for (let i = 0; i < l.length; i += 4) {
        ctx.moveTo(l[i] ?? 0, l[i + 1] ?? 0);
        ctx.lineTo(l[i + 2] ?? 0, l[i + 3] ?? 0);
      }
      ctx.stroke();
    });
    if (this.dark.length) {
      ctx.fillStyle = ink.ground(0.5 * top);
      for (let i = 0; i < this.dark.length; i += 3)
        ctx.fillRect(this.dark[i] ?? 0, this.dark[i + 1] ?? 0, this.dark[i + 2] ?? 1, this.dark[i + 2] ?? 1);
    }
    ctx.lineWidth = 1;
  }
}
