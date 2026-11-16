import {
  DoubleSide,
  EdgesGeometry,
  GreaterDepth,
  Group,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  Vector3,
  type BufferGeometry,
} from 'three';
import { segs } from './draftlines';
import { partsOf, plan, TURN, VIEWS, type Layout } from './draftplan';
import { hexOf } from './ink';
import { sketchGeometry } from './legosketch';

export { A3, AREA, draftLayout, type Label, type Layout, type Variable } from './draftplan';

/** A reference sketch drawn as an engineer's general-arrangement drawing, laid out by
 *  kit/draftplan: one turned copy of the part per view, visible edges solid, hidden edges dashed
 *  (a depth-only pass, then edges where something is nearer), the section and all thin line work
 *  flat on top. Monochrome: a drawing has no accent. No words are drawn here (the layout's
 *  labels say where they go). Studs, x right, y up, the area's top left at the origin. */
export function draftScene(id: string, own: (d: () => void) => void): { group: Group; layout: Layout } {
  const { layout, at, thin, cut } = plan(id);
  // Dashes scale with the drawing's size.
  const unit = Math.max(layout.w, layout.h) / 100;
  const mats = {
    hide: new MeshBasicMaterial({ colorWrite: false, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }), // prettier-ignore
    edge: new LineBasicMaterial({ color: hexOf('ink2') }),
    hidden: new LineDashedMaterial({ color: hexOf('inkFaint'), dashSize: 0.4 * unit, gapSize: 0.3 * unit, depthFunc: GreaterDepth, depthWrite: false }), // prettier-ignore
    thin: new LineBasicMaterial({ color: hexOf('inkSoft'), depthTest: false }),
    cut: new LineBasicMaterial({ color: hexOf('ink2'), depthTest: false }),
  };
  own(() => Object.values(mats).forEach((mat) => mat.dispose()));
  const parts = partsOf(layout.sketch).map((p) => {
    const solid = sketchGeometry(p);
    const edges = new EdgesGeometry(solid, 24);
    own(() => [solid, edges].forEach((g) => g.dispose()));
    return { solid, edges, explode: p.explode ?? [0, 0, 0] };
  });
  const lines = (g: BufferGeometry, mat: LineBasicMaterial, order: number): LineSegments => {
    const l = new LineSegments(g, mat);
    l.renderOrder = order;
    return l;
  };
  const group = new Group();
  for (const view of VIEWS) {
    const copy = new Group();
    for (const p of parts) {
      const hidden = lines(p.edges, mats.hidden, 2).computeLineDistances();
      const piece = new Group().add(new Mesh(p.solid, mats.hide), lines(p.edges, mats.edge, 1), hidden);
      if (view === 'exploded') piece.position.set(...p.explode);
      copy.add(piece);
    }
    const a = at[view];
    const c = a.box.getCenter(new Vector3());
    copy.quaternion.copy(new Quaternion().setFromRotationMatrix(TURN[view]));
    copy.position.set(a.x - c.x, -a.y - c.y, -c.z);
    group.add(copy);
  }
  const flat = [segs(thin), segs(cut)];
  own(() => flat.forEach((g) => g.dispose()));
  const [t, k] = flat;
  if (t && k) group.add(lines(t, mats.thin, 3), lines(k, mats.cut, 3));
  return { group, layout };
}
