// One source: the experience vault's Playbooks/drawing/kernel. A project's copy is synced from it, never edited.
import { Box3, Matrix4, Vector3, type BufferGeometry } from 'three';
import {
  AREA,
  boxOf,
  dimmer,
  DOC,
  SCALES,
  titleRows,
  TURN,
  VIEWS,
  type DraftView,
  type Label,
  type Layout,
  type Plan,
} from './base';
import { gaPlan } from './ga';
import { arrow, chain, hatch, sectionAt, symbolLines, type P2 } from './lines';
import { leadingEdge, sketchGeometry } from './parts';
import { SKETCHES } from './host';
import { partsOf, type Sketch } from './sketch';

export {
  A3,
  AREA,
  DOC,
  titleRows,
  TURN,
  type TitleData,
  VIEWS,
  type DraftView,
  type Label,
  type Layout,
  type Plan,
} from './base';
export { partsOf } from './sketch';

/** The layout of a sketch's drawing (scene.ts draws it). A general arrangement is laid out
 *  by ga.ts; a part or an assembly here: first-angle orthographic views (side elevation;
 *  end elevation from the nose on its right; plan below it), section A-A at twice the drawing's
 *  scale where the sketch has a cut, an exploded isometric view and the projection symbol, on A3
 *  at a standard scale. Sizes are dimensioned as ISO 129-1 does it. */

/** Paper millimetres: margin, a view's name, the band under the first row for its lengths, the
 *  gap right of the side elevation (it holds the height), between the other columns and the
 *  rows, the room round the section for its chords, and the projection symbol. */
const MM = { pad: 4, name: 7, dims: 14, gapX: 22, gap: 14, gapY: 8, chords: 28, sym: 9 };

export function plan(id: string): Plan {
  const sketch = SKETCHES[id];
  if (!sketch) throw new Error(`drawing: no sketch ${id}`);
  return sketch.doc === 'ga' ? gaPlan(sketch) : partPlan(sketch);
}

/** Section A-A is drawn larger than the views: at the largest standard scale whose profile fits
 *  120 by 70 mm of paper (`span`: its size in mm at the drawing's scale), at least one step up. */
const detail = (n: number, [w, h]: [number, number]): number => {
  const up = [...SCALES].reverse().filter((m) => m < n);
  const fits = SCALES.filter((m) => m < n).find((m) => (w * n) / m <= 120 && (h * n) / m <= 70);
  return n / (fits ?? up[0] ?? n / 2);
};

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
  const [secW0, secH0] = [Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
  // The largest standard scale the sheet holds, the isometric at a smaller one when it must be.
  const room = section.length ? MM.chords : 0;
  const need = (n: number, k: number): [number, number] => {
    const u = (1000 * sketch.scale) / n;
    const f = detail(n, [secW0 * u, secH0 * u]);
    const c2 = Math.max(secW0 * u * f + room, 4 * MM.sym);
    const r0 = Math.max(S.y * u, E.y * u, secH0 * u * f + room);
    const r1 = Math.max(P.y * u, X.y * u * k, 4 * MM.sym);
    const w = 2 * MM.pad + S.x * u + MM.gapX + Math.max(E.x, X.x * k) * u + MM.gap + c2;
    return [w, 2 * MM.pad + MM.name + r0 + MM.dims + MM.gapY + r1 + MM.name];
  };
  let [scale, k] = [SCALES[SCALES.length - 1] ?? 200, 1];
  search: for (const n of SCALES)
    for (const iso of SCALES.filter((m) => m >= n)) {
      const [nw, nh] = need(n, n / iso);
      if (nw <= AREA.w && nh <= AREA.h) {
        [scale, k] = [n, n / iso];
        break search;
      }
    }
  const u = (1000 * sketch.scale) / scale;
  const D = detail(scale, [secW0 * u, secH0 * u]);
  const pmm = 1 / u;
  const [w, h] = [AREA.w * pmm, AREA.h * pmm];
  const [nw, nh] = need(scale, k);
  const [ox, oy] = [((AREA.w - nw) / 2 + MM.pad) * pmm, ((AREA.h - nh) / 2 + MM.pad + MM.name) * pmm];
  const [secW, secH] = [D * secW0, D * secH0];
  const c1 = Math.max(E.x, X.x * k);
  const c2 = Math.max(secW + room * pmm, 4 * MM.sym * pmm);
  const r0 = Math.max(S.y, E.y, secH + room * pmm);
  const r1 = Math.max(P.y, X.y * k, 4 * MM.sym * pmm);
  const [x0, x1] = [ox + S.x / 2, ox + S.x + MM.gapX * pmm + c1 / 2];
  const x2 = ox + S.x + MM.gapX * pmm + c1 + MM.gap * pmm + c2 / 2;
  const [y0, y1] = [oy + r0 / 2, oy + r0 + (MM.dims + MM.gapY) * pmm + r1 / 2];
  const at = {
    side: { box: boxes.side as Box3, x: x0, y: y0, k: 1 },
    end: { box: boxes.end as Box3, x: x1, y: y0, k: 1 },
    plan: { box: boxes.plan as Box3, x: x0, y: y1, k: 1 },
    exploded: { box: boxes.exploded as Box3, x: x1, y: y1, k },
  };
  const draw = (v: DraftView, p: Vector3): P2 => {
    const q = p.clone().applyMatrix4(TURN[v]);
    const c = at[v].box.getCenter(new Vector3());
    return [at[v].x + q.x - c.x, at[v].y - (q.y - c.y)];
  };
  const secDraw = ([x, y]: P2): P2 => [x2 + D * (x - sec.x), y0 - D * (y - sec.y)];
  const labels: Label[] = [];
  const label = (text: string, [x, y]: P2, side: Label['at']): void => void labels.push({ text, x: x / w, y: y / h, at: side }); // prettier-ignore
  const thin: P2[] = [];
  const dim = dimmer(sketch, w, h, pmm, thin, labels);
  const d = 8 * pmm;
  // Length under the side elevation, height to its right (in the gap before the end elevation),
  // width under the end elevation.
  // A tyre is sized once across (Ø), its rim's diameter beside the end elevation (ISO 129-1).
  const [only] = parts;
  const round = parts.length === 1 && only?.kind === 'wheel' ? only : null;
  dim([x0 - S.x / 2, y0 + S.y / 2 + d], [x0 + S.x / 2, y0 + S.y / 2 + d], [0, 1], d, S.x, round ? 'Ø' : '');
  if (!round) dim([x0 + S.x / 2 + d, y0 + S.y / 2], [x0 + S.x / 2 + d, y0 - S.y / 2], [1, 0], d, S.y);
  else if (round.rim) dim([x1 + E.x / 2 + d, y0 + round.rim], [x1 + E.x / 2 + d, y0 - round.rim],  [1, 0], d, 2 * round.rim, 'Ø'); // prettier-ignore
  dim([x1 - E.x / 2, y0 + E.y / 2 + d], [x1 + E.x / 2, y0 + E.y / 2 + d], [0, 1], d, E.x);
  // Each element's chord where A-A cuts it, front to back: the first below it, the rest above.
  const foils = parts.flatMap((p) => (cut !== undefined && p.kind === 'foil' && p.z0 <= cut && cut <= p.z1 ? [p] : []));
  foils.sort((a, b) => a.le[0] - b.le[0]);
  foils.forEach((p, n) => {
    const [le, te] = [secDraw(leadingEdge(p, cut ?? 0)), secDraw(p.te)];
    const len = Math.hypot(te[0] - le[0], te[1] - le[1]);
    let [nx, ny] = [-(te[1] - le[1]) / len, (te[0] - le[0]) / len];
    if ((n === 0) !== ny > 0) [nx, ny] = [-nx, -ny];
    const off = (p.t + p.camber) * len + 8 * pmm; // clear of the profile, with room for the value
    const shift = ([x, y]: P2): P2 => [x + nx * off, y + ny * off];
    dim(shift(le), shift(te), [nx, ny], off, len / D);
  });
  // Centre lines on the plane of symmetry, and the cutting plane A-A with its viewing arrows.
  const [lo, hi, mid, e, m] = [model.min, model.max, model.getCenter(new Vector3()), 2.5 * pmm, 100 * pmm];
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
    thin.push(...hatch(section.map(secDraw), 1.5 * pmm));
    label(`Section A-A (1:${scale / D})`, [x2, y0 + r0 / 2], 'below');
  }
  const sym = MM.sym * pmm;
  thin.push(...symbolLines(x2 - 0.9 * sym, y1 - sym / 2, x2 + 0.9 * sym, y1 + sym / 2));
  label('First angle', [x2, y1 + sym / 2 + pmm], 'below');
  label(`Scale 1:${scale}`, [x2, y1 - sym / 2 - pmm], 'above');
  label('Side elevation', [x0, y0 - S.y / 2 - 2 * pmm], 'above');
  label('End elevation', [x1, y0 - E.y / 2 - 2 * pmm], 'above');
  label('Plan', [x0, y1 + P.y / 2 + 2 * pmm], 'below');
  const iso = `${parts.some((p) => p.explode) ? 'Exploded isometric' : 'Isometric'}${k < 1 ? ` (1:${Math.round(scale / k)})` : ''}`;
  label(iso, [x1, y1 + (X.y * k) / 2 + 2 * pmm], 'below');
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
  const type = sheet === 2 ? 'Parts list' : DOC[s.doc];
  return titleRows({ ...s, type, sheet, sheets: s.doc === 'ga' ? 2 : 1 });
}
