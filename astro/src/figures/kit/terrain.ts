import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { Part, PartKind } from './city';
import type { Sketch, V3 } from './drawing/monoline';
import type { Way } from './separate';

/** Rock, scree and mountains as one ground surface, for the hidden-line district
 *  (`kit/districtsketch.ts`). The generators place rock as separate stones (`Plot.rocks`,
 *  `Plot.mountains`, a gorge's walls); drawn as separate solids they stand in each other, each
 *  with its own facets, and read as a heap of crystals. Here every stone is instead a bump in one
 *  height field over the board, and the surface is built vertex by vertex on a grid:
 *
 *  - a rock is a rounded bump, its rim made irregular by two low harmonics turned by where it
 *    stands, so no two are alike and none is a regular polygon;
 *  - a mesa is a flat top on steep sides: a ledge where the slope breaks, which the drawing kernel
 *    draws as a crease;
 *  - where two bumps meet, the higher wins: neighbours merge into one massif with a valley line
 *    between them, never one solid through another;
 *  - the surface starts a hair under the board, so a hill rises out of the ground with no seam,
 *    and it is closed by a skirt down to the board's underside where it meets the board's edge.
 *
 *  Its lines are the kernel's: the folds where the slope breaks and, for the camera, the
 *  silhouette, plus faint contour lines every `CONTOUR`, which say the shape of a slope the way a
 *  survey map does. */

export const STONE: readonly PartKind[] = ['rock', 'mesa', 'hill'];

/** Grid spacing in board units: fine enough that a bump of the smallest rock has a few rings. */
const CELL = 0.016;
/** How far under the board the flat ground lies, so it never shows through the board's top. */
const UNDER = 0.004;
/** Height between contour lines. */
const CONTOUR = 0.03;
/** How far from a road's edge the ground eases down to it. */
const CUT = 0.05;

/** How far (x, z) is from a way's centre line. */
function fromWay([x0, z0, x1, z1]: Way, x: number, z: number): number {
  const [dx, dz] = [x1 - x0, z1 - z0];
  const t = Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(x - x0 - dx * t, z - z0 - dz * t);
}

interface Bump {
  x: number;
  z: number;
  /** Radii along the stone's own axes, its turn, its height and a phase for its rim. */
  rx: number;
  rz: number;
  c: number;
  s: number;
  h: number;
  phase: number;
  mesa: boolean;
}

/** Steepest a slope may stand, as height over base radius: rock, not needles. */
const STEEP = 0.95;
/** How softly two bumps blend where they meet (a smooth maximum): a valley, not a V. */
const BLEND = 0.012;
/** Passes of a light blur over the height grid. */
const SMOOTH = 2;

const bumpOf = (p: Part): Bump => ({
  x: p.x,
  z: p.z,
  // A stone's footprint is its base; the slope runs out well past it, as scree does.
  rx: (p.w / 2) * 1.5,
  rz: (p.d / 2) * 1.5,
  c: Math.cos(p.rot ?? 0),
  s: Math.sin(p.rot ?? 0),
  h: Math.min(p.h, STEEP * Math.min(p.w, p.d) * 0.75),
  phase: (Math.abs(Math.sin(p.x * 91.7 + p.z * 47.3)) * 43758.5) % (Math.PI * 2),
  mesa: p.kind === 'mesa',
});

/** One bump's height at (x, z): 0 outside it. */
function heightIn(b: Bump, x: number, z: number): number {
  const [dx, dz] = [x - b.x, z - b.z];
  const [u, v] = [(dx * b.c + dz * b.s) / b.rx, (-dx * b.s + dz * b.c) / b.rz];
  const a = Math.atan2(v, u);
  // An irregular rim: the stone reaches further on some sides than others.
  const rim = 1 + 0.16 * Math.sin(3 * a + b.phase) + 0.09 * Math.sin(5 * a + b.phase * 1.7);
  const r = Math.hypot(u, v) / rim;
  if (r >= 1) return 0;
  const k = 1 - r * r;
  // A rock: a rounded crown on long shoulders that run out to nothing. A mesa: a flat top that
  // breaks to steep sides.
  if (b.mesa) return b.h * Math.min(1, 2.4 * k);
  const crown = k * k * (3 - 2 * k);
  return b.h * crown * (1 + 0.1 * Math.sin(2 * a + b.phase) * (1 - k));
}

export interface Terrain {
  /** The terrain's surface as drawn, for the clash check: its own name and parts. */
  readonly object: string;
  /** The ground's height at (x, z): 0 off the terrain. */
  height: (x: number, z: number) => number;
  /** Draws the surface into `k`, in the current object. */
  draw: (k: Sketch, slab: number, proud: number) => void;
}

/** The terrain of `stones` on a w × d board. */
export function terrainOf(
  stones: readonly Part[],
  w: number,
  d: number,
  ways: readonly Way[] = [],
): Terrain | undefined {
  if (!stones.length) return undefined;
  const bumps = stones.map(bumpOf);
  const field = (x: number, z: number): number => {
    let top = 0;
    for (const b of bumps) {
      const v = heightIn(b, x, z);
      if (v <= 0) continue;
      // A smooth maximum: where two rocks meet, the ground between them fills in as a saddle.
      const g = top - v;
      top = Math.abs(g) >= BLEND ? Math.max(top, v) : (top + v) / 2 + (g * g) / (4 * BLEND) + BLEND / 4;
    }
    // Roads are cut level through the ground: it eases down to them over CUT.
    for (const way of ways) {
      if (top <= 0) break;
      const gap = fromWay(way, x, z) - way[4];
      if (gap < CUT) top *= gap <= 0 ? 0 : (gap / CUT) ** 2 * (3 - (2 * gap) / CUT);
    }
    return top;
  };
  // The grid covers the stones and the slope round them, inside the board.
  const reach = (b: Bump): number => Math.max(b.rx, b.rz) * 1.3;
  const [x0, x1] = [
    Math.max(-w / 2, Math.min(...bumps.map((b) => b.x - reach(b)))),
    Math.min(w / 2, Math.max(...bumps.map((b) => b.x + reach(b)))),
  ];
  const [z0, z1] = [
    Math.max(-d / 2, Math.min(...bumps.map((b) => b.z - reach(b)))),
    Math.min(d / 2, Math.max(...bumps.map((b) => b.z + reach(b)))),
  ];
  const [nx, nz] = [Math.max(2, Math.ceil((x1 - x0) / CELL)), Math.max(2, Math.ceil((z1 - z0) / CELL))];
  const X = (i: number): number => x0 + ((x1 - x0) * i) / nx;
  const Z = (j: number): number => z0 + ((z1 - z0) * j) / nz;
  let H: number[] = [];
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) H.push(field(X(i), Z(j)));
  // Smoothed: a slope the grid would break into steps (each a crease) runs on as one surface.
  const at = (g: number[], i: number, j: number): number =>
    g[Math.max(0, Math.min(nz, j)) * (nx + 1) + Math.max(0, Math.min(nx, i))] ?? 0;
  for (let pass = 0; pass < SMOOTH; pass++) {
    const g = H;
    H = g.map((v, n) => {
      const [i, j] = [n % (nx + 1), Math.floor(n / (nx + 1))];
      return (4 * v + at(g, i - 1, j) + at(g, i + 1, j) + at(g, i, j - 1) + at(g, i, j + 1)) / 8;
    });
  }
  const y = (i: number, j: number): number => at(H, i, j) - UNDER;
  /** The smoothed ground at any point: the grid read between its vertices. */
  const height = (x: number, z: number): number => {
    const [u, v] = [((x - x0) / (x1 - x0)) * nx, ((z - z0) / (z1 - z0)) * nz];
    if (u < 0 || v < 0 || u > nx || v > nz) return 0;
    const [i, j] = [Math.min(nx - 1, Math.floor(u)), Math.min(nz - 1, Math.floor(v))];
    const [fu, fv] = [u - i, v - j];
    const a = at(H, i, j) * (1 - fu) + at(H, i + 1, j) * fu;
    const b = at(H, i, j + 1) * (1 - fu) + at(H, i + 1, j + 1) * fu;
    return Math.max(0, a * (1 - fv) + b * fv);
  };

  const draw = (k: Sketch, slab: number, proud: number): void => {
    const tris: number[] = [];
    const v = (i: number, j: number): V3 => [X(i), y(i, j), Z(j)];
    const quad = (a: V3, b: V3, c: V3, e: V3): void => void tris.push(...a, ...b, ...c, ...a, ...c, ...e);
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nx; i++) {
        // Flat ground under the board is left out: only the cells that rise are built.
        if (Math.max(y(i, j), y(i + 1, j), y(i, j + 1), y(i + 1, j + 1)) <= 0) continue;
        // Split each cell along the diagonal that follows the slope, so ridges stay straight.
        const [a, b, c, e] = [v(i, j), v(i + 1, j), v(i + 1, j + 1), v(i, j + 1)];
        if (Math.abs(a[1] - c[1]) <= Math.abs(b[1] - e[1])) quad(a, b, c, e);
        else quad(b, c, e, a);
      }
    // Where the terrain meets the board's edge, a skirt down to its underside closes the cut.
    const skirt = (p: V3, q: V3): void => {
      if (p[1] <= 0 && q[1] <= 0) return;
      quad(p, q, [q[0], -slab, q[2]], [p[0], -slab, p[2]]);
    };
    for (let i = 0; i < nx; i++) {
      if (Z(0) <= -d / 2 + 1e-9) skirt(v(i, 0), v(i + 1, 0));
      if (Z(nz) >= d / 2 - 1e-9) skirt(v(i, nz), v(i + 1, nz));
    }
    for (let j = 0; j < nz; j++) {
      if (X(0) <= -w / 2 + 1e-9) skirt(v(0, j), v(0, j + 1));
      if (X(nx) >= w / 2 - 1e-9) skirt(v(nx, j), v(nx, j + 1));
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(tris, 3));
    k.mesh(g);
    contours(k, y, X, Z, nx, nz, proud);
  };
  return { object: 'board', height, draw };
}

/** Contour lines every CONTOUR up the surface (marching squares on the grid), `proud` above it. */
function contours(
  k: Sketch,
  y: (i: number, j: number) => number,
  X: (i: number) => number,
  Z: (j: number) => number,
  nx: number,
  nz: number,
  proud: number,
): void {
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const c: [number, number, number][] = [
        [X(i), y(i, j), Z(j)],
        [X(i + 1), y(i + 1, j), Z(j)],
        [X(i + 1), y(i + 1, j + 1), Z(j + 1)],
        [X(i), y(i, j + 1), Z(j + 1)],
      ];
      const lo = Math.min(...c.map((p) => p[1]));
      const hi = Math.max(...c.map((p) => p[1]));
      for (let lv = Math.ceil(Math.max(lo, 0.001) / CONTOUR) * CONTOUR; lv < hi; lv += CONTOUR) {
        const cut: V3[] = [];
        for (let e = 0; e < 4; e++) {
          const [p, q] = [c[e], c[(e + 1) % 4]];
          if (!p || !q || p[1] < lv === q[1] < lv) continue;
          const t = (lv - p[1]) / (q[1] - p[1]);
          cut.push([p[0] + (q[0] - p[0]) * t, lv + proud, p[2] + (q[2] - p[2]) * t]);
        }
        if (cut.length >= 2) k.line(cut.slice(0, 2), 'faint');
        if (cut.length === 4) k.line(cut.slice(2, 4), 'faint');
      }
    }
}
