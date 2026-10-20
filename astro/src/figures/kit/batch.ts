import { puff } from './glow';
import { ink } from './ink';

/** Marks gathered by brightness, so each of a few buckets is one fill colour: thousands of
 *  stars cost a handful of canvas state changes, not thousands. Small marks are squares (a
 *  pixel or two reads as a point); anything bigger is a round soft glow, never a square or a
 *  streak. */
export class Batch {
  private readonly rects: number[][] = Array.from({ length: 8 }, () => []);
  private readonly soft: number[] = [];
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
  /** A round soft glow of radius r at opacity a (relative to the batch's top). */
  glow(x: number, y: number, r: number, a: number): void {
    this.soft.push(x, y, r, a);
  }
  flush(ctx: CanvasRenderingContext2D, top: number): void {
    if (this.soft.length) {
      const img = puff();
      for (let i = 0; i < this.soft.length; i += 4) {
        const [x, y, r, a] = [this.soft[i] ?? 0, this.soft[i + 1] ?? 0, this.soft[i + 2] ?? 1, this.soft[i + 3] ?? 0];
        ctx.globalAlpha = Math.min(1, a * top);
        ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
    }
    this.rects.forEach((r, k) => {
      if (!r.length) return;
      ctx.fillStyle = ink.line((top * (k + 0.5)) / 8);
      for (let i = 0; i < r.length; i += 3) ctx.fillRect(r[i] ?? 0, r[i + 1] ?? 0, r[i + 2] ?? 1, r[i + 2] ?? 1);
    });
    if (this.dark.length) {
      ctx.fillStyle = ink.ground(0.5 * top);
      for (let i = 0; i < this.dark.length; i += 3)
        ctx.fillRect(this.dark[i] ?? 0, this.dark[i + 1] ?? 0, this.dark[i + 2] ?? 1, this.dark[i + 2] ?? 1);
    }
  }
}
