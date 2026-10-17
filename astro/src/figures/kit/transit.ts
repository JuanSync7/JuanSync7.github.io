import type { Vec3 } from './camera';
import type { Seg } from './shapes';

/** What runs between the islands of a city (`kit/islands.ts`): monorail tracks with their
 *  rails and ties, power cables that sag between towers, flight arcs, orbits, and a low-poly
 *  wire airliner. Pure geometry: polylines and segment endpoints, for any renderer. */

/** The point on the edge of a w × d board at (cx, cz) that faces the point (tx, tz). */
export function edgePoint(cx: number, cz: number, w: number, d: number, tx: number, tz: number): [number, number] {
  const [dx, dz] = [tx - cx, tz - cz];
  const s = Math.min(w / 2 / Math.max(Math.abs(dx), 1e-6), d / 2 / Math.max(Math.abs(dz), 1e-6));
  return [cx + dx * s, cz + dz * s];
}

/** A curve from a to b, lifted by `rise` in the middle (negative sags) and bowed sideways by
 *  `bow`, sampled at n + 1 points. Tracks rise a little, cables sag, flights climb high. */
export function arc(a: Vec3, b: Vec3, rise: number, bow = 0, n = 28): Vec3[] {
  const [nx, nz] = [-(b[2] - a[2]), b[0] - a[0]];
  const len = Math.hypot(nx, nz) || 1;
  return Array.from({ length: n + 1 }, (_, i) => {
    const s = i / n;
    const lift = Math.sin(Math.PI * s);
    // Ease the ends so a track leaves its platform level, then climbs.
    const e = s * s * (3 - 2 * s);
    return [
      a[0] + (b[0] - a[0]) * s + (nx / len) * bow * lift,
      a[1] + (b[1] - a[1]) * e + rise * lift,
      a[2] + (b[2] - a[2]) * s + (nz / len) * bow * lift,
    ];
  });
}

/** Consecutive segments of a polyline, as endpoints. */
export const strip = (pts: readonly Vec3[]): number[] => pts.slice(1).flatMap((b, i) => [...(pts[i] ?? b), ...b]);

/** A monorail's beam drawn as two rails `gauge` apart with a tie every `every` points. */
export function rails(pts: readonly Vec3[], gauge: number, every = 2): number[] {
  const out: number[] = [];
  const side = pts.map((p, i): Vec3 => {
    const a = pts[Math.max(0, i - 1)] ?? p;
    const b = pts[Math.min(pts.length - 1, i + 1)] ?? p;
    const [dx, dz] = [b[0] - a[0], b[2] - a[2]];
    const l = Math.hypot(dx, dz) || 1;
    return [(-dz / l) * gauge * 0.5, 0, (dx / l) * gauge * 0.5];
  });
  for (const s of [1, -1])
    out.push(...strip(pts.map((p, i): Vec3 => [p[0] + (side[i]?.[0] ?? 0) * s, p[1], p[2] + (side[i]?.[2] ?? 0) * s])));
  pts.forEach((p, i) => {
    const o = side[i] ?? [0, 0, 0];
    if (i % every === 0) out.push(p[0] + o[0], p[1], p[2] + o[2], p[0] - o[0], p[1], p[2] - o[2]);
  });
  return out;
}

/** A point on a tilted circular orbit of radius r round (0, y, 0), at angle a. */
export function orbit(r: number, y: number, tilt: number, turn: number, a: number): Vec3 {
  const [x, z] = [Math.cos(a) * r, Math.sin(a) * r];
  const [yy, zz] = [Math.sin(tilt) * z, Math.cos(tilt) * z];
  return [x * Math.cos(turn) - zz * Math.sin(turn), y + yy, x * Math.sin(turn) + zz * Math.cos(turn)];
}

/** Wire segments as endpoints. */
export const ends = (segs: readonly Seg[]): number[] => segs.flatMap(([a, b]) => [...a, ...b]);

/** A low-poly airliner one unit long, nose toward +z: a six-sided fuselage tapering to nose
 *  and tail, swept wings, a tailplane and a fin. */
export function airliner(): number[] {
  const p: number[] = [];
  const ring = (z: number, r: number): Vec3[] =>
    Array.from(
      { length: 6 },
      (_, i): Vec3 => [Math.cos((i / 6) * Math.PI * 2) * r, Math.sin((i / 6) * Math.PI * 2) * r, z],
    );
  const rings = [ring(-0.5, 0.02), ring(-0.3, 0.06), ring(0.3, 0.06), ring(0.45, 0.03)];
  rings.forEach((q, j) =>
    q.forEach((v, i) => {
      const n = q[(i + 1) % 6] ?? v;
      p.push(...v, ...n);
      const next = rings[j + 1]?.[i];
      if (next) p.push(...v, ...next);
      else p.push(...v, 0, 0, 0.5);
    }),
  );
  for (const s of [1, -1]) {
    // Wing, then tailplane: root front, tip, root back, closed.
    const wing: Vec3[] = [
      [0.05 * s, 0, 0.12],
      [0.5 * s, 0.02, -0.12],
      [0.5 * s, 0.02, -0.2],
      [0.05 * s, 0, -0.08],
    ];
    const tail: Vec3[] = [
      [0.03 * s, 0, -0.36],
      [0.18 * s, 0, -0.48],
      [0.18 * s, 0, -0.52],
      [0.02 * s, 0, -0.48],
    ];
    for (const q of [wing, tail]) p.push(...strip([...q, q[0] ?? [0, 0, 0]]));
  }
  p.push(
    ...strip([
      [0, 0.05, -0.32],
      [0, 0.2, -0.48],
      [0, 0.2, -0.53],
      [0, 0.03, -0.5],
    ]),
  );
  return p;
}
