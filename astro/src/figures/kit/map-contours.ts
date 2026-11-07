import { BOUND, type Pt, type Seg } from './sketch';
import type { Contour } from './map-types';

/** One triangulated elevation grid owns every contour, eliminating crossing independent blobs. */
export function contours(elevation: (x: number, y: number) => number, levels: readonly number[]): Contour[] {
  const nx = 72;
  const ny = 36;
  const points: Pt[] = [];
  const heights: number[] = [];
  for (let j = 0; j <= ny; j++)
    for (let i = 0; i <= nx; i++) {
      const p: Pt = [BOUND[0] + ((BOUND[2] - BOUND[0]) * i) / nx, BOUND[1] + ((BOUND[3] - BOUND[1]) * j) / ny];
      points.push(p);
      heights.push(elevation(...p));
    }
  const result: Contour[] = [];
  for (const level of levels) {
    const segs: Seg[] = [];
    const triangle = (ids: [number, number, number]): void => {
      const crossings: Pt[] = [];
      for (let k = 0; k < 3; k++) {
        const ai = ids[k];
        const bi = ids[(k + 1) % 3];
        if (ai === undefined || bi === undefined) continue;
        const a = points[Math.min(ai, bi)];
        const b = points[Math.max(ai, bi)];
        const za = heights[Math.min(ai, bi)];
        const zb = heights[Math.max(ai, bi)];
        if (!a || !b || za === undefined || zb === undefined || za < level === zb < level) continue;
        const t = (level - za) / (zb - za);
        crossings.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
      const a = crossings[0];
      const b = crossings[1];
      if (a && b && Math.hypot(a[0] - b[0], a[1] - b[1]) > 1e-14) segs.push([...a, ...b]);
    };
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const a = j * (nx + 1) + i;
        triangle([a, a + 1, a + nx + 2]);
        triangle([a, a + nx + 2, a + nx + 1]);
      }
    result.push(...stitch(segs).map((pts) => ({ elevation: level, points: pts })));
  }
  return result;
}

/** Shared grid edges produce identical endpoints; stitching keeps the drawing and checks topological. */
function stitch(segs: Seg[]): Pt[][] {
  const key = ([x, y]: Pt): string => `${x},${y}`;
  const ends = new Map<string, number[]>();
  segs.forEach((s, i) => {
    for (const p of [
      [s[0], s[1]],
      [s[2], s[3]],
    ] as Pt[]) {
      const k = key(p);
      const list = ends.get(k) ?? [];
      list.push(i);
      ends.set(k, list);
    }
  });
  const used = new Set<number>();
  const paths: Pt[][] = [];
  const walk = (index: number, start: Pt): Pt[] => {
    const path = [start];
    let k = index;
    while (!used.has(k)) {
      const s = segs[k];
      const last = path[path.length - 1];
      if (!s || !last) break;
      used.add(k);
      const a: Pt = [s[0], s[1]];
      const b: Pt = [s[2], s[3]];
      const next = key(last) === key(a) ? b : a;
      path.push(next);
      const adjacent = ends.get(key(next))?.find((candidate) => !used.has(candidate));
      if (adjacent === undefined) break;
      k = adjacent;
    }
    return path;
  };
  for (const [k, indices] of ends) {
    if (indices.length !== 1) continue;
    const index = indices[0];
    const s = index === undefined ? undefined : segs[index];
    if (index === undefined || !s || used.has(index)) continue;
    const a: Pt = [s[0], s[1]];
    paths.push(walk(index, key(a) === k ? a : [s[2], s[3]]));
  }
  segs.forEach((s, i) => {
    if (!used.has(i)) paths.push(walk(i, [s[0], s[1]]));
  });
  return paths
    .map((path) =>
      path.filter(
        (point, i) =>
          i === 0 ||
          Math.hypot(point[0] - (path[i - 1]?.[0] ?? point[0]), point[1] - (path[i - 1]?.[1] ?? point[1])) > 1e-8,
      ),
    )
    .filter((path) => path.length > 1);
}
