import { Color, OrthographicCamera, Scene, WebGLRenderer } from 'three';
import { AREA, draftScene, titleFields } from './legodraft';
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
    'Proportions from the rules as reported. No photograph traced.',
  ]);
  const url = s.canvas.toDataURL('image/png');
  disposers.forEach((d) => d());
  r.dispose();
  return url;
}
