import type { Vec3 } from './camera';

/** The fold lines of a solid: edges where two faces meet at more than `deg` degrees, or that
 *  only one face has. As segment endpoints, for drawing a solid in wire. */
export function folds(t: number[], deg = 28): number[] {
  const key = (x: number, y: number, z: number): string => `${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(4)}`;
  const edges = new Map<string, { a: Vec3; b: Vec3; n: Vec3[] }>();
  for (let i = 0; i + 8 < t.length; i += 9) {
    const p: Vec3[] = [0, 1, 2].map((k): Vec3 => [t[i + k * 3] ?? 0, t[i + k * 3 + 1] ?? 0, t[i + k * 3 + 2] ?? 0]);
    const [a, b, c] = p as [Vec3, Vec3, Vec3];
    const u: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v: Vec3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n: Vec3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const l = Math.hypot(...n);
    if (l < 1e-12) continue;
    const nn: Vec3 = [n[0] / l, n[1] / l, n[2] / l];
    for (const [q, r] of [
      [a, b],
      [b, c],
      [c, a],
    ] as const) {
      const [ka, kb] = [key(...q), key(...r)];
      const k = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
      const e = edges.get(k) ?? { a: q, b: r, n: [] };
      e.n.push(nn);
      edges.set(k, e);
    }
  }
  const cos = Math.cos((deg * Math.PI) / 180);
  const out: number[] = [];
  for (const { a, b, n } of edges.values()) {
    const [p, q] = [n[0], n[1]];
    // Faces wound either way: compare the normals' lines, not their directions.
    if (!p || !q || Math.abs(p[0] * q[0] + p[1] * q[1] + p[2] * q[2]) < cos) out.push(...a, ...b);
  }
  return out;
}
