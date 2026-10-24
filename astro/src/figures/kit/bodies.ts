import type { Vec3 } from './camera';

/** Solid shapes for city parts (`kit/city.ts`) in the hard-surface look (`kit/hardsurface.ts`):
 *  triangles in the part's own frame (centred, ground at y = 0, w across x, d across z, h
 *  tall), built to lie under the part's wire outline (`kit/outlines.ts`) so its detail can
 *  be drawn on its faces. These are the primitives and the buildings; `kit/bodyshapes.ts`
 *  has trees, rock and machines. */

export type Tris = number[];
const TAU = Math.PI * 2;

const tri = (o: Tris, a: Vec3, b: Vec3, c: Vec3): void => void o.push(...a, ...b, ...c);
const quad = (o: Tris, a: Vec3, b: Vec3, c: Vec3, d: Vec3): void => {
  tri(o, a, b, c);
  tri(o, a, c, d);
};

/** n points round an ellipse at height y, from angle a0, centred at (cx, cz). */
export const ring = (n: number, rx: number, rz: number, y: number, a0 = 0, cx = 0, cz = 0): Vec3[] =>
  Array.from({ length: n }, (_, i): Vec3 => {
    const a = a0 + (i / n) * TAU;
    return [cx + Math.cos(a) * rx, y, cz + Math.sin(a) * rz];
  });

/** A solid through rings of equal size, bottom to top, its ends capped. */
export function loft(o: Tris, rings: Vec3[][], caps = true): void {
  const n = rings[0]?.length ?? 0;
  for (let k = 0; k + 1 < rings.length; k++)
    for (let i = 0; i < n; i++) {
      const [a, b] = [rings[k] ?? [], rings[k + 1] ?? []];
      const j = (i + 1) % n;
      const [p, q, r, s] = [a[i], a[j], b[j], b[i]];
      if (p && q && r && s) quad(o, p, q, r, s);
    }
  if (!caps) return;
  for (const r of [rings[0] ?? [], rings[rings.length - 1] ?? []]) {
    const c = r.reduce((m, p): Vec3 => [m[0] + p[0] / n, m[1] + p[1] / n, m[2] + p[2] / n], [0, 0, 0]);
    r.forEach((p, i) => tri(o, c, p, r[(i + 1) % n] ?? p));
  }
}
/** A prism or frustum of n sides from (rx0, rz0) at y0 to (rx1, rz1) at y1. Boxes (n = 4)
 *  turn an eighth so their faces square up with x and z, as `kit/shells.ts` draws them. */
export function frustum(
  o: Tris,
  n: number,
  rx0: number,
  rz0: number,
  y0: number,
  rx1: number,
  rz1: number,
  y1: number,
  cx = 0,
  cz = 0,
): void {
  const [a0, k] = n === 4 ? [Math.PI / 4, Math.SQRT2] : [0, 1];
  loft(o, [ring(n, rx0 * k, rz0 * k, y0, a0, cx, cz), ring(n, rx1 * k, rz1 * k, y1, a0, cx, cz)]);
}
export function cone(o: Tris, n: number, rx: number, rz: number, y0: number, y1: number, cx = 0, cz = 0, a0 = 0): void {
  const r = ring(n, rx, rz, y0, a0, cx, cz);
  r.forEach((p, i) => {
    const q = r[(i + 1) % n] ?? p;
    tri(o, p, q, [cx, y1, cz]);
    tri(o, p, q, [cx, y0, cz]);
  });
}
/** A diamond: a ring at ym between a point below at y0 and one above at y1. */
export function diamond(o: Tris, n: number, rx: number, rz: number, y0: number, ym: number, y1: number): void {
  const r = ring(n, rx, rz, ym);
  r.forEach((p, i) => {
    const q = r[(i + 1) % n] ?? p;
    tri(o, p, q, [0, y1, 0]);
    tri(o, p, q, [0, y0, 0]);
  });
}
export function cuboid(o: Tris, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): void {
  const at = (i: number, y: number): Vec3 => [i === 0 || i === 3 ? x0 : x1, y, i < 2 ? z0 : z1];
  loft(o, [[0, 1, 2, 3].map((i) => at(i, y0)), [0, 1, 2, 3].map((i) => at(i, y1))]);
}
/** A square-section beam t thick from a to b: legs, booms, cross-arms. */
export function beam(o: Tris, a: Vec3, b: Vec3, t: number): void {
  const d: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const l = Math.hypot(...d) || 1;
  // Two directions across the beam.
  const up: Vec3 = Math.abs(d[1]) / l > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const cross = (u: Vec3, v: Vec3): Vec3 => [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0],
  ];
  const norm = (u: Vec3): Vec3 => {
    const m = Math.hypot(...u) || 1;
    return [(u[0] / m) * (t / 2), (u[1] / m) * (t / 2), (u[2] / m) * (t / 2)];
  };
  const s = norm(cross(d, up));
  const r = norm(cross(d, s));
  const corners = (p: Vec3): Vec3[] =>
    [
      [1, 1],
      [-1, 1],
      [-1, -1],
      [1, -1],
    ].map(
      ([i = 0, j = 0]): Vec3 => [p[0] + s[0] * i + r[0] * j, p[1] + s[1] * i + r[1] * j, p[2] + s[2] * i + r[2] * j],
    );
  loft(o, [corners(a), corners(b)]);
}
/** A gable roof along x over w × d, from y to y + rise. */
export function gable(o: Tris, w: number, d: number, y: number, rise: number): void {
  const [hw, hd] = [w / 2, d / 2];
  quad(o, [-hw, y, -hd], [hw, y, -hd], [hw, y + rise, 0], [-hw, y + rise, 0]);
  quad(o, [-hw, y, hd], [hw, y, hd], [hw, y + rise, 0], [-hw, y + rise, 0]);
  for (const x of [-hw, hw]) tri(o, [x, y, -hd], [x, y, hd], [x, y + rise, 0]);
}

/** A box with its vertical and top edges bevelled by c, so an edge catches the light. */
export function bevelled(o: Tris, w: number, d: number, h: number, c: number): void {
  const [hw, hd] = [w / 2, d / 2];
  const oct = (y: number, k: number): Vec3[] => [
    [-hw + c, y, -hd + k],
    [hw - c, y, -hd + k],
    [hw - k, y, -hd + c],
    [hw - k, y, hd - c],
    [hw - c, y, hd - k],
    [-hw + c, y, hd - k],
    [-hw + k, y, hd - c],
    [-hw + k, y, -hd + c],
  ];
  // The band, then the shoulder in to the top: a ring of eight, inset by c.
  loft(o, [oct(0, 0), oct(h - c, 0), oct(h, c)]);
}

/** Buildings and plant whose solid is more than a plain body. */
export const BUILT: Record<string, (o: Tris, w: number, d: number, h: number) => void> = {
  house: (o, w, d, h) => {
    bevelled(o, w, d, h, Math.min(0.004, w * 0.1));
    gable(o, w, d, h, d * 0.45);
  },
  warehouse: (o, w, d, h) => {
    bevelled(o, w, d, h, 0.004);
    gable(o, w, d, h, d * 0.12);
    for (let x = -w / 2 + 0.05; x < w / 2 - 0.03; x += 0.07)
      cuboid(o, x, h + d * 0.12 - 0.004, -0.008, x + 0.02, h + d * 0.12 + 0.01, 0.008);
  },
  shed: (o, w, d, h) => {
    bevelled(o, w, d, h, 0.004);
    const n = Math.max(2, Math.round(w / 0.07));
    for (let i = 0; i < n; i++) {
      const [a, b] = [-w / 2 + (w * i) / n, -w / 2 + (w * (i + 1)) / n];
      quad(o, [a, h, -d / 2], [a, h + 0.035, -d / 2], [a, h + 0.035, d / 2], [a, h, d / 2]);
      quad(o, [a, h + 0.035, -d / 2], [b, h, -d / 2], [b, h, d / 2], [a, h + 0.035, d / 2]);
      for (const z of [-d / 2, d / 2]) tri(o, [a, h, z], [a, h + 0.035, z], [b, h, z]);
    }
  },
  factory: (o, w, d, h) => {
    bevelled(o, w, d, h, 0.004);
    cuboid(o, -w * 0.475, h, -d * 0.15, w * 0.475, h * 1.18, d * 0.15);
  },
  battery: (o, w, d, h) => {
    bevelled(o, w, d, h, 0.003);
    for (const x of [-w * 0.25, w * 0.15]) cuboid(o, x - 0.015, h, -d * 0.3, x + 0.015, h + 0.015, d * 0.3);
  },
  fuelcell: (o, w, d, h) => {
    bevelled(o, w, d, h, 0.003);
    cuboid(o, -w / 2, h, -0.004, w / 2, h + 0.012, 0.004);
  },
  datahall: (o, w, d, h) => {
    bevelled(o, w, d, h, 0.004);
    for (let x = -w / 2 + 0.04; x < w / 2 - 0.03; x += 0.07) cuboid(o, x, h, -d * 0.3, x + 0.04, h + 0.02, d * 0.3);
  },
  macro: (o, w, d, h) => {
    cuboid(o, -w / 2, 0, -d / 2, w / 2, h, d / 2);
    cuboid(o, -w / 2, h, -d * 0.06, w / 2, h + 0.01, d * 0.06);
  },
  transformer: (o, w, d, h) => {
    const [hw, hd] = [w * 0.35, d * 0.35];
    bevelled(o, hw * 2, hd * 2, h * 0.6, 0.003);
    for (let x = -hw; x <= hw + 1e-6; x += (hw * 2) / 5)
      for (const s of [-1, 1]) cuboid(o, x - 0.002, h * 0.08, s * hd, x + 0.002, h * 0.52, s * d * 0.5);
    for (const x of [-hw * 0.6, 0, hw * 0.6]) frustum(o, 6, w * 0.05, w * 0.05, h * 0.6, w * 0.03, w * 0.03, h, x, 0);
  },
  rods: (o, w, d, h) => {
    const [hw, hd] = [w / 2, d / 2];
    cuboid(o, -hw, 0, -hd, hw, h * 0.15, hd);
    const [nx, nz] = [Math.max(2, Math.round(w / 0.025)), Math.max(2, Math.round(d / 0.025))];
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < nz; j++) {
        const [x, z] = [-hw * 0.8 + (hw * 1.6 * i) / (nx - 1), -hd * 0.8 + (hd * 1.6 * j) / (nz - 1)];
        cuboid(o, x - 0.003, 0, z - 0.003, x + 0.003, h, z + 0.003);
      }
  },
  silo: (o, w, d, h) => {
    frustum(o, 12, w / 2, d / 2, 0, w / 2, d / 2, h);
    cone(o, 8, w / 2, d / 2, h, h + w * 0.45);
  },
  column: (o, w, d, h) => {
    frustum(o, 12, w / 2, d / 2, 0, w / 2, d / 2, h);
    for (const f of [0.3, 0.62, 0.95]) frustum(o, 8, w * 0.85, d * 0.85, f * h, w * 0.85, d * 0.85, f * h + 0.015);
    cone(o, 8, w / 2, d / 2, h, h + w * 0.3);
  },
  reactor: (o, w, d, h) => {
    const [r, dome] = [w / 2, h * 0.55];
    const wall = h - dome;
    frustum(o, 16, r, d / 2, 0, r, d / 2, wall);
    loft(
      o,
      [0, 0.25, 0.5, 0.75, 0.95].map((f) => {
        const a = f * (Math.PI / 2);
        return ring(16, Math.cos(a) * r, Math.cos(a) * (d / 2), wall + Math.sin(a) * dome);
      }),
    );
    cuboid(o, r * 0.85, 0, -r * 0.18, r * 1.15, wall * 0.5, r * 0.18);
    frustum(o, 8, w * 0.04, d * 0.04, 0, w * 0.04, d * 0.04, h * 1.3);
  },
  apartment: (o, w, d, h) => bevelled(o, w, d, h, 0.004),
};
