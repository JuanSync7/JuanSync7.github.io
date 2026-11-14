import {
  Box3,
  BufferGeometry,
  DoubleSide,
  EdgesGeometry,
  Euler,
  GreaterDepth,
  Group,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  Vector3,
} from 'three';
import { chain, dimLines, segs, symbolLines, type Rect } from './draftlines';
import { hexOf } from './ink';
import { sketchGeometry } from './legosketch';
import { LEGO_SKETCHES, type Sketch } from './legosketches';

/** A reference sketch drawn as an engineer's general-arrangement drawing: first-angle orthographic
 *  projection (the side elevation, the end elevation seen from the nose placed on its right, the
 *  plan placed below it) and an isometric view, with visible edges solid, hidden edges dashed,
 *  centre lines chain-dotted, overall dimensions and the first-angle symbol. Units are studs.
 *  No text is drawn here: `Layout` says where each name and value goes, so a page sets them as
 *  DOM and the review sheet writes them on its 2D canvas. Context parts are left off. */

export type { Rect };
export type DraftView = 'side' | 'end' | 'plan' | 'iso';
export const VIEW_NAMES: Record<DraftView, string> = {
  side: 'Side elevation',
  end: 'End elevation',
  plan: 'Plan',
  iso: 'Isometric',
};

/** A dimension's value and where its line's middle sits (fractions); vertical lines read upward. */
export interface Dim {
  mm: number;
  studs: number;
  x: number;
  y: number;
  vertical: boolean;
}
export interface Layout {
  sketch: Sketch;
  /** The drawing area's size in studs (its shape is AREA's), and the scale it prints at on A3. */
  w: number;
  h: number;
  views: { view: DraftView; rect: Rect }[];
  dims: Dim[];
  symbol: Rect;
  scale: number;
}

/** An A3 sheet, landscape, in mm (ISO 5457): a 20 mm filing margin on the left, 10 mm elsewhere,
 *  and the title block's strip along the bottom. The drawing area is what is left above it. */
export const A3 = { w: 420, h: 297, left: 20, edge: 10, block: 40 };
export const AREA = { w: A3.w - A3.left - A3.edge, h: A3.h - 2 * A3.edge - A3.block };
const SCALES = [1, 2, 5, 10, 20, 50, 100, 200];

const VIEWS: DraftView[] = ['side', 'end', 'plan', 'iso'];
/** Each view turns the model so that view faces a camera looking down -z, y up. */
const TURN: Record<DraftView, Matrix4> = {
  side: new Matrix4(),
  plan: new Matrix4().makeRotationX(Math.PI / 2),
  end: new Matrix4().makeRotationY(Math.PI / 2),
  iso: new Matrix4().makeRotationFromEuler(new Euler(Math.atan(Math.SQRT1_2), Math.PI / 4, 0, 'XYZ')),
};

function sketchOf(id: string): Sketch {
  const s = LEGO_SKETCHES[id];
  if (!s) throw new Error(`lego: no sketch ${id}`);
  return s;
}

interface Plan {
  layout: Layout;
  /** Per view: the turned model's box and the drawing point (studs, y down) its centre goes to. */
  at: Record<DraftView, { box: Box3; x: number; y: number }>;
  /** The untouched model's box, and the drawing's unit of spacing. */
  box: Box3;
  m: number;
}

function plan(id: string): Plan {
  const aspect = AREA.w / AREA.h;
  const sketch = sketchOf(id);
  const geos = sketch.parts.filter((p) => !p.context).map(sketchGeometry);
  const boxOf = (t: Matrix4): Box3 =>
    geos.reduce((b, g) => {
      const turned = g.clone().applyMatrix4(t);
      turned.computeBoundingBox();
      if (turned.boundingBox) b.union(turned.boundingBox);
      turned.dispose();
      return b;
    }, new Box3());
  const boxes = Object.fromEntries(VIEWS.map((v) => [v, boxOf(TURN[v])])) as Record<DraftView, Box3>;
  const size = (v: DraftView): Vector3 => boxes[v].getSize(new Vector3());
  const [S, E, P, I] = [size('side'), size('end'), size('plan'), size('iso')];
  const m = Math.max(S.x, S.y, E.x, P.y);
  const [gap, pad, sym] = [0.26 * m, 0.12 * m, 0.14 * m];
  const [col0, col1, row0, row1] = [S.x, Math.max(E.x, I.x), S.y, Math.max(P.y, I.y)];
  let w = pad + col0 + gap + col1 + gap + 1.8 * sym + pad;
  let h = pad + row0 + gap + row1 + pad;
  let [ox, oy] = [0, 0];
  if (w / h < aspect) [ox, w] = [(h * aspect - w) / 2, h * aspect];
  else [oy, h] = [(w / aspect - h) / 2, w / aspect];
  // Grow the margins until the drawing prints at a standard scale.
  const real = (w * sketch.scale * 1000) / AREA.w;
  const scale = SCALES.find((n) => n >= real) ?? Math.ceil(real);
  const f = scale / real;
  [ox, oy, w, h] = [ox + (w * f - w) / 2, oy + (h * f - h) / 2, w * f, h * f];
  const [x0, x1] = [ox + pad + col0 / 2, ox + pad + col0 + gap + col1 / 2];
  const [y0, y1] = [oy + pad + row0 / 2, oy + pad + row0 + gap + row1 / 2];
  const at = {
    side: { box: boxes.side, x: x0, y: y0 },
    end: { box: boxes.end, x: x1, y: y0 },
    plan: { box: boxes.plan, x: x0, y: y1 },
    iso: { box: boxes.iso, x: x1, y: y1 },
  };
  const rect = (v: DraftView): Rect => {
    const s = size(v);
    const a = at[v];
    return { x0: (a.x - s.x / 2) / w, y0: (a.y - s.y / 2) / h, x1: (a.x + s.x / 2) / w, y1: (a.y + s.y / 2) / h };
  };
  const d = 0.16 * m;
  const dim = (studs: number, x: number, y: number, vertical: boolean): Dim => ({
    mm: Math.round(studs * sketch.scale * 1000), studs: Math.round(studs * 10) / 10, x: x / w, y: y / h, vertical,
  }); // prettier-ignore
  const dims = [
    dim(S.x, x0, y0 + S.y / 2 + d, false),
    dim(S.y, x0 - S.x / 2 - d, y0, true),
    dim(E.x, x1, y0 + E.y / 2 + d, false),
  ];
  const sx = ox + pad + col0 + gap + col1 + gap;
  const sy = oy + pad + row0 + gap + row1 - sym;
  const symbol = { x0: sx / w, y0: sy / h, x1: (sx + 1.8 * sym) / w, y1: (sy + sym) / h };
  const layout = { sketch, w, h, scale, views: VIEWS.map((view) => ({ view, rect: rect(view) })), dims, symbol };
  const box = boxOf(new Matrix4());
  geos.forEach((g) => g.dispose());
  return { layout, at, box, m };
}

/** Where the drawing's text goes. */
export const draftLayout = (id: string): Layout => plan(id).layout;

/** The drawing as a three.js group (studs; x right, y up, top left at the origin) and its layout. */
export function draftScene(id: string, own: (d: () => void) => void): { group: Group; layout: Layout } {
  const { layout, at, box, m } = plan(id);
  const mats = {
    hide: new MeshBasicMaterial({ colorWrite: false, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }), // prettier-ignore
    edge: new LineBasicMaterial({ color: hexOf('ink2') }),
    lamp: new LineBasicMaterial({ color: hexOf('signal') }),
    hidden: new LineDashedMaterial({ color: hexOf('inkFaint'), dashSize: 0.05 * m, gapSize: 0.04 * m, depthFunc: GreaterDepth, depthWrite: false }), // prettier-ignore
    centre: new LineBasicMaterial({ color: hexOf('inkMuted'), depthTest: false }),
    dim: new LineBasicMaterial({ color: hexOf('inkSoft'), depthTest: false }),
  };
  own(() => Object.values(mats).forEach((mat) => mat.dispose()));
  const parts = layout.sketch.parts
    .filter((p) => !p.context)
    .map((p) => {
      const solid = sketchGeometry(p);
      const edges = new EdgesGeometry(solid, 24);
      own(() => [solid, edges].forEach((g) => g.dispose()));
      return { solid, edges, lamp: p.tone === 'signal' };
    });
  const group = new Group();
  const mid = box.getCenter(new Vector3());
  const lines = (g: BufferGeometry, mat: LineBasicMaterial, order: number): LineSegments => {
    const l = new LineSegments(g, mat);
    l.renderOrder = order;
    return l;
  };
  for (const view of VIEWS) {
    const copy = new Group();
    for (const p of parts) {
      const solid = new Mesh(p.solid, mats.hide);
      const hidden = lines(p.edges, mats.hidden, 2).computeLineDistances();
      copy.add(solid, lines(p.edges, p.lamp ? mats.lamp : mats.edge, 1), hidden);
    }
    // Centre lines on the plane of symmetry, where it is seen edge-on.
    const e = 0.05 * m;
    if (view === 'plan') copy.add(lines(segs(chain(new Vector3(box.min.x - e, box.max.y, mid.z), new Vector3(box.max.x + e, box.max.y, mid.z), m)), mats.centre, 3)); // prettier-ignore
    if (view === 'end') copy.add(lines(segs(chain(new Vector3(box.min.x, box.min.y - e, mid.z), new Vector3(box.min.x, box.max.y + e, mid.z), m)), mats.centre, 3)); // prettier-ignore
    const a = at[view];
    const c = a.box.getCenter(new Vector3());
    copy.quaternion.copy(new Quaternion().setFromRotationMatrix(TURN[view]));
    copy.position.set(a.x - c.x, -a.y - c.y, -c.z);
    group.add(copy);
  }
  const { w, h } = layout;
  const dims = layout.dims.flatMap((d, k) => {
    const v = at[k < 2 ? 'side' : 'end'];
    const s = v.box.getSize(new Vector3());
    const [x, y] = [d.x * w, -d.y * h];
    const off = 0.16 * m;
    return d.vertical
      ? dimLines([x, y - s.y / 2], [x, y + s.y / 2], [-off, 0], m)
      : dimLines([x - s.x / 2, y], [x + s.x / 2, y], [0, -off], m);
  });
  group.add(lines(segs([...dims, ...symbolLines(layout.symbol, w, h)]), mats.dim, 3));
  group.traverse((o) => o instanceof LineSegments && own(() => o.geometry.dispose()));
  return { group, layout };
}
