/** Pixel art: draw on a small grid of cells, then show it with hard edges. A figure
 *  keeps a low-resolution grid and paints whole cells; nothing is anti-aliased. */

/** The 4 × 4 ordered-dither (Bayer) thresholds, in 0..1. Tones are made with patterns
 *  of on and off cells, never with in-between colours. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

export function bayer(x: number, y: number): number {
  return BAYER[(y & 3) * 4 + (x & 3)] ?? 0.5;
}

export interface PixelGrid {
  cols: number;
  rows: number;
  /** Size of one cell in canvas pixels, a whole number. */
  cell: number;
  /** Offsets that centre the grid in the canvas. */
  ox: number;
  oy: number;
}

/** The largest whole-pixel cell that fits `cols` × `rows` into w × h. */
export function pixelGrid(w: number, h: number, cols: number, rows: number): PixelGrid {
  const cell = Math.max(1, Math.floor(Math.min(w / cols, h / rows)));
  return { cols, rows, cell, ox: Math.floor((w - cols * cell) / 2), oy: Math.floor((h - rows * cell) / 2) };
}

/** Paints one cell. Gaps of a pixel between cells keep the grid readable when `gap` is set. */
export function cell(ctx: CanvasRenderingContext2D, g: PixelGrid, x: number, y: number, style: string, gap = 0): void {
  if (x < 0 || y < 0 || x >= g.cols || y >= g.rows) return;
  ctx.fillStyle = style;
  ctx.fillRect(g.ox + x * g.cell, g.oy + y * g.cell, g.cell - gap, g.cell - gap);
}

/** Paints a cell only where a tone in 0..1 beats the dither threshold. */
export function dither(
  ctx: CanvasRenderingContext2D,
  g: PixelGrid,
  x: number,
  y: number,
  value: number,
  style: string,
  gap = 0,
): void {
  if (value > bayer(x, y)) cell(ctx, g, x, y, style, gap);
}
