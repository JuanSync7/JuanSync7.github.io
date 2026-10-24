import type { Vec3 } from './camera';
import type { Mesh } from './models';
import { noise2 } from './noise';
import { between, type Rng } from './rng';

/** Faceted solids for `templates/facet-solid.ts`, each built from its parameters and the
 *  seeded rng: a cut crystal (any number of sides, crown and pavilion of any length, facets
 *  at uneven angles, a table or a point, a leaning tip) and a rough stone (rings and segments
 *  in any number, stretched, dented or bulging by noise, cut flat where it fractured). */

const TAU = Math.PI * 2;
type Tri = [number, number, number];

export interface Crystal {
  kind: 'crystal';
  sides: number;
  r: number;
  crown: number;
  pavilion: number;
  table: number;
  band: number;
  jitter: number;
  lean: [number, number];
}
export interface Stone {
  kind: 'stone';
  rings: number;
  segs: number;
  axes: Vec3;
  dent: number;
  cuts: number;
  jitter: number;
}
/** A ring of n points at height y, each a little off its even angle and radius. */
function ring(rng: Rng, n: number, r: number, y: number, jitter: number): Vec3[] {
  return Array.from({ length: n }, (_, i) => {
    const a = ((i + (rng() - 0.5) * jitter) / n) * TAU;
    const k = r * (1 + (rng() - 0.5) * jitter * 0.4);
    return [Math.cos(a) * k, y, Math.sin(a) * k];
  });
}
/** Faces between two rings of n points (indices from a and b). */
const band = (f: Tri[], a: number, b: number, n: number): void => {
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    f.push([a + i, a + j, b + j], [a + i, b + j, b + i]);
  }
};
/** A fan from one point to a ring of n. */
const fan = (f: Tri[], c: number, a: number, n: number): void => {
  for (let i = 0; i < n; i++) f.push([c, a + i, a + ((i + 1) % n)]);
};

export function crystal(p: Crystal, rng: Rng): Mesh {
  const n = p.sides;
  const v: Vec3[] = [...ring(rng, n, p.r, 0, p.jitter), ...ring(rng, n, p.r, p.band, p.jitter * 0.5)];
  const f: Tri[] = [];
  band(f, 0, n, n);
  // The pavilion down to the culet.
  v.push([p.lean[0] * 0.3, -p.pavilion, p.lean[1] * 0.3]);
  fan(f, v.length - 1, 0, n);
  // The crown: up to a point, or to a table with its flat top.
  const top = p.band + p.crown;
  if (p.table > 0.05) {
    const t = v.length;
    v.push(
      ...ring(rng, n, p.r * p.table, top, p.jitter * 0.5).map(([x, y, z]): Vec3 => [x + p.lean[0], y, z + p.lean[1]]),
    );
    band(f, n, t, n);
    v.push([p.lean[0], top, p.lean[1]]);
    fan(f, v.length - 1, t, n);
  } else {
    v.push([p.lean[0], top, p.lean[1]]);
    fan(f, v.length - 1, n, n);
  }
  return { v, e: [], f };
}

export function stone(p: Stone, rng: Rng): Mesh {
  const v: Vec3[] = [[0, 1, 0]];
  const f: Tri[] = [];
  for (let i = 1; i <= p.rings; i++) {
    const lat = (i / (p.rings + 1)) * Math.PI + (rng() - 0.5) * (p.jitter / p.rings);
    v.push(...ring(rng, p.segs, Math.sin(lat), Math.cos(lat), p.jitter));
  }
  v.push([0, -1, 0]);
  fan(f, 0, 1, p.segs);
  for (let i = 0; i + 1 < p.rings; i++) band(f, 1 + i * p.segs, 1 + (i + 1) * p.segs, p.segs);
  fan(f, v.length - 1, 1 + (p.rings - 1) * p.segs, p.segs);
  // Noise pushes the surface in or out, the axes stretch it, and each fracture plane cuts it flat.
  const n = noise2(rng);
  const planes = Array.from({ length: p.cuts }, (): [Vec3, number] => {
    const [a, b] = [rng() * TAU, Math.acos(rng() * 2 - 1)];
    return [[Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a)], between(rng, 0.55, 0.8)];
  });
  return {
    v: v.map(([x, y, z]): Vec3 => {
      const k = 1 + n(x * 1.7 + 4, y * 1.7 + z * 1.3) * p.dent;
      let q: Vec3 = [x * k * p.axes[0], y * k * p.axes[1], z * k * p.axes[2]];
      for (const [d, at] of planes) {
        const over = q[0] * d[0] + q[1] * d[1] + q[2] * d[2] - at;
        if (over > 0) q = [q[0] - d[0] * over, q[1] - d[1] * over, q[2] - d[2] * over];
      }
      return q;
    }),
    e: [],
    f,
  };
}

/** Turned about x then z by tilt, and scaled so its farthest point is at 1. */
export function settle(m: Mesh, tilt: Vec3): Mesh {
  const [cx, sx, cz, sz] = [Math.cos(tilt[0]), Math.sin(tilt[0]), Math.cos(tilt[2]), Math.sin(tilt[2])];
  const v = m.v.map(([x, y, z]): Vec3 => {
    const [y1, z1] = [y * cx - z * sx, y * sx + z * cx];
    return [x * cz - y1 * sz, x * sz + y1 * cz, z1];
  });
  const far = Math.max(...v.map((p) => Math.hypot(...p)));
  return { ...m, v: v.map(([x, y, z]): Vec3 => [x / far, y / far, z / far]) };
}
