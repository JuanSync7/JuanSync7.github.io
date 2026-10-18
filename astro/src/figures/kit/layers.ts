import {
  BoxGeometry,
  BufferGeometry,
  EdgesGeometry,
  Float32BufferAttribute,
  type Group,
  InstancedMesh,
  LineSegments,
  Matrix4,
  Mesh,
} from 'three';
import type { Mats } from './package';

/** Drawing helpers for the layers of a chip package (`kit/package.ts`): a filled slab under
 *  its edges, a set of fine lines, rectangles and circles as segments, and joints as one
 *  instanced batch over a grid of points. */

const m4 = new Matrix4();

export function slab(g: Group, m: Mats, w: number, h: number, d: number, x = 0, y = 0, z = 0): void {
  const geo = new BoxGeometry(w, h, d);
  const mesh = new Mesh(geo, m.fill);
  const e = new LineSegments(new EdgesGeometry(geo), m.edge);
  mesh.position.set(x, y + h / 2, z);
  e.position.copy(mesh.position);
  g.add(mesh, e);
}
export function fine(g: Group, m: Mats, segs: number[]): void {
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(segs, 3));
  g.add(new LineSegments(geo, m.fine));
}
/** A rectangle's outline at height y, as segments. */
export function rect(o: number[], x0: number, z0: number, x1: number, z1: number, y: number): void {
  o.push(x0, y, z0, x1, y, z0, x1, y, z0, x1, y, z1, x1, y, z1, x0, y, z1, x0, y, z1, x0, y, z0);
}
export function circle(o: number[], x: number, z: number, r: number, y: number): void {
  for (let i = 0; i < 12; i++) {
    const [a, b] = [(i / 12) * Math.PI * 2, ((i + 1) / 12) * Math.PI * 2];
    o.push(x + Math.cos(a) * r, y, z + Math.sin(a) * r, x + Math.cos(b) * r, y, z + Math.sin(b) * r);
  }
}
/** Joints of radius r at the given (x, z) points, standing on y = 0. */
export function joints(g: Group, m: Mats, at: [number, number][], r: number): void {
  if (!m.dots) return;
  const mesh = new InstancedMesh(m.ball.clone().scale(r, r, r), m.dots, at.length);
  at.forEach(([x, z], k) => mesh.setMatrixAt(k, m4.makeTranslation(x, r, z)));
  g.add(mesh);
}
/** An n × k grid of points over a w × d area centred on (cx, cz), less those `skip` rejects. */
export function lattice(
  cx: number,
  cz: number,
  w: number,
  d: number,
  n: number,
  k: number,
  skip?: (u: number, v: number) => boolean,
): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < k; j++) {
      const [u, v] = [(i + 0.5) / n - 0.5, (j + 0.5) / k - 0.5];
      if (!skip?.(u, v)) out.push([cx + u * w, cz + v * d]);
    }
  return out;
}
