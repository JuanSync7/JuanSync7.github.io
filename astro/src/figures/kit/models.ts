import type { Vec3 } from './camera';

/** Meshes for wireframe and low-poly figures. Each model can be built at a low and a
 *  high resolution, so a figure can resolve from one to the other on hover. */

export type Edge = readonly [number, number];
export type Tri = readonly [number, number, number];

export interface Mesh {
  v: Vec3[];
  e: Edge[];
  /** Triangles, for flat-shaded (low-poly) figures. Empty for line-only models. */
  f: Tri[];
}

function edgesOf(f: readonly Tri[]): Edge[] {
  const seen = new Set<string>();
  const out: Edge[] = [];
  for (const t of f) {
    for (let i = 0; i < 3; i++) {
      const a = t[i] ?? 0;
      const b = t[(i + 1) % 3] ?? 0;
      const k = a < b ? `${a}_${b}` : `${b}_${a}`;
      if (!seen.has(k)) {
        seen.add(k);
        out.push([a, b]);
      }
    }
  }
  return out;
}

const unit = (p: Vec3): Vec3 => {
  const l = Math.hypot(p[0], p[1], p[2]) || 1;
  return [p[0] / l, p[1] / l, p[2] / l];
};

/** A geodesic sphere: an icosahedron split `level` times. 20 · 4^level triangles. */
export function icosphere(level: number, radius = 1): Mesh {
  const t = (1 + Math.sqrt(5)) / 2;
  const v: Vec3[] = (
    [
      [-1, t, 0],
      [1, t, 0],
      [-1, -t, 0],
      [1, -t, 0],
      [0, -1, t],
      [0, 1, t],
      [0, -1, -t],
      [0, 1, -t],
      [t, 0, -1],
      [t, 0, 1],
      [-t, 0, -1],
      [-t, 0, 1],
    ] as Vec3[]
  ).map(unit);
  let f: Tri[] = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1],
  ];
  for (let l = 0; l < level; l++) {
    const mids = new Map<string, number>();
    const mid = (a: number, b: number): number => {
      const k = a < b ? `${a}_${b}` : `${b}_${a}`;
      const hit = mids.get(k);
      if (hit !== undefined) return hit;
      const pa = v[a] ?? [0, 0, 0];
      const pb = v[b] ?? [0, 0, 0];
      v.push(unit([(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2, (pa[2] + pb[2]) / 2]));
      mids.set(k, v.length - 1);
      return v.length - 1;
    };
    const next: Tri[] = [];
    for (const [a, b, c] of f) {
      const ab = mid(a, b);
      const bc = mid(b, c);
      const ca = mid(c, a);
      next.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    f = next;
  }
  return { v: v.map((p) => [p[0] * radius, p[1] * radius, p[2] * radius] as Vec3), e: edgesOf(f), f };
}

/** A torus lying flat: `nu` steps round the ring, `nv` round the tube. */
export function torus(nu: number, nv: number, ring = 0.66, tube = 0.27): Mesh {
  const v: Vec3[] = [];
  const e: Edge[] = [];
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const u = (i / nu) * Math.PI * 2;
      const w = (j / nv) * Math.PI * 2;
      v.push([
        (ring + tube * Math.cos(w)) * Math.cos(u),
        tube * Math.sin(w),
        (ring + tube * Math.cos(w)) * Math.sin(u),
      ]);
      const id = i * nv + j;
      e.push([id, ((i + 1) % nu) * nv + j], [id, i * nv + ((j + 1) % nv)]);
    }
  }
  return { v, e, f: [] };
}

/** A cubic lattice of n × n × n nodes joined along the three axes. */
export function lattice(n: number, half = 0.58): Mesh {
  const v: Vec3[] = [];
  const e: Edge[] = [];
  const id = (a: number, b: number, c: number): number => (a * n + b) * n + c;
  const step = (2 * half) / (n - 1);
  for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) {
      for (let c = 0; c < n; c++) {
        v.push([-half + a * step, -half + b * step, -half + c * step]);
        if (a < n - 1) e.push([id(a, b, c), id(a + 1, b, c)]);
        if (b < n - 1) e.push([id(a, b, c), id(a, b + 1, c)]);
        if (c < n - 1) e.push([id(a, b, c), id(a, b, c + 1)]);
      }
    }
  }
  return { v, e, f: [] };
}

/** A flat n × n grid on the floor, for terrain. Heights are set per frame by the figure. */
export function grid(n: number, half = 1.1): Mesh {
  const v: Vec3[] = [];
  const e: Edge[] = [];
  const f: Tri[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      v.push([-half + (2 * half * i) / (n - 1), 0, -half + (2 * half * j) / (n - 1)]);
      const id = i * n + j;
      if (i < n - 1) e.push([id, id + n]);
      if (j < n - 1) e.push([id, id + 1]);
      if (i < n - 1 && j < n - 1) f.push([id, id + n, id + 1], [id + 1, id + n, id + n + 1]);
    }
  }
  return { v, e, f };
}
