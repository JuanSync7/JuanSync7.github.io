import type { Sketch, Tone } from './sketch';

/** A pen in a piece's own frame: (x, y) in metres from its centre, turned by `turn`
 *  quarter turns, placed at (cx, cy). */
export class Piece {
  constructor(
    private readonly S: Sketch,
    private readonly cx: number,
    private readonly cy: number,
    private readonly turn: number,
    private readonly m: number,
  ) {}
  private at(x: number, y: number): [number, number] {
    const [u, v] = [
      [x, y],
      [-y, x],
      [-x, -y],
      [y, -x],
    ][((this.turn % 4) + 4) % 4] ?? [x, y];
    return [this.cx + u * this.m, this.cy + v * this.m];
  }
  seg(x0: number, y0: number, x1: number, y1: number, t: Tone = 2): void {
    const [a, b] = [this.at(x0, y0), this.at(x1, y1)];
    this.S.seg(a[0], a[1], b[0], b[1], t);
  }
  rect(x0: number, y0: number, x1: number, y1: number, t: Tone = 2): void {
    this.seg(x0, y0, x1, y0, t);
    this.seg(x1, y0, x1, y1, t);
    this.seg(x1, y1, x0, y1, t);
    this.seg(x0, y1, x0, y0, t);
  }
  circle(x: number, y: number, r: number, t: Tone = 2, a0 = 0, a1 = Math.PI * 2): void {
    const n = r > 0.3 ? 16 : 10;
    for (let i = 0; i < n; i++) {
      const [a, b] = [a0 + ((a1 - a0) * i) / n, a0 + ((a1 - a0) * (i + 1)) / n];
      this.seg(x + Math.cos(a) * r, y + Math.sin(a) * r, x + Math.cos(b) * r, y + Math.sin(b) * r, t);
    }
  }
}
