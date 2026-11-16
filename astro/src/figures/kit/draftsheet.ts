import { Color, OrthographicCamera, Scene, WebGLRenderer } from 'three';
import { hexOf } from './ink';
import { A3, AREA, draftScene, titleFields, WEIGHT, type Layout } from './legodraft';

/** A sketch's drawing on a whole A3 sheet, for review (`npm run lego:sheet -- <sketch> drawing`):
 *  the frame, the drawing (kit/legodraft) in its area, and the words a page would set as DOM:
 *  the layout's labels, the notes, the table of variables and the title block. */

type Ctx = CanvasRenderingContext2D;

function text(
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
  ctx.font = `${size}px monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, 0, 0);
  ctx.restore();
}

/** The title block: 180 mm wide along the bottom right, in rows of cells. */
function titleBlock(ctx: Ctx, l: Layout, mm: number): void {
  const [x0, y0] = [(A3.w - A3.edge - 180) * mm, (A3.h - A3.edge - A3.block) * mm];
  const rh = [16, 12, 12];
  let y = y0;
  titleFields(l).forEach((row, r) => {
    const h = (rh[r] ?? 12) * mm;
    let x = x0;
    row.forEach(([field, value, cw]) => {
      ctx.strokeRect(x, y, cw * mm, h);
      text(ctx, field.toUpperCase(), x + 1.5 * mm, y + 2.5 * mm, 1.8 * mm);
      text(ctx, value.toUpperCase(), x + 1.5 * mm, y + h * 0.62, (r === 0 ? 5 : 3.5) * mm);
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

/** The variables: symbol, meaning, studs, real mm and LEGO mm, one row each. */
function variableTable(ctx: Ctx, l: Layout, x0: number, y0: number, mm: number): void {
  const cols: [string, number][] = [['SYM', 12], ['WHAT', 44], ['STUDS', 16], ['REAL MM', 16], ['LEGO MM', 16]]; // prettier-ignore
  const rows = [cols.map(([c]) => c), ...l.variables.map((v) => [v.sym, v.what.toUpperCase(), v.studs.toFixed(2), String(v.mm), String(Math.round(v.studs * 8))])]; // prettier-ignore
  const rh = A3.block / Math.max(rows.length, 7);
  rows.forEach((row, r) => {
    let x = x0;
    row.forEach((cell, c) => {
      const cw = (cols[c]?.[1] ?? 10) * mm;
      ctx.strokeRect(x, y0 + r * rh * mm, cw, rh * mm);
      text(ctx, cell, x + 1.5 * mm, y0 + (r + 0.5) * rh * mm, Math.min(2.5, rh * 0.5) * mm);
      x += cw;
    });
  });
}

/** The whole sheet as a PNG data URL, `width` pixels wide. */
export function drawingSheet(id: string, width = 2400): string {
  const mm = width / A3.w;
  const disposers: (() => void)[] = [];
  const { group, layout, fit } = draftScene(id, (d) => void disposers.push(d));
  const [aw, ah] = [Math.round(AREA.w * mm), Math.round(AREA.h * mm)];
  const r = new WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
  r.setClearColor(new Color(0x000000), 0);
  r.setSize(aw, ah);
  fit(aw, ah);
  const scene = new Scene().add(group);
  const cam = new OrthographicCamera(0, layout.w, 0, -layout.h, 0.1, 400);
  cam.position.set(0, 0, 200);
  r.render(scene, cam);
  const out = document.createElement('canvas');
  [out.width, out.height] = [width, Math.round(A3.h * mm)];
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('lego: no 2d context');
  ctx.fillStyle = hexOf('ground');
  ctx.fillRect(0, 0, out.width, out.height);
  const [ax, ay] = [A3.left * mm, A3.edge * mm];
  ctx.drawImage(r.domElement, ax, ay);
  ctx.strokeStyle = hexOf('inkSoft');
  ctx.lineWidth = 0.7 * mm; // ISO 5457: the frame is at least 0.7 mm
  ctx.strokeRect(ax, ay, (A3.w - A3.left - A3.edge) * mm, (A3.h - 2 * A3.edge) * mm);
  ctx.lineWidth = WEIGHT.thin * mm;
  ctx.fillStyle = hexOf('ink2');
  titleBlock(ctx, layout, mm);
  gridBorder(ctx, mm);
  const at = (fx: number, fy: number): [number, number] => [ax + fx * aw, ay + fy * ah];
  const size = 3.5 * mm;
  const nudge = { above: [0, -1], below: [0, 1], left: [-1, 0], right: [1, 0] } as const;
  for (const l of layout.labels) {
    const [x, y] = at(l.x, l.y);
    const [dx, dy] = nudge[l.at];
    const align = l.at === 'left' ? 'right' : l.at === 'right' ? 'left' : 'center';
    text(ctx, l.text.toUpperCase(), x + dx * 2.5 * mm, y + dy * (1.5 * mm + size / 2), size, align);
  }
  const top = A3.h - A3.edge - A3.block;
  const notes = [
    'NOTES',
    '1. SIZES ARE VARIABLES. VALUES IN THE TABLE.',
    `2. 1 STUD = ${Math.round(layout.sketch.scale * 1000)} MM REAL, 8 MM IN LEGO.`,
    '3. HIDDEN EDGES DASHED. CENTRE LINES CHAIN.',
    '4. FROM THE RULES AS REPORTED. NO PHOTO TRACED.',
  ];
  notes.forEach((n, k) => text(ctx, n, ax + 4 * mm, (top + 5 + k * 7) * mm, 2.5 * mm));
  variableTable(ctx, layout, (A3.left + 80) * mm, top * mm, mm);
  const url = out.toDataURL('image/png');
  disposers.forEach((d) => d());
  r.dispose();
  return url;
}
