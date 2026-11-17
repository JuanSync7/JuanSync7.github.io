// One source: the experience vault's Playbooks/drawing/kernel. A project's copy is synced from it, never edited.
import { hexOf } from './host';
import { A3, AREA } from './plan';
import { WEIGHT } from './scene';

/** An A3 drawing sheet on a 2D canvas, shared by every review sheet that is an engineering
 *  drawing (a part's drawing, its parts list, or a project's own sheet such as a component's blueprint): the ISO 5457 frame, grid
 *  reference border and centring marks, an ISO 7200 title block, notes, and words in the ISO 3098
 *  lettering ('ISO Lettering B', capital height 0.7 of the font size). Units: `mm` canvas pixels
 *  per paper millimetre. */

type Ctx = CanvasRenderingContext2D;

export function text(
  ctx: Ctx,
  s: string,
  x: number,
  y: number,
  size: number,
  align: CanvasTextAlign = 'left',
  angle = 0,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  // `size` is the capital height; the lettering's capitals stand 0.7 of the font size.
  ctx.font = `${size / 0.7}px 'ISO Lettering B', monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, 0, 0);
  ctx.restore();
}

/** The title block: 180 mm wide along the bottom right, in rows of [field, value, width mm]. */
export function titleBlock(ctx: Ctx, rows: [string, string, number][][], mm: number): void {
  const [x0, y0] = [(A3.w - A3.edge - 180) * mm, (A3.h - A3.edge - A3.block) * mm];
  const rh = [16, 12, 12];
  let y = y0;
  rows.forEach((row, r) => {
    const h = (rh[r] ?? 12) * mm;
    let x = x0;
    row.forEach(([field, value, cw]) => {
      ctx.strokeRect(x, y, cw * mm, h);
      text(ctx, field.toUpperCase(), x + 1.5 * mm, y + 2.5 * mm, 1.8 * mm);
      // ISO 3098 heights: 5 for the title, 3.5 for the rest, down the series until it fits its cell.
      const room = (cw - 3) * mm;
      const fits = (hmm: number): boolean => {
        ctx.font = `${(hmm * mm) / 0.7}px 'ISO Lettering B', monospace`;
        return ctx.measureText(value.toUpperCase()).width <= room;
      };
      const hmm = [r === 0 && x === x0 ? 5 : 3.5, 2.5, 1.8].find(fits) ?? 1.8;
      text(ctx, value.toUpperCase(), x + 1.5 * mm, y + h * 0.62, hmm * mm);
      x += cw * mm;
    });
    y += h;
  });
}

/** ISO 5457's grid reference border: fields 50 mm long from the sheet's centre lines, numbered
 *  along the long side and lettered (no I or O) up the short side, in a 5 mm strip outside the
 *  frame, and a centring mark at the middle of each edge reaching 10 mm into the drawing. */
function gridBorder(ctx: Ctx, mm: number): void {
  const [fx0, fy0, fx1, fy1] = [A3.left, A3.edge, A3.w - A3.edge, A3.h - A3.edge];
  const [gx0, gy0, gx1, gy1] = [fx0 - 5, fy0 - 5, fx1 + 5, fy1 + 5];
  ctx.strokeRect(gx0 * mm, gy0 * mm, (gx1 - gx0) * mm, (gy1 - gy0) * mm);
  const cuts = (c: number, lo: number, hi: number): number[] => {
    const out = [lo];
    // A part-field under 25 mm at an end joins its neighbour.
    for (let v = c - 50 * Math.floor((c - lo) / 50); v < hi - 25; v += 50) if (v > lo + 25) out.push(v);
    return [...out, hi];
  };
  const xs = cuts(A3.w / 2, gx0, gx1);
  const ys = cuts(A3.h / 2, gy0, gy1);
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  ctx.beginPath();
  xs.slice(1, -1).forEach((x) => [[gy0, fy0], [fy1, gy1]].forEach(([a = 0, b = 0]) => (ctx.moveTo(x * mm, a * mm), ctx.lineTo(x * mm, b * mm)))); // prettier-ignore
  ys.slice(1, -1).forEach((y) => [[gx0, fx0], [fx1, gx1]].forEach(([a = 0, b = 0]) => (ctx.moveTo(a * mm, y * mm), ctx.lineTo(b * mm, y * mm)))); // prettier-ignore
  ctx.stroke();
  xs.slice(0, -1).forEach((x, k) => {
    const cx = ((x + (xs[k + 1] ?? x)) / 2) * mm;
    [gy0 + 2.5, fy1 + 2.5].forEach((y) => text(ctx, String(k + 1), cx, y * mm, 3.5 * mm, 'center'));
  });
  ys.slice(0, -1).forEach((y, k) => {
    const cy = ((y + (ys[k + 1] ?? y)) / 2) * mm;
    [gx0 + 2.5, fx1 + 2.5].forEach((x) => text(ctx, letters[k] ?? '', x * mm, cy, 3.5 * mm, 'center'));
  });
  ctx.save();
  ctx.lineWidth *= 2;
  ctx.beginPath();
  const [mx, my] = [A3.w / 2, A3.h / 2];
  const marks = [[mx, gy0, mx, fy0 + 10], [mx, gy1, mx, fy1 - 10], [gx0, my, fx0 + 10, my], [gx1, my, fx1 - 10, my]]; // prettier-ignore
  for (const [x0 = 0, y0 = 0, x1 = 0, y1 = 0] of marks) {
    ctx.moveTo(x0 * mm, y0 * mm);
    ctx.lineTo(x1 * mm, y1 * mm);
  }
  ctx.stroke();
  ctx.restore();
}

export interface Sheet {
  canvas: HTMLCanvasElement;
  ctx: Ctx;
  mm: number;
  /** The drawing area's top left, in canvas pixels. */
  ax: number;
  ay: number;
}

/** A blank sheet `width` pixels wide: the ground, the frame and the grid border, thin lines and
 *  ink set for drawing on. */
export function sheet(width: number): Sheet {
  const mm = width / A3.w;
  const canvas = document.createElement('canvas');
  [canvas.width, canvas.height] = [width, Math.round(A3.h * mm)];
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('sheet: no 2d context');
  ctx.fillStyle = hexOf('ground');
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const [ax, ay] = [A3.left * mm, A3.edge * mm];
  ctx.strokeStyle = hexOf('inkSoft');
  ctx.lineWidth = 0.7 * mm; // ISO 5457: the frame is at least 0.7 mm
  ctx.strokeRect(ax, ay, (A3.w - A3.left - A3.edge) * mm, (A3.h - 2 * A3.edge) * mm);
  ctx.lineWidth = WEIGHT.thin * mm;
  ctx.fillStyle = hexOf('ink2');
  gridBorder(ctx, mm);
  return { canvas, ctx, mm, ax, ay };
}

/** Numbered notes in the strip left of the title block. */
export function notes(s: Sheet, lines: string[]): void {
  const top = A3.h - A3.edge - A3.block;
  ['NOTES', ...lines.map((n, k) => `${k + 1}. ${n.toUpperCase()}`)].forEach((n, k) =>
    text(s.ctx, n, s.ax + 4 * s.mm, (top + 5 + k * 7) * s.mm, 2.5 * s.mm),
  );
}

export { AREA };
