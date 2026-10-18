import type { Vec3 } from './camera';
import type { Rng } from './rng';

/** Workflows as stations on a floor, joined by traces: a seeded graph (how many stations,
 *  where they stand, which pairs are joined), the walk one job takes through it, and the
 *  orthogonal trace between two stations. Workflow draws them as isometric stations. */

export const GLYPHS = ['grid', 'bars', 'ring', 'stack', 'plain', 'tower', 'chip', 'server', 'dish', 'gable'] as const;
export type Glyph = (typeof GLYPHS)[number];

export interface Station {
  x: number;
  z: number;
  h: number;
  /** Half the width of its footprint. */
  r: number;
  glyph: Glyph;
}
export interface Edge {
  a: number;
  b: number;
  /** Which way the trace turns: along x first, or along z first. */
  xFirst: boolean;
  /** The background work on it: how many packets, how fast, which way. */
  packets: number;
  speed: number;
}

/** How many joins a station wants: one, mostly, sometimes up to five. */
const DEGREE = [0.45, 0.25, 0.15, 0.1, 0.05];
const degree = (rng: Rng): number => {
  let u = rng();
  for (let k = 0; k < DEGREE.length; k++) {
    u -= DEGREE[k] ?? 0;
    if (u <= 0) return k + 1;
  }
  return 1;
};

/** Stations scattered over a 4.6 × 2.2 floor, never closer than `gap`, joined so every one
 *  is reachable (each to its nearest earlier station), then given extra joins to its nearest
 *  neighbours until it has the number it drew. Near joins only, so the picture stays clean. */
export function graph(rng: Rng, n: number): { stations: Station[]; edges: Edge[] } {
  const gap = 0.78;
  const stations: Station[] = [];
  for (let tries = 0; stations.length < n && tries < 4000; tries++) {
    const [x, z] = [(rng() - 0.5) * 4.6, (rng() - 0.5) * 2.2];
    if (stations.every((s) => Math.hypot(s.x - x, s.z - z) >= gap))
      stations.push({
        x,
        z,
        h: 0.08 + rng() * rng() * 0.6,
        r: 0.13 + rng() * 0.12,
        glyph: GLYPHS[Math.floor(rng() * GLYPHS.length)] ?? 'plain',
      });
  }
  // Centred on its bounding box, so a seed that scattered to one side still sits mid-frame.
  const [xs, zs] = [stations.map((s) => s.x), stations.map((s) => s.z)];
  const [mx, mz] = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...zs) + Math.max(...zs)) / 2];
  for (const s of stations) [s.x, s.z] = [s.x - mx, s.z - mz];
  const edges: Edge[] = [];
  const joined = (a: number, b: number): boolean =>
    edges.some((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
  const join = (a: number, b: number): void => {
    edges.push({
      a,
      b,
      xFirst: rng() > 0.5,
      packets: Math.floor(rng() * 4),
      speed: (0.08 + rng() * 0.3) * (rng() > 0.5 ? 1 : -1),
    });
  };
  const dist = (i: number, j: number): number =>
    Math.hypot((stations[i]?.x ?? 0) - (stations[j]?.x ?? 0), (stations[i]?.z ?? 0) - (stations[j]?.z ?? 0));
  for (let i = 1; i < stations.length; i++) {
    const near = Array.from({ length: i }, (_, j) => j).sort((p, q) => dist(i, p) - dist(i, q))[0];
    if (near !== undefined) join(near, i);
  }
  stations.forEach((_, i) => {
    const want = degree(rng);
    const others = stations
      .map((_, j) => j)
      .filter((j) => j !== i)
      .sort((p, q) => dist(i, p) - dist(i, q));
    for (const j of others) {
      const have = edges.filter((e) => e.a === i || e.b === i).length;
      if (have >= want) break;
      if (!joined(i, j) && dist(i, j) < 2.2) join(i, j);
    }
  });
  return { stations, edges };
}

/** The job's walk: `len` stations long, from station 0, always along a join, rarely
 *  straight back the way it came. */
export function walk(edges: readonly Edge[], len: number, rng: Rng): number[] {
  const out = [0];
  for (let k = 1; k < len; k++) {
    const here = out[k - 1] ?? 0;
    const back = out[k - 2];
    const next = edges.flatMap((e) => (e.a === here ? [e.b] : e.b === here ? [e.a] : []));
    const forward = next.filter((j) => j !== back);
    const pool = forward.length ? forward : next;
    out.push(pool[Math.floor(rng() * pool.length)] ?? here);
  }
  return out;
}

/** The trace between two stations: on the floor, along one axis and then the other. */
export function trace(a: Station, b: Station, xFirst = true): Vec3[] {
  return xFirst
    ? [
        [a.x, 0, a.z],
        [b.x, 0, a.z],
        [b.x, 0, b.z],
      ]
    : [
        [a.x, 0, a.z],
        [a.x, 0, b.z],
        [b.x, 0, b.z],
      ];
}
