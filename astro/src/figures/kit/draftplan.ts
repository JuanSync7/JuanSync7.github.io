import { Box3, Matrix4, Vector3, type BufferGeometry } from 'three';
import {
  AREA,
  boxOf,
  dimmer,
  DOC,
  SCALES,
  TURN,
  VIEWS,
  type DraftView,
  type Label,
  type Layout,
  type Plan,
} from './draftbase';
import { gaPlan } from './draftga';
import { arrow, chain, hatch, sectionAt, symbolLines, type P2 } from './draftlines';
import { leadingEdge, sketchGeometry } from './legosketch';
import { LEGO_SKETCHES, partsOf, type Sketch } from './legosketches';

export { A3, AREA, DOC, TURN, VIEWS, type DraftView, type Label, type Layout, type Plan } from './draftbase';
export { partsOf } from './legosketches';

/** The layout of a sketch's drawing (kit/legodraft draws it). A general arrangement is laid out
 *  by kit/draftga; a part or an assembly here: first-angle orthographic views (side elevation;
 *  end elevation from the nose on its right; plan below it), section A-A at twice the drawing's
 *  scale where the sketch has a cut, an exploded isometric view and the projection symbol, on A3
 *  at a standard scale. Sizes are dimensioned as ISO 129-1 does it. */

/** Section A-A is drawn this many times larger than the views. */
const DETAIL = 2;

export function plan(id: string): Plan {
  const sketch = LEGO_SKETCHES[id];
  if (!sketch) throw new Error(`lego: no sketch ${id}`);
  return sketch.doc === 'ga' ? gaPlan(sketch) : partPlan(sketch);
}

function partPlan(sketch: Sketch): Plan {
  const parts = partsOf(sketch);
  const geos = parts.map(sketchGeometry);
  const apart = parts.map((p, k) => (geos[k] as BufferGeometry).clone().translate(...(p.explode ?? [0, 0, 0])));
  const boxes = Object.fromEntries(VIEWS.map((v) => [v, boxOf(v === 'exploded' ? apart : geos, TURN[v])]));
  const model = boxOf(geos, new Matrix4());
  const cut = sketch.cut;
  const section = cut === undefined ? [] : sectionAt(geos, cut + 1e-3);
  [...geos, ...apart].forEach((g) => g.dispose());
  const size = (v: DraftView): Vector3 => (boxes[v] as Box3).getSize(new Vector3());
  const [S, E, P, X] = [size('side'), size('end'), size('plan'), size('exploded')];
  const xs = section.length ? section.map(([x]) => x) : [0];
  const ys = section.length ? section.map(([, y]) => y) : [0];
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
    side: { box: boxes.side as Box3, x: x0, y: y0, k: 1 },
    end: { box: boxes.end as Box3, x: x1, y: y0, k: 1 },
    plan: { box: boxes.plan as Box3, x: x0, y: y1, k: 1 },
    exploded: { box: boxes.exploded as Box3, x: x1, y: y1, k: 1 },
  };
  const draw = (v: DraftView, p: Vector3): P2 => {
    const q = p.clone().applyMatrix4(TURN[v]);
    const c = at[v].box.getCenter(new Vector3());
    return [at[v].x + q.x - c.x, at[v].y - (q.y - c.y)];
  };
  const secDraw = ([x, y]: P2): P2 => [x2 + DETAIL * (x - sec.x), y0 - DETAIL * (y - sec.y)];
  const labels: Label[] = [];
  const label = (text: string, [x, y]: P2, side: Label['at']): void => void labels.push({ text, x: x / w, y: y / h, at: side }); // prettier-ignore
  const thin: P2[] = [];
  const d = 0.16 * m;
  // Paper millimetres in drawing units: arrowheads 3, extension gap 1 and overshoot 2, text 3.5 high.
  const pmm = w / AREA.w;
  const dim = dimmer(sketch, w, h, pmm, thin, labels);
  dim([x0 - S.x / 2, y0 + S.y / 2 + d], [x0 + S.x / 2, y0 + S.y / 2 + d], [0, 1], d, S.x);
  dim([x0 - S.x / 2 - d, y0 + S.y / 2], [x0 - S.x / 2 - d, y0 - S.y / 2], [-1, 0], d, S.y);
  dim([x1 - E.x / 2, y0 + E.y / 2 + d], [x1 + E.x / 2, y0 + E.y / 2 + d], [0, 1], d, E.x);
  // Each element's chord where A-A cuts it, front to back: the first below it, the rest above.
  const foils = parts.flatMap((p) => (cut !== undefined && p.kind === 'foil' && p.z0 <= cut && cut <= p.z1 ? [p] : []));
  foils.sort((a, b) => a.le[0] - b.le[0]);
  foils.forEach((p, k) => {
    const [le, te] = [secDraw(leadingEdge(p, cut ?? 0)), secDraw(p.te)];
    const len = Math.hypot(te[0] - le[0], te[1] - le[1]);
    let [nx, ny] = [-(te[1] - le[1]) / len, (te[0] - le[0]) / len];
    if ((k === 0) !== ny > 0) [nx, ny] = [-nx, -ny];
    const off = (p.t + p.camber) * len + 8 * pmm; // clear of the profile, with room for the value
    const shift = ([x, y]: P2): P2 => [x + nx * off, y + ny * off];
    dim(shift(le), shift(te), [nx, ny], off, len / DETAIL);
  });
  // Centre lines on the plane of symmetry, and the cutting plane A-A with its viewing arrows.
  const [lo, hi, mid, e] = [model.min, model.max, model.getCenter(new Vector3()), 0.05 * m];
  thin.push(...chain(draw('plan', new Vector3(lo.x - e, hi.y, mid.z)), draw('plan', new Vector3(hi.x + e, hi.y, mid.z)), m)); // prettier-ignore
  thin.push(...chain(draw('end', new Vector3(lo.x, lo.y - e, mid.z)), draw('end', new Vector3(lo.x, hi.y + e, mid.z)), m)); // prettier-ignore
  const thick: P2[] = [];
  if (cut !== undefined) {
    const ends = [lo.x - 3 * e, hi.x + 3 * e].map((x) => draw('plan', new Vector3(x, hi.y, cut)));
    const [a = [0, 0], b = [0, 0]] = ends;
    thin.push(...chain(a, b, m));
    // ISO 128-44: the cutting plane is thick where it ends.
    const [cx, cy] = [(b[0] - a[0]) / Math.hypot(b[0] - a[0], b[1] - a[1]), (b[1] - a[1]) / Math.hypot(b[0] - a[0], b[1] - a[1])]; // prettier-ignore
    const ticks: P2[] = [a, [a[0] + cx * 5 * pmm, a[1] + cy * 5 * pmm], b, [b[0] - cx * 5 * pmm, b[1] - cy * 5 * pmm]];
    const look = draw('plan', new Vector3(lo.x, hi.y, cut - 1));
    const there = draw('plan', new Vector3(lo.x, hi.y, cut));
    const [ux, uy] = [(look[0] - there[0]) / Math.hypot(look[0] - there[0], look[1] - there[1]), (look[1] - there[1]) / Math.hypot(look[0] - there[0], look[1] - there[1])]; // prettier-ignore
    for (const end of ends) {
      const tip: P2 = [end[0] + ux * 2 * e, end[1] + uy * 2 * e];
      thin.push(end, tip, ...arrow(tip, ux, uy, 3 * pmm));
      label('A', tip, uy < 0 ? 'above' : 'below');
    }
    // The section's outline, hatched.
    thick.push(...section.map(secDraw), ...ticks);
    thin.push(...hatch(section.map(secDraw), 0.012 * m));
    label(`Section A-A (1:${scale / DETAIL})`, [x2, y0 + secH / 2 + 0.12 * m], 'below');
  }
  const sx = x2 + c2 / 2;
  const sy = y1 + r1 / 2;
  thin.push(...symbolLines(sx - 1.8 * sym, sy - sym, sx, sy));
  label('First angle', [sx - 0.9 * sym, sy], 'below');
  label(`Scale 1:${scale}`, [sx - 0.9 * sym, sy - sym], 'above');
  label('Side elevation', [x0, y0 - S.y / 2], 'above');
  label('End elevation', [x1, y0 - E.y / 2], 'above');
  label('Plan', [x0, y1 + P.y / 2], 'below');
  label(parts.some((p) => p.explode) ? 'Exploded isometric' : 'Isometric', [x1, y1 + X.y / 2], 'below');
  return { layout: { sketch, w, h, scale, labels }, at, thin, thick };
}

/** Where the drawing's words go. */
export const draftLayout = (id: string): Layout => plan(id).layout;

/** ISO 7200's title block, as rows of [field, value, width in mm] across its 180 mm: the eight
 *  mandatory fields, the identification number bottom right, and no scale or projection (they sit
 *  by the projection symbol). The approval person stays empty until a person approves it. A
 *  general arrangement is two sheets of one document: the drawing, then its parts list. */
export function titleFields(l: Layout, sheet = 1): [string, string, number][][] {
  const s = l.sketch;
  const sheets = s.doc === 'ga' ? 2 : 1;
  return [
    [
      ['Title', s.title, 120],
      ['Document type', sheet === 2 ? 'Parts list' : DOC[s.doc], 60],
    ],
    [
      ['Creator', 'Claude', 45],
      ['Approval person', '-', 45],
      ['Document status', 'In work', 45],
      ['Paper', 'A3', 45],
    ],
    [['Legal owner', 'Juan Kok', 50], ['Date of issue', s.drawn, 40], ['Rev', s.revision, 15], ['Sheet', `${sheet}/${sheets}`, 20], ['Identification no.', s.number, 55]], // prettier-ignore
  ];
}
