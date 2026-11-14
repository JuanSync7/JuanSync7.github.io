import { BufferGeometry, CylinderGeometry, Float32BufferAttribute, RingGeometry, Vector3 } from 'three';
import { join, SEG } from './legogeo';

/** The underside of a real brick, plate or tile, drawn from LEGO's published sizes (8 mm to the
 *  stud): walls 1.2 mm thick, a 1 mm roof, and under it the tubes (6.51 mm across, a 4.8 mm bore)
 *  between every four studs of a piece two or more wide, or the solid pins (3.2 mm) between the
 *  studs of a piece one wide. They grip the studs below; the top of the piece is unchanged. */

const WALL = 1.2 / 8;
const ROOF = 1 / 8;
const TUBE = 6.51 / 16;
const BORE = 4.8 / 16;
const PIN = 3.2 / 16;

type V = [number, number, number];

/** Quads, each turned to face `n` (outward), as one unindexed geometry. */
function quads(list: { q: [V, V, V, V]; n: V }[]): BufferGeometry {
  const pos: number[] = [];
  const e = new Vector3();
  const f = new Vector3();
  for (const { q, n } of list) {
    const [a, b, c] = q.map((v) => new Vector3(...v));
    if (!a || !b || !c) continue;
    const facing =
      e
        .subVectors(b, a)
        .cross(f.subVectors(c, a))
        .dot(new Vector3(...n)) >= 0;
    const [p, r, s, t] = facing ? q : [q[0], q[3], q[2], q[1]];
    pos.push(...p, ...r, ...s, ...p, ...s, ...t);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return geo;
}

/** The same surface seen from inside: the triangles turned over and the normals reversed. */
function inward(geo: BufferGeometry): BufferGeometry {
  geo.index?.array.reverse();
  const n = geo.getAttribute('normal');
  for (let k = 0; k < n.count; k++) n.setXYZ(k, -n.getX(k), -n.getY(k), -n.getZ(k));
  return geo;
}

/** A rectangular body w x d, `top` high, with its real underside; `g` is the gap at its edges. */
export function hollow(w: number, d: number, top: number, g: number): BufferGeometry {
  const [x0, x1, z0, z1] = [g, w - g, g, d - g];
  const [a0, a1, b0, b1] = [x0 + WALL, x1 - WALL, z0 + WALL, z1 - WALL];
  const roof = top - ROOF;
  const out = quads([
    { q: [[x0, top, z0], [x1, top, z0], [x1, top, z1], [x0, top, z1]], n: [0, 1, 0] },
    { q: [[x0, 0, z0], [x1, 0, z0], [x1, top, z0], [x0, top, z0]], n: [0, 0, -1] },
    { q: [[x0, 0, z1], [x1, 0, z1], [x1, top, z1], [x0, top, z1]], n: [0, 0, 1] },
    { q: [[x0, 0, z0], [x0, 0, z1], [x0, top, z1], [x0, top, z0]], n: [-1, 0, 0] },
    { q: [[x1, 0, z0], [x1, 0, z1], [x1, top, z1], [x1, top, z0]], n: [1, 0, 0] },
    // The rim the walls stand on, the walls' inner faces, and the roof seen from below.
    { q: [[x0, 0, z0], [x1, 0, z0], [a1, 0, b0], [a0, 0, b0]], n: [0, -1, 0] },
    { q: [[x1, 0, z0], [x1, 0, z1], [a1, 0, b1], [a1, 0, b0]], n: [0, -1, 0] },
    { q: [[x1, 0, z1], [x0, 0, z1], [a0, 0, b1], [a1, 0, b1]], n: [0, -1, 0] },
    { q: [[x0, 0, z1], [x0, 0, z0], [a0, 0, b0], [a0, 0, b1]], n: [0, -1, 0] },
    { q: [[a0, 0, b0], [a1, 0, b0], [a1, roof, b0], [a0, roof, b0]], n: [0, 0, 1] },
    { q: [[a0, 0, b1], [a1, 0, b1], [a1, roof, b1], [a0, roof, b1]], n: [0, 0, -1] },
    { q: [[a0, 0, b0], [a0, 0, b1], [a0, roof, b1], [a0, roof, b0]], n: [1, 0, 0] },
    { q: [[a1, 0, b0], [a1, 0, b1], [a1, roof, b1], [a1, roof, b0]], n: [-1, 0, 0] },
    { q: [[a0, roof, b0], [a1, roof, b0], [a1, roof, b1], [a0, roof, b1]], n: [0, -1, 0] },
  ]); // prettier-ignore
  const grips: BufferGeometry[] = [];
  if (w >= 2 && d >= 2) {
    for (let i = 1; i < w; i++)
      for (let j = 1; j < d; j++) {
        const at = (geo: BufferGeometry): BufferGeometry => geo.translate(i, roof / 2, j);
        grips.push(at(new CylinderGeometry(TUBE, TUBE, roof, SEG, 1, true)));
        grips.push(at(inward(new CylinderGeometry(BORE, BORE, roof, SEG, 1, true))));
        grips.push(new RingGeometry(BORE, TUBE, SEG).rotateX(Math.PI / 2).translate(i, 0, j));
      }
  } else if (w > 1 || d > 1) {
    const long = Math.max(w, d);
    for (let k = 1; k < long; k++) {
      const pin = new CylinderGeometry(PIN, PIN, roof, SEG).translate(0, roof / 2, 0);
      grips.push(w >= d ? pin.translate(k, 0, d / 2) : pin.translate(w / 2, 0, k));
    }
  }
  return grips.length ? join([out, ...grips]) : out;
}
