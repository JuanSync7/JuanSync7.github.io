import { Box3, Matrix4, Vector3, type BufferGeometry } from 'three';
import { AREA, boxOf, dimmer, SCALES, TURN, VIEWS, type DraftView, type Label, type Plan } from './draftbase';
import { chain, symbolLines, type P2 } from './draftlines';
import { sketchGeometry } from './legosketch';
import { itemsOf, partsOf, type Sketch } from './legosketches';

/** A general arrangement (ISO 10209): the whole assembly in first-angle views at a standard
 *  scale, overall sizes only (length, height, wheelbase, width, both tracks), each item called
 *  out by its number in a circle on a leader ending in a dot on the part (ISO 6433), the parts
 *  list on the document's second sheet (ISO 7573). Spacing is set in paper millimetres, so the
 *  drawing takes the largest standard scale it fits; the isometric view is drawn smaller where
 *  it must be, at a standard scale of its own, and says so. */

/** Paper millimetres: margin, the band above the side view for the item numbers, a dimension
 *  row, the gap between the columns (it holds the height), between the rows, a view's name. */
const MM = { pad: 4, callouts: 20, row: 8, gapX: 20, gapY: 6, name: 7, ring: 4.5 };

export function gaPlan(sketch: Sketch): Plan {
  const parts = partsOf(sketch);
  const geos = parts.map(sketchGeometry);
  const boxes = Object.fromEntries(VIEWS.map((v) => [v, boxOf(geos, TURN[v])])) as Record<DraftView, Box3>;
  const size = (v: DraftView): Vector3 => boxes[v].getSize(new Vector3());
  const [S, E, P, X] = [size('side'), size('end'), size('plan'), size('exploded')];
  const below = 3 * MM.row + MM.name + 4;
  // The largest standard scale the views fit; the isometric at the largest scale under it that fits its cell.
  const fit = (n: number, kIso: number): [number, number] | null => {
    const u = (1000 * sketch.scale) / n; // paper mm per stud
    const c1 = Math.max(E.x, X.x * kIso) * u;
    const r1 = Math.max(P.y * u + MM.name, X.y * kIso * u + 3 * MM.name + 12);
    const w = 2 * MM.pad + S.x * u + MM.gapX + c1;
    const h = 2 * MM.pad + MM.callouts + Math.max(S.y, E.y) * u + below + MM.gapY + r1;
    return w <= AREA.w && h <= AREA.h ? [AREA.w - w, AREA.h - h] : null;
  };
  let [scale, k] = [SCALES[SCALES.length - 1] ?? 200, 1];
  search: for (const n of SCALES)
    for (const iso of SCALES.filter((m) => m >= n))
      if (fit(n, n / iso)) {
        [scale, k] = [n, n / iso];
        break search;
      }
  const [slackX, slackY] = fit(scale, k) ?? [0, 0];
  const u = (1000 * sketch.scale) / scale;
  const pmm = 1 / u; // a paper millimetre in studs
  const [w, h] = [AREA.w * pmm, AREA.h * pmm];
  const left = (MM.pad + slackX / 2) * pmm;
  const top = (MM.pad + slackY / 2 + MM.callouts) * pmm;
  const R0 = Math.max(S.y, E.y);
  const C1 = Math.max(E.x, X.x * k);
  const x0 = left + S.x / 2;
  const x1 = left + S.x + MM.gapX * pmm + C1 / 2;
  const y0 = top + R0 / 2;
  const row1 = top + R0 + (below + MM.gapY) * pmm;
  const y1 = row1 + P.y / 2;
  const yIso = row1 + (X.y * k) / 2;
  const at = {
    side: { box: boxes.side, x: x0, y: y0, k: 1 },
    end: { box: boxes.end, x: x1, y: y0, k: 1 },
    plan: { box: boxes.plan, x: x0, y: y1, k: 1 },
    exploded: { box: boxes.exploded, x: x1, y: yIso, k },
  };
  const draw = (v: DraftView, p: Vector3): P2 => {
    const q = p.clone().applyMatrix4(TURN[v]);
    const c = at[v].box.getCenter(new Vector3());
    return [at[v].x + q.x - c.x, at[v].y - (q.y - c.y)];
  };
  const labels: Label[] = [];
  const label = (text: string, [x, y]: P2, side: Label['at']): void => void labels.push({ text, x: x / w, y: y / h, at: side }); // prettier-ignore
  const thin: P2[] = [];
  const dim = dimmer(sketch, w, h, pmm, thin, labels);
  const model = boxOf(geos, new Matrix4());
  const [lo, hi, mid] = [model.min, model.max, model.getCenter(new Vector3())];
  // Overall sizes. Wheel centres come from the tyres: the front pair, then the rear.
  const tyres = parts.flatMap((p) => (p.kind === 'wheel' ? [p] : []));
  const xs = [...new Set(tyres.map((t) => t.x))].sort((a, b) => a - b);
  const [xf = 0, xr = 0] = [xs[0], xs[xs.length - 1]];
  const axle = (x: number): number[] =>
    tyres
      .filter((t) => t.x === x)
      .map((t) => (t.z0 + t.z1) / 2)
      .sort((a, b) => a - b);
  const ground = y0 + R0 / 2;
  const rowAt = (n: number): number => ground + n * MM.row * pmm;
  const r = tyres[0]?.r ?? 0;
  dim([draw('side', new Vector3(xf, 0, mid.z))[0], rowAt(1)], [draw('side', new Vector3(xr, 0, mid.z))[0], rowAt(1)], [0, 1], MM.row * pmm + r, xr - xf); // prettier-ignore
  dim([x0 - S.x / 2, rowAt(2)], [x0 + S.x / 2, rowAt(2)], [0, 1], 2 * MM.row * pmm, S.x);
  const gx = x1 - E.x / 2 - (MM.gapX / 2) * pmm;
  dim([gx, ground], [gx, ground - E.y], [-1, 0], x1 - E.x / 2 - gx, E.y);
  [axle(xf), axle(xr)].forEach(([za = 0, zb = 0], n) => {
    const [a, b] = [draw('end', new Vector3(n ? xr : xf, 0, za)), draw('end', new Vector3(n ? xr : xf, 0, zb))];
    dim([a[0], rowAt(n + 1)], [b[0], rowAt(n + 1)], [0, 1], (n + 1) * MM.row * pmm, zb - za);
  });
  dim([x1 - E.x / 2, rowAt(3)], [x1 + E.x / 2, rowAt(3)], [0, 1], 3 * MM.row * pmm, E.x);
  // Centre lines: the car's in plan and end view, each wheel's in side elevation.
  const m = 100 * pmm;
  thin.push(...chain(draw('plan', new Vector3(lo.x - 4 * pmm, hi.y, mid.z)), draw('plan', new Vector3(hi.x + 4 * pmm, hi.y, mid.z)), m)); // prettier-ignore
  thin.push(...chain(draw('end', new Vector3(lo.x, lo.y - 4 * pmm, mid.z)), draw('end', new Vector3(lo.x, hi.y + 4 * pmm, mid.z)), m)); // prettier-ignore
  for (const t of tyres.filter((t) => t.z0 === 0)) {
    const [cx, cy] = draw('side', new Vector3(t.x, t.y, 0));
    const e = t.r + 3 * pmm;
    thin.push(...chain([cx - e, cy], [cx + e, cy], m), ...chain([cx, cy - e], [cx, cy + e], m));
  }
  callouts(sketch, geos, (p) => draw('side', p), top, [x0 - S.x / 2, x0 + S.x / 2], pmm, thin, label);
  [...geos].forEach((g) => g.dispose());
  // The view names, the isometric's own scale, and the projection symbol under it.
  label('Side elevation', [x0, rowAt(3) + 2 * pmm], 'below');
  label('End elevation', [x1, rowAt(3) + 2 * pmm], 'below');
  label('Plan', [x0, y1 + P.y / 2 + 2 * pmm], 'below');
  const isoBottom = yIso + (X.y * k) / 2 + 2 * pmm;
  label(k < 1 ? `Isometric (1:${Math.round(scale / k)})` : 'Isometric', [x1, isoBottom], 'below');
  const sym = 9 * pmm;
  const sy = isoBottom + 3 * MM.name * pmm;
  thin.push(...symbolLines(x1 - 0.9 * sym, sy - sym / 2, x1 + 0.9 * sym, sy + sym / 2));
  label(`Scale 1:${scale}`, [x1, sy - sym / 2 - pmm], 'above');
  label('First angle', [x1, sy + sym / 2 + pmm], 'below');
  return { layout: { sketch, w, h, scale, labels }, at, thin, thick: [] };
}

/** Item numbers in circles in a row above the side elevation, in the order their parts run along
 *  it so no two leaders cross, each leader from its circle to a dot on a point of the part. */
function callouts(
  sketch: Sketch,
  geos: BufferGeometry[],
  side: (p: Vector3) => P2,
  top: number,
  [xa, xb]: [number, number],
  pmm: number,
  thin: P2[],
  label: (text: string, at: P2, side: Label['at']) => void,
): void {
  let k = 0;
  const targets = itemsOf(sketch).map(({ item, sketch: s }) => {
    const mine = geos.slice(k, (k += s.parts.filter((p) => !p.context).length));
    const [called, box] = [s.callout, boxOf(mine, new Matrix4())];
    return { item, at: side(called ? new Vector3(...called) : topOverMiddle(mine, box)) };
  });
  targets.sort((a, b) => a.at[0] - b.at[0]);
  const ring = MM.ring * pmm;
  const cy = top - (MM.callouts / 2) * pmm;
  targets.forEach(({ item, at: [tx, ty] }, n) => {
    const cx = xa + ((n + 0.5) * (xb - xa)) / targets.length;
    const circle: P2[] = Array.from({ length: 24 }, (_, j) => [cx + ring * Math.cos((j * Math.PI) / 12), cy + ring * Math.sin((j * Math.PI) / 12)]); // prettier-ignore
    circle.forEach((p, j) => thin.push(p, circle[(j + 1) % 24] ?? p));
    const len = Math.hypot(tx - cx, ty - cy);
    thin.push([cx + ((tx - cx) * ring) / len, cy + ((ty - cy) * ring) / len], [tx, ty]);
    // The dot: a few short strokes across the leader's end, filling about a millimetre.
    for (const a of [0, 1, 2, 3]) {
      const [ux, uy] = [Math.cos((a * Math.PI) / 4) * 0.5 * pmm, Math.sin((a * Math.PI) / 4) * 0.5 * pmm];
      thin.push([tx - ux, ty - uy], [tx + ux, ty + uy]);
    }
    label(String(item), [cx, cy], 'centre');
  });
}

/** The top of an item over the middle fifth of its length, where nothing usually stands in front
 *  of it in side elevation; an item with no point there (four wheels) takes its point nearest its
 *  middle. */
function topOverMiddle(geos: BufferGeometry[], box: Box3): Vector3 {
  const c = box.getCenter(new Vector3());
  const half = 0.1 * (box.max.x - box.min.x);
  let [top, near]: [Vector3 | null, Vector3] = [null, c];
  let d = Infinity;
  for (const g of geos) {
    const pos = g.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const v = new Vector3().fromBufferAttribute(pos, i);
      if (Math.abs(v.x - c.x) <= half && (!top || v.y > top.y)) top = v;
      const dd = (v.x - c.x) ** 2 + (v.y - c.y) ** 2;
      if (dd < d) [near, d] = [v, dd];
    }
  }
  return top ?? near;
}
