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
import { bevelled, BUILT, type Tris } from './bodies';
import { DIM, OWN_LINES, SHAPES } from './bodyshapes';
import { crowned, LANDMARKS, styleOf, tall } from './landmarks';
import { bodyOf, place, type Part } from './city';
import { hexOf } from './ink';

/** The hard-surface look for city boards (`kit/boards.ts`), after isometric product
 *  illustration: every part a dark solid toned by which way each face looks (tops lightest,
 *  the faces toward the light next, the rest darkest), boxes bevelled so an edge catches the
 *  light, and lines where the surface folds. Every kind has a solid (`kit/bodies.ts`,
 *  `kit/bodyshapes.ts`): nothing is left as wire. A part's wire detail (ribs, fins, bands)
 *  is drawn on its faces by the board, which `detailed` says it may. The tones are fixed in
 *  the world, as if lit from one side, so they hold still while the camera turns. */

const LIGHT: Vec3 = [0.42, 0.82, 0.38];
const DARK = new Color(hexOf('panel'));
const LIT = new Color(hexOf('line4'));
const MATERIAL = new MeshBasicMaterial({
  vertexColors: true,
  side: DoubleSide,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
});
const tone = (n: Vec3, f: number): Color => {
  const k = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
  return DARK.clone().lerp(LIT, (0.18 + 0.82 * k ** 1.4) * f);
};

/** Whether a part's wire outline lies on its solid, so its detail can be drawn over it. */
export const detailed = (p: Part): boolean => !OWN_LINES.has(p.kind) && !LANDMARKS[p.kind] && !tall(p);

/** One part's triangles in the part's frame: its own shape if it has one, else its body (a
 *  box bevelled, any other body from the shared unit solid scaled to the part). */
function local(p: Part, geo: Record<string, BufferGeometry>): Tris {
  const o: Tris = [];
  if (tall(p)) {
    const sides = p.kind === 'block' ? 4 : p.kind === 'hex' ? 6 : p.kind === 'tri' ? 3 : 12;
    crowned(o, sides, p.w, p.d, p.h, styleOf(p.x, p.z));
    return o;
  }
  const own = LANDMARKS[p.kind] ?? BUILT[p.kind] ?? SHAPES[p.kind];
  if (own) {
    own(o, p.w, p.d, p.h);
    return o;
  }
  const body = bodyOf(p.kind);
  if (body === 'box') bevelled(o, p.w, p.d, p.h, Math.min(0.008, p.w * 0.14, p.d * 0.14, p.h * 0.3));
  else if (body) {
    const g0 = geo[body];
    const g = g0?.index ? g0.toNonIndexed() : g0;
    const v = g?.getAttribute('position');
    for (let i = 0; i < (v?.count ?? 0); i++)
      o.push((v?.getX(i) ?? 0) * p.w, (v?.getY(i) ?? 0) * p.h, (v?.getZ(i) ?? 0) * p.d);
  }
  return o;
}

/** The hard-surface body of a board: its plate as a thick bevelled slab and every part,
 *  toned, as one mesh, with the lines along their folds. */
export function hardSurface(
  parts: readonly Part[],
  w: number,
  d: number,
  geo: Record<string, BufferGeometry>,
): { mesh: Mesh; folds: number[] } {
  const pos: number[] = [];
  const dim: number[] = [];
  const slab: Tris = [];
  bevelled(slab, w, d, 0.025, 0.012);
  for (let i = 0; i < slab.length; i += 3) pos.push(slab[i] ?? 0, (slab[i + 1] ?? 0) - 0.026, slab[i + 2] ?? 0);
  dim.push(...new Array<number>(slab.length / 9).fill(0.34));
  for (const p of parts) {
    const o = local(p, geo);
    for (let i = 0; i < o.length; i += 3) pos.push(...place(p, o[i] ?? 0, o[i + 1] ?? 0, o[i + 2] ?? 0));
    dim.push(...new Array<number>(o.length / 9).fill(DIM[p.kind] ?? 1));
  }
  const mesh = tonedMesh(pos, dim);
  return { mesh, folds: [...new EdgesGeometry(mesh.geometry, 28).getAttribute('position').array] };
}

/** Triangles as one mesh, each face toned by the way it looks, at `dim` of the light per
 *  face (1 if not given). Faces wound either way: one facing down is shaded as up. */
export function tonedMesh(pos: Tris, dim: number[] = []): Mesh {
  const col: number[] = [];
  for (let i = 0; i < pos.length; i += 9) {
    const [ax, ay, az, bx, by, bz, cx, cy, cz] = pos.slice(i, i + 9).map((v) => v ?? 0);
    const [ux, uy, uz, vx, vy, vz] = [bx - ax, by - ay, bz - az, cx - ax, cy - ay, cz - az];
    const n: Vec3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
    const l = Math.hypot(...n) || 1;
    const s = n[1] < -0.2 * l ? -1 : 1;
    const c = tone([(s * n[0]) / l, Math.abs(n[1]) / l, (s * n[2]) / l], dim[i / 9] ?? 1);
    for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new Float32BufferAttribute(col, 3));
  return new Mesh(g, MATERIAL);
}
