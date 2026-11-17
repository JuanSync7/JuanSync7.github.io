import { DoubleSide, GreaterDepth, Group, Matrix4, Mesh, MeshBasicMaterial, Quaternion, Vector3 } from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { edgeModel, viewEdges } from './draftedges';
import type { P2 } from './draftlines';
import { AREA, partsOf, plan, TURN, VIEWS, type Layout } from './draftplan';
import { hexOf } from './ink';
import { sketchGeometry } from './legosketch';

export { A3, AREA, draftLayout, titleFields, type Label, type Layout } from './draftplan';

/** ISO 128 line widths on the A3 sheet (mm): thick for visible outlines and the cut, thin (half)
 *  for hidden, centre, dimension and hatching lines. */
export const WEIGHT = { thick: 0.5, thin: 0.25 };

/** A reference sketch drawn as an engineer's general-arrangement drawing, laid out by
 *  kit/draftplan: one turned copy of the part per view, visible edges thick, hidden edges thin and
 *  dashed (a depth-only pass, then edges where something is nearer), the section and the thin
 *  line work flat on top. `fit` sets line widths from the area's size in pixels, so they keep
 *  their paper millimetres at any size (never under a pixel).
 *  Monochrome: a drawing has no accent. No words are drawn here (the layout's labels say where
 *  they go). Studs, x right, y up, the area's top left at the origin. */
export function draftScene(
  id: string,
  own: (d: () => void) => void,
): { group: Group; layout: Layout; fit: (w: number, h: number) => void } {
  const { layout, at, thin, thick } = plan(id);
  const mm = layout.w / AREA.w;
  const widths = new Map<LineMaterial, number>();
  const line = (width: number, key: 'ink2' | 'inkSoft' | 'inkFaint', extra = {}): LineMaterial => {
    const mat = new LineMaterial({ color: hexOf(key), ...extra });
    widths.set(mat, width);
    return mat;
  };
  const mats = {
    hide: new MeshBasicMaterial({ colorWrite: false, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }), // prettier-ignore
    edge: line(WEIGHT.thick, 'ink2'),
    hidden: line(WEIGHT.thin, 'inkFaint', { dashed: true, dashSize: 3 * mm, gapSize: 1.5 * mm, depthFunc: GreaterDepth, depthWrite: false }), // prettier-ignore
    thin: line(WEIGHT.thin, 'inkSoft', { depthTest: false }),
    cut: line(WEIGHT.thick, 'ink2', { depthTest: false }),
  };
  own(() => Object.values(mats).forEach((mat) => mat.dispose()));
  const fat = (g: LineSegmentsGeometry, mat: LineMaterial, order: number): LineSegments2 => {
    const l = new LineSegments2(g, mat);
    l.renderOrder = order;
    return l;
  };
  const parts = partsOf(layout.sketch).map((p) => {
    const solid = sketchGeometry(p);
    own(() => solid.dispose());
    return { solid, edges: edgeModel(solid), explode: p.explode ?? [0, 0, 0] };
  });
  const group = new Group();
  for (const view of VIEWS) {
    const copy = new Group();
    // Each view draws its own silhouettes: the viewer looks along +z of the turned model.
    const look = new Vector3(0, 0, 1).applyMatrix4(new Matrix4().copy(TURN[view]).invert());
    for (const p of parts) {
      const lines = new LineSegmentsGeometry().setPositions(viewEdges(p.edges, look));
      own(() => lines.dispose());
      const hidden = fat(lines, mats.hidden, 2).computeLineDistances();
      const piece = new Group().add(new Mesh(p.solid, mats.hide), fat(lines, mats.edge, 1), hidden);
      if (view === 'exploded') piece.position.set(...p.explode);
      copy.add(piece);
    }
    const a = at[view];
    const c = a.box.getCenter(new Vector3()).multiplyScalar(a.k);
    copy.scale.setScalar(a.k);
    copy.quaternion.copy(new Quaternion().setFromRotationMatrix(TURN[view]));
    copy.position.set(a.x - c.x, -a.y - c.y, -c.z);
    group.add(copy);
  }
  const flat = (pts: P2[]): LineSegmentsGeometry => {
    const g = new LineSegmentsGeometry().setPositions(pts.flatMap(([x, y]) => [x, -y, 0]));
    own(() => g.dispose());
    return g;
  };
  group.add(fat(flat(thin), mats.thin, 3), fat(flat(thick), mats.cut, 3));
  // Widths are in screen pixels: set them from the drawing area's size in pixels.
  const fit = (w: number, h: number): void =>
    widths.forEach((width, mat) => {
      mat.resolution.set(w, h);
      mat.linewidth = Math.max(1, (width * w) / AREA.w);
    });
  return { group, layout, fit };
}

/** Every solid (not dashed) line of a drawing, as end points in pairs in its frame (y up): for a
 *  flat 2D fallback, which has no hidden-line removal. */
export function solidLines(group: Group): [number, number][] {
  group.updateMatrixWorld(true);
  const out: [number, number][] = [];
  const p = new Vector3();
  group.traverse((o) => {
    if (!(o instanceof LineSegments2) || !(o.material instanceof LineMaterial) || o.material.dashed) return;
    const [a, b] = [o.geometry.getAttribute('instanceStart'), o.geometry.getAttribute('instanceEnd')];
    for (let i = 0; i < a.count; i++)
      for (const end of [a, b]) {
        p.fromBufferAttribute(end, i).applyMatrix4(o.matrixWorld);
        out.push([p.x, p.y]);
      }
  });
  return out;
}
