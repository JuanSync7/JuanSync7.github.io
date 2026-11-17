import { BufferGeometry, EdgesGeometry, Vector3 } from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** A solid's edges, worked out once for all its views: its hard edges (faces meeting at more than
 *  24°) and, for each edge two faces share, those faces' normals. */
export interface EdgeModel {
  hard: number[];
  shared: { a: Vector3; b: Vector3; n0: Vector3; n1: Vector3 }[];
}

export function edgeModel(solid: BufferGeometry): EdgeModel {
  const edges = new EdgesGeometry(solid, 24);
  const hard = Array.from(edges.getAttribute('position').array);
  edges.dispose();
  const plain = new BufferGeometry().setAttribute('position', solid.getAttribute('position'));
  if (solid.index) plain.setIndex(solid.index);
  const g = mergeVertices(plain, 1e-4);
  const [pos, idx] = [g.getAttribute('position'), g.index];
  const v = (i: number): Vector3 => new Vector3().fromBufferAttribute(pos, i);
  const faces = new Map<string, Vector3[]>();
  const ends = new Map<string, [number, number]>();
  for (let f = 0; idx && f * 3 < idx.count; f++) {
    const [a, b, c] = [idx.getX(3 * f), idx.getX(3 * f + 1), idx.getX(3 * f + 2)];
    const n = v(b)
      .sub(v(a))
      .cross(v(c).sub(v(a)));
    for (const [p, q] of [
      [a, b],
      [b, c],
      [c, a],
    ] as const) {
      const key = p < q ? `${p},${q}` : `${q},${p}`;
      faces.set(key, [...(faces.get(key) ?? []), n]);
      ends.set(key, [p, q]);
    }
  }
  const shared: EdgeModel['shared'] = [];
  for (const [key, [n0, n1, ...more]] of faces) {
    const [p = 0, q = 0] = ends.get(key) ?? [];
    if (n0 && n1 && !more.length) shared.push({ a: v(p), b: v(q), n0, n1 });
  }
  g.dispose();
  plain.dispose();
  return { hard, shared };
}

/** The lines a drawing shows of one solid seen along `look` (model frame): its hard edges and its
 *  silhouette for that view, the edges where a face turned to the viewer meets one turned away.
 *  A smooth body (a nose, a tyre's tread) has no hard edges along its outline; without the
 *  silhouette a view of it would be empty. End points in pairs. */
export function viewEdges(m: EdgeModel, look: Vector3): number[] {
  const out = [...m.hard];
  // A face within 3° of edge-on counts as edge-on: a thin wing seen along its span would
  // otherwise flicker into hundreds of false silhouette edges.
  const side = (n: Vector3): number => {
    const d = n.lengthSq() < 1e-12 ? 0 : n.dot(look) / n.length();
    return Math.abs(d) < 0.05 ? 0 : Math.sign(d);
  };
  for (const e of m.shared) {
    const [s0, s1] = [side(e.n0), side(e.n1)];
    if (s0 !== s1) out.push(...e.a.toArray(), ...e.b.toArray());
  }
  return out;
}
