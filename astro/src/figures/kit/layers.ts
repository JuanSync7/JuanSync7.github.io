import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  EdgesGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  type Group,
  InstancedMesh,
  LineSegments,
  Matrix4,
  Mesh,
  Path,
  Shape,
} from 'three';
import type { Mats } from './package';

/** Drawing helpers for the layers of a chip package (`kit/package.ts`): a filled slab under
 *  its edges, a frame (a slab with a rectangular opening), a set of fine lines, rectangles
 *  and circles as segments, joints as one instanced batch over a grid of points, and posts
 *  (upright cylinders, filled, their outlines drawn as fine lines). */

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
export function circle(o: number[], x: number, z: number, r: number, y: number, n = 12): void {
  for (let i = 0; i < n; i++) {
    const [a, b] = [(i / n) * Math.PI * 2, ((i + 1) / n) * Math.PI * 2];
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

/** A slab of half sizes (a, b) and height h with a rectangular opening of half sizes (ia, ib)
 *  through it, centred: a mould round a die. Its edges are the outline and the opening only. */
export function frame(g: Group, m: Mats, a: number, b: number, ia: number, ib: number, h: number): void {
  const s = new Shape();
  s.moveTo(-a, -b).lineTo(a, -b).lineTo(a, b).lineTo(-a, b).lineTo(-a, -b);
  const hole = new Path();
  hole.moveTo(-ia, -ib).lineTo(-ia, ib).lineTo(ia, ib).lineTo(ia, -ib).lineTo(-ia, -ib);
  s.holes.push(hole);
  const geo = new ExtrudeGeometry(s, { depth: h, bevelEnabled: false });
  // Extruded along z; stand it up so it rises along y, its plan in x and z.
  geo.rotateX(-Math.PI / 2);
  g.add(new Mesh(geo, m.fill), new LineSegments(new EdgesGeometry(geo), m.edge));
}
/** Upright posts of radius r and height h at the given (x, z) points, standing on y = 0: filled
 *  so they hide one another, with a rim at the top and two side lines facing a viewer at yaw
 *  `yaw` drawn as fine lines. */
export function posts(g: Group, m: Mats, at: [number, number][], r: number, h: number, yaw = 0.6): void {
  const mesh = new InstancedMesh(new CylinderGeometry(r, r, h, 10), m.fill, at.length);
  at.forEach(([x, z], k) => mesh.setMatrixAt(k, m4.makeTranslation(x, h / 2, z)));
  g.add(mesh);
  const o: number[] = [];
  const [sx, sz] = [Math.cos(yaw) * r, -Math.sin(yaw) * r];
  for (const [x, z] of at) {
    circle(o, x, z, r, h);
    o.push(x + sx, 0, z + sz, x + sx, h, z + sz, x - sx, 0, z - sz, x - sx, h, z - sz);
  }
  fine(g, m, o);
}
