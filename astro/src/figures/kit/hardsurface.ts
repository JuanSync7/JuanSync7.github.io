import {
  BufferGeometry,
  Color,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
} from 'three';
import type { Vec3 } from './camera';
import { bodyOf, place, type Part } from './city';
import { hexOf } from './ink';

/** The hard-surface look for city boards (`kit/boards.ts`), after isometric product
 *  illustration: every solid a dark body toned by which way each face looks (tops lightest,
 *  the faces toward the light next, the rest darkest), boxes with their corners bevelled so
 *  an edge catches the light, and lines only where the surface folds, so no hidden edge and
 *  no edge across a flat face is drawn. The tones are fixed in the world, as if lit from one
 *  side, so they hold still while the camera turns. */

const LIGHT: Vec3 = [0.42, 0.82, 0.38];
const DARK = new Color(hexOf('panel'));
const LIT = new Color(hexOf('line4'));
/** Where a face's tone sits between the darkest and the lightest: never fully either. */
const tone = (n: Vec3, f: number): Color => {
  const k = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
  return DARK.clone().lerp(LIT, (0.18 + 0.82 * k ** 1.4) * f);
};

/** A box w × h × d on the ground with its vertical and top edges bevelled by c: a band of
 *  eight sides, then a sloped shoulder up to an inset top. Triangles in the part's frame. */
function bevelled(w: number, d: number, h: number, c: number): number[] {
  const [hw, hd] = [w / 2, d / 2];
  const oct = (y: number): Vec3[] => [
    [-hw + c, y, -hd],
    [hw - c, y, -hd],
    [hw, y, -hd + c],
    [hw, y, hd - c],
    [hw - c, y, hd],
    [-hw + c, y, hd],
    [-hw, y, hd - c],
    [-hw, y, -hd + c],
  ];
  const [lo, mid] = [oct(0), oct(h - c)];
  const top: Vec3[] = [
    [-hw + c, h, -hd + c],
    [hw - c, h, -hd + c],
    [hw - c, h, hd - c],
    [-hw + c, h, hd - c],
  ];
  const out: number[] = [];
  const tri = (a?: Vec3, b?: Vec3, e?: Vec3): void => {
    if (a && b && e) out.push(...a, ...b, ...e);
  };
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8;
    tri(lo[i], mid[i], mid[j]);
    tri(lo[i], mid[j], lo[j]);
  }
  // The shoulder: a sloped face along each side, a corner triangle at each cut corner.
  for (let s = 0; s < 4; s++) {
    const [a, b] = [mid[s * 2], mid[s * 2 + 1]];
    const [p, q] = [top[s], top[(s + 1) % 4]];
    tri(a, p, q);
    tri(a, q, b);
    tri(b, q, mid[(s * 2 + 2) % 8]);
  }
  tri(top[0], top[2], top[1]);
  tri(top[0], top[3], top[2]);
  return out;
}

/** One part's triangles in the district's frame: boxes bevelled, other bodies from the shared
 *  unit solid scaled to the part. */
function triangles(p: Part, geo: Record<string, BufferGeometry>): number[] {
  const body = bodyOf(p.kind);
  if (!body) return [];
  const local =
    body === 'box'
      ? bevelled(p.w, p.d, p.h, Math.min(0.008, p.w * 0.14, p.d * 0.14, p.h * 0.3))
      : (() => {
          const g = geo[body]?.index ? geo[body]?.toNonIndexed() : geo[body];
          const v = g?.getAttribute('position');
          const o: number[] = [];
          for (let i = 0; i < (v?.count ?? 0); i++)
            o.push((v?.getX(i) ?? 0) * p.w, (v?.getY(i) ?? 0) * p.h, (v?.getZ(i) ?? 0) * p.d);
          return o;
        })();
  const out: number[] = [];
  for (let i = 0; i < local.length; i += 3) out.push(...place(p, local[i] ?? 0, local[i + 1] ?? 0, local[i + 2] ?? 0));
  return out;
}

/** Triangles flat-toned by the way each faces, as one mesh, and its fold lines. The first
 *  `dim` values (the plate) take the light at a third, so the ground stays dark and the
 *  buildings stand out of it. */
function toned(pos: number[], dim: number): { mesh: Mesh; folds: number[] } {
  const col: number[] = [];
  for (let i = 0; i < pos.length; i += 9) {
    const [ax, ay, az, bx, by, bz, cx, cy, cz] = pos.slice(i, i + 9).map((v) => v ?? 0);
    const [ux, uy, uz, vx, vy, vz] = [bx - ax, by - ay, bz - az, cx - ax, cy - ay, cz - az];
    const n: Vec3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
    const l = Math.hypot(...n) || 1;
    // Faces are wound either way; a face that points down is shaded as if it pointed up.
    const s = n[1] < -0.2 * l ? -1 : 1;
    const c = tone([(s * n[0]) / l, Math.abs(n[1]) / l, (s * n[2]) / l], i < dim ? 0.34 : 1);
    for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new Float32BufferAttribute(col, 3));
  const material = new MeshBasicMaterial({
    vertexColors: true,
    side: DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const folds = [...new EdgesGeometry(g, 28).getAttribute('position').array];
  return { mesh: new Mesh(g, material), folds };
}

/** The hard-surface body of a board: its plate as a thick bevelled slab and every solid
 *  part, toned, with the lines along their folds. Parts with no body (trees, pylons, rigs)
 *  are left to their wire outlines. */
export function hardSurface(
  parts: readonly Part[],
  w: number,
  d: number,
  geo: Record<string, BufferGeometry>,
): { mesh: Mesh; folds: number[] } {
  const slab = bevelled(w, d, 0.025, 0.012).map((v, i) => (i % 3 === 1 ? v - 0.026 : v));
  const pos = [...slab, ...parts.flatMap((p) => triangles(p, geo))];
  return toned(pos, slab.length);
}
