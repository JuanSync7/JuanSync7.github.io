import { Box3, Euler, Matrix4, Vector3, type BufferGeometry } from 'three';
import { arrow, chain, dimLines, hatch, sectionAt, symbolLines, type P2 } from './draftlines';
import { leadingEdge, sketchGeometry, type SketchPart } from './legosketch';
import { LEGO_SKETCHES, type Sketch } from './legosketches';

/** The layout of a sketch's drawing (kit/legodraft draws it): first-angle orthographic views
 *  (side elevation; end elevation from the nose on its right; plan below it), section A-A at
 *  twice the drawing's scale, an exploded isometric view and the projection symbol, laid out on
 *  A3 at a standard scale. Every size is a variable (L1, H1, W1, C1 …), named on the drawing and
 *  valued in its table. Units are studs, y down, the drawing area's top left at the origin. */

export type DraftView = 'side' | 'end' | 'plan' | 'exploded';
/** A word on the drawing, at a point given in fractions of the drawing area; `at` is the side of
 *  the point the word sits on. Pages set these as DOM, the review sheet on its canvas. */
export interface Label {
  text: string;
  x: number;
  y: number;
  at: 'above' | 'below' | 'left' | 'right';
}
export interface Variable {
  sym: string;
  what: string;
  studs: number;
  mm: number;
}
export interface Layout {
  sketch: Sketch;
  /** The drawing area's size in studs (its shape is AREA's), and the scale it prints at on A3. */
  w: number;
  h: number;
  scale: number;
  labels: Label[];
  variables: Variable[];
}

/** An A3 sheet, landscape, in mm (ISO 5457): a 20 mm filing margin on the left, 10 mm elsewhere,
 *  and the title block's strip along the bottom. The drawing area is what is left above it. */
export const A3 = { w: 420, h: 297, left: 20, edge: 10, block: 40 };
export const AREA = { w: A3.w - A3.left - A3.edge, h: A3.h - 2 * A3.edge - A3.block };
const SCALES = [1, 2, 5, 10, 20, 50, 100, 200];
/** Section A-A is drawn this many times larger than the views. */
const DETAIL = 2;
export const VIEWS: DraftView[] = ['side', 'end', 'plan', 'exploded'];
/** Each view turns the model so that view faces a camera looking down -z, y up. */
export const TURN: Record<DraftView, Matrix4> = {
  side: new Matrix4(),
  plan: new Matrix4().makeRotationX(Math.PI / 2),
  end: new Matrix4().makeRotationY(Math.PI / 2),
  exploded: new Matrix4().makeRotationFromEuler(new Euler(Math.atan(Math.SQRT1_2), Math.PI / 4, 0, 'XYZ')),
};

/** The parts a drawing shows: every part that is not context. */
export const partsOf = (s: Sketch): SketchPart[] => s.parts.filter((p) => !p.context);

export interface Plan {
  layout: Layout;
  /** Per view: the turned model's box (exploded for that view) and where its centre goes. */
  at: Record<DraftView, { box: Box3; x: number; y: number }>;
  /** Line work as segment end points in pairs: thin (dimensions, centre and cutting lines,
   *  hatching, symbol) and thick (the section's outline), as ISO 128 weighs them. */
  thin: P2[];
  thick: P2[];
}

function boxOf(geos: BufferGeometry[], t: Matrix4): Box3 {
  return geos.reduce((b, g) => {
    const turned = g.clone().applyMatrix4(t);
    turned.computeBoundingBox();
    if (turned.boundingBox) b.union(turned.boundingBox);
    turned.dispose();
    return b;
  }, new Box3());
}

export function plan(id: string): Plan {
  const sketch = LEGO_SKETCHES[id];
  if (!sketch) throw new Error(`lego: no sketch ${id}`);
  const parts = partsOf(sketch);
  const geos = parts.map(sketchGeometry);
  const apart = parts.map((p, k) => (geos[k] as BufferGeometry).clone().translate(...(p.explode ?? [0, 0, 0])));
  const boxes = Object.fromEntries(VIEWS.map((v) => [v, boxOf(v === 'exploded' ? apart : geos, TURN[v])]));
  const model = boxOf(geos, new Matrix4());
  const section = sectionAt(geos, sketch.cut + 1e-3);
  [...geos, ...apart].forEach((g) => g.dispose());
  const size = (v: DraftView): Vector3 => (boxes[v] as Box3).getSize(new Vector3());
  const [S, E, P, X] = [size('side'), size('end'), size('plan'), size('exploded')];
  const xs = section.map(([x]) => x);
  const ys = section.map(([, y]) => y);
  const sec = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
  const [secW, secH] = [DETAIL * (Math.max(...xs) - Math.min(...xs)), DETAIL * (Math.max(...ys) - Math.min(...ys))];
  const m = Math.max(S.x, S.y, E.x, P.y);
  const [gap, pad, sym] = [0.26 * m, 0.12 * m, 0.14 * m];
  const cols = [S.x, Math.max(E.x, X.x), Math.max(secW, 1.8 * sym)];
  const rows = [Math.max(S.y, E.y, secH), Math.max(P.y, X.y)];
  const [c0 = 0, c1 = 0, c2 = 0, r0 = 0, r1 = 0] = [...cols, ...rows];
  let w = pad + c0 + gap + c1 + gap + c2 + pad;
  let h = pad + r0 + gap + r1 + pad;
  let [ox, oy] = [0, 0];
  const aspect = AREA.w / AREA.h;
  if (w / h < aspect) [ox, w] = [(h * aspect - w) / 2, h * aspect];
  else [oy, h] = [(w / aspect - h) / 2, w / aspect];
  // Grow the margins until the drawing prints at a standard scale.
  const real = (w * sketch.scale * 1000) / AREA.w;
  const scale = SCALES.find((n) => n >= real) ?? Math.ceil(real);
  const f = scale / real;
  [ox, oy, w, h] = [ox + (w * f - w) / 2, oy + (h * f - h) / 2, w * f, h * f];
  const [x0, x1, x2] = [ox + pad + c0 / 2, ox + pad + c0 + gap + c1 / 2, ox + pad + c0 + gap + c1 + gap + c2 / 2];
  const [y0, y1] = [oy + pad + r0 / 2, oy + pad + r0 + gap + r1 / 2];
  const at = {
    side: { box: boxes.side as Box3, x: x0, y: y0 },
    end: { box: boxes.end as Box3, x: x1, y: y0 },
    plan: { box: boxes.plan as Box3, x: x0, y: y1 },
    exploded: { box: boxes.exploded as Box3, x: x1, y: y1 },
  };
  const draw = (v: DraftView, p: Vector3): P2 => {
    const q = p.clone().applyMatrix4(TURN[v]);
    const c = at[v].box.getCenter(new Vector3());
    return [at[v].x + q.x - c.x, at[v].y - (q.y - c.y)];
  };
  const secDraw = ([x, y]: P2): P2 => [x2 + DETAIL * (x - sec.x), y0 - DETAIL * (y - sec.y)];
  const labels: Label[] = [];
  const label = (text: string, [x, y]: P2, side: Label['at']): void => void labels.push({ text, x: x / w, y: y / h, at: side }); // prettier-ignore
  const variables: Variable[] = [];
  const thin: P2[] = [];
  const d = 0.16 * m;
  const dim = (sym: string, what: string, a: P2, b: P2, out: P2, side: Label['at'], studs: number): void => {
    thin.push(...dimLines(a, b, out, m));
    label(sym, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], side);
    variables.push({ sym, what, studs: Math.round(studs * 100) / 100, mm: Math.round(studs * sketch.scale * 1000) });
  };
  dim('L1', 'Overall length', [x0 - S.x / 2, y0 + S.y / 2 + d], [x0 + S.x / 2, y0 + S.y / 2 + d], [0, d], 'below', S.x);
  dim('H1', 'Overall height', [x0 - S.x / 2 - d, y0 + S.y / 2], [x0 - S.x / 2 - d, y0 - S.y / 2], [-d, 0], 'left', S.y);
  dim('W1', 'Overall span', [x1 - E.x / 2, y0 + E.y / 2 + d], [x1 + E.x / 2, y0 + E.y / 2 + d], [0, d], 'below', E.x);
  // Each element's chord where A-A cuts it, front to back: the first below it, the rest above.
  const foils = parts.flatMap((p) => (p.kind === 'foil' && p.z0 <= sketch.cut && sketch.cut <= p.z1 ? [p] : []));
  foils.sort((a, b) => a.le[0] - b.le[0]);
  foils.forEach((p, k) => {
    const [le, te] = [secDraw(leadingEdge(p, sketch.cut)), secDraw(p.te)];
    const len = Math.hypot(te[0] - le[0], te[1] - le[1]);
    let [nx, ny] = [-(te[1] - le[1]) / len, (te[0] - le[0]) / len];
    if ((k === 0) !== ny > 0) [nx, ny] = [-nx, -ny];
    const off = 0.05 * m;
    const shift = ([x, y]: P2): P2 => [x + nx * off, y + ny * off];
    dim(`C${k + 1}`, `Chord, element ${k + 1}, at A-A`, shift(le), shift(te), [nx * off, ny * off], ny > 0 ? 'below' : 'above', len / DETAIL); // prettier-ignore
  });
  // Centre lines on the plane of symmetry, and the cutting plane A-A with its viewing arrows.
  const [lo, hi, mid, e] = [model.min, model.max, model.getCenter(new Vector3()), 0.05 * m];
  thin.push(...chain(draw('plan', new Vector3(lo.x - e, hi.y, mid.z)), draw('plan', new Vector3(hi.x + e, hi.y, mid.z)), m)); // prettier-ignore
  thin.push(...chain(draw('end', new Vector3(lo.x, lo.y - e, mid.z)), draw('end', new Vector3(lo.x, hi.y + e, mid.z)), m)); // prettier-ignore
  const ends = [lo.x - 3 * e, hi.x + 3 * e].map((x) => draw('plan', new Vector3(x, hi.y, sketch.cut)));
  const [a = [0, 0], b = [0, 0]] = ends;
  thin.push(...chain(a, b, m));
  const look = draw('plan', new Vector3(lo.x, hi.y, sketch.cut - 1));
  const there = draw('plan', new Vector3(lo.x, hi.y, sketch.cut));
  const [ux, uy] = [(look[0] - there[0]) / Math.hypot(look[0] - there[0], look[1] - there[1]), (look[1] - there[1]) / Math.hypot(look[0] - there[0], look[1] - there[1])]; // prettier-ignore
  for (const end of ends) {
    const tip: P2 = [end[0] + ux * 2 * e, end[1] + uy * 2 * e];
    thin.push(end, tip, ...arrow(tip, ux, uy, m));
    label('A', tip, uy < 0 ? 'above' : 'below');
  }
  // The section's outline, hatched, and the symbol.
  const thick = section.map(secDraw);
  thin.push(...hatch(thick, 0.012 * m));
  const sx = x2 + c2 / 2;
  const sy = y1 + r1 / 2;
  thin.push(...symbolLines(sx - 1.8 * sym, sy - sym, sx, sy));
  label('First angle', [sx - 0.9 * sym, sy], 'below');
  label(`Scale 1:${scale}`, [sx - 0.9 * sym, sy - sym], 'above');
  label('Side elevation', [x0, y0 - S.y / 2], 'above');
  label('End elevation', [x1, y0 - E.y / 2], 'above');
  label(`Section A-A (1:${scale / DETAIL})`, [x2, y0 + secH / 2 + 0.12 * m], 'below');
  label('Plan', [x0, y1 + P.y / 2], 'below');
  label('Exploded isometric', [x1, y1 + X.y / 2], 'below');
  return { layout: { sketch, w, h, scale, labels, variables }, at, thin, thick };
}

/** Where the drawing's words go, and its variables. */
export const draftLayout = (id: string): Layout => plan(id).layout;

/** ISO 7200's title block, as rows of [field, value, width in mm] across its 180 mm: the eight
 *  mandatory fields, the identification number bottom right, and no scale or projection (they sit
 *  by the projection symbol). The approval person stays empty until a person approves it. */
export function titleFields(l: Layout): [string, string, number][][] {
  const s = l.sketch;
  return [
    [
      ['Title', s.title, 120],
      ['Document type', 'General arrangement', 60],
    ],
    [
      ['Creator', 'Claude', 45],
      ['Approval person', '-', 45],
      ['Document status', 'In work', 45],
      ['Paper', 'A3', 45],
    ],
    [['Legal owner', 'Juan Kok', 50], ['Date of issue', s.drawn, 40], ['Rev', s.revision, 15], ['Sheet', '1/1', 20], ['Identification no.', s.number, 55]], // prettier-ignore
  ];
}
