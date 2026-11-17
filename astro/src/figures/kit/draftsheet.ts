import { Color, OrthographicCamera, Scene, WebGLRenderer } from 'three';
import { AREA, draftScene, titleFields } from './legodraft';
import { DOC } from './draftplan';
import { itemsOf, LEGO_SKETCHES } from './legosketches';
import { notes, sheet, text, titleBlock } from './sheetframe';

/** A sketch's drawing on a whole A3 sheet, for review (`npm run lego:sheet -- <sketch> drawing`):
 *  the frame (kit/sheetframe), the drawing (kit/legodraft) in its area, and the words a page
 *  would set as DOM: the layout's labels, the notes and the title block. */

/** The whole sheet as a PNG data URL, `width` pixels wide. */
export function drawingSheet(id: string, width = 2400): string {
  const s = sheet(width);
  const { ctx, mm, ax, ay } = s;
  const disposers: (() => void)[] = [];
  const { group, layout, fit } = draftScene(id, (d) => void disposers.push(d));
  const [aw, ah] = [Math.round(AREA.w * mm), Math.round(AREA.h * mm)];
  const r = new WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
  r.setClearColor(new Color(0x000000), 0);
  r.setSize(aw, ah);
  fit(aw, ah);
  const cam = new OrthographicCamera(0, layout.w, 0, -layout.h, 0.1, 400);
  cam.position.set(0, 0, 200);
  r.render(new Scene().add(group), cam);
  ctx.drawImage(r.domElement, ax, ay);
  titleBlock(ctx, titleFields(layout), mm);
  const at = (fx: number, fy: number): [number, number] => [ax + fx * aw, ay + fy * ah];
  const size = 3.5 * mm;
  const nudge = { above: [0, -1], below: [0, 1], left: [-1, 0], right: [1, 0], centre: [0, 0] } as const;
  for (const l of layout.labels) {
    const [x, y] = at(l.x, l.y);
    const [dx, dy] = nudge[l.at];
    const align = l.at === 'left' ? 'right' : l.at === 'right' ? 'left' : 'center';
    const turn = ((l.angle ?? 0) * Math.PI) / 180;
    text(ctx, l.text.toUpperCase(), x + dx * 2.5 * mm, y + dy * (1.5 * mm + size / 2), size, align, turn);
  }
  notes(s, [
    'Dimensions in mm, full size of the real part.',
    `1 stud = ${Math.round(layout.sketch.scale * 1000)} mm real, 8 mm in LEGO.`,
    ...layout.sketch.notes,
  ]);
  const url = s.canvas.toDataURL('image/png');
  disposers.forEach((d) => d());
  r.dispose();
  return url;
}

/** A general arrangement's second sheet: its parts list (ISO 7573), one row per item, read from
 *  the top, each naming the drawing that details it. */
export function partsListSheet(id: string, width = 2400): string {
  const sketch = LEGO_SKETCHES[id];
  if (!sketch) throw new Error(`lego: no sketch ${id}`);
  const s = sheet(width);
  const { ctx, mm, ax, ay } = s;
  const layout = { sketch, w: 0, h: 0, scale: 1, labels: [] };
  titleBlock(ctx, titleFields(layout, 2), mm);
  const cols: [string, number][] = [['Item', 15], ['Title', 140], ['Qty', 15], ['Drawing no.', 50], ['Rev', 15], ['Document type', 60]]; // prettier-ignore
  const rows = itemsOf(sketch).map(({ item, sketch: p, qty }) => [String(item), p.title, String(qty), p.number, p.revision, DOC[p.doc]]); // prettier-ignore
  const [x0, y0, rh] = [ax + 10 * mm, ay + 10 * mm, 8 * mm];
  [cols.map(([c]) => c), ...rows].forEach((row, r) => {
    let x = x0;
    row.forEach((cell, c) => {
      const cw = (cols[c]?.[1] ?? 20) * mm;
      ctx.strokeRect(x, y0 + r * rh, cw, rh);
      text(ctx, cell.toUpperCase(), x + 2 * mm, y0 + r * rh + rh / 2, (r ? 3.5 : 2.5) * mm);
      x += cw;
    });
  });
  notes(s, ['Items as numbered on sheet 1.', 'Quantities are per car.']);
  return s.canvas.toDataURL('image/png');
}
