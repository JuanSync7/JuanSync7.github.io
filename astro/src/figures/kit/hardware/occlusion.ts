import type { ProjectedSurface } from './scene';

/** Hide stroke intervals behind front faces of their own solid. Other solids retain
 * painter-order occlusion. Wireframe bypasses this, preserving intentional rear edges. */
export function visibleStrokes(surfaces: ProjectedSurface[]): ProjectedSurface[] {
  const faces = surfaces.filter((s) => s.face && s.area > 0.00001);
  const contains = (face: ProjectedSurface, x: number, y: number): boolean => {
    let hit = false;
    for (let i = 0, j = face.points.length - 1; i < face.points.length; j = i++) {
      const a = face.points[i]!,
        b = face.points[j]!;
      if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) hit = !hit;
    }
    return hit;
  };
  const planes = faces
    .map((face) => {
      const a = face.points[0]!,
        da = face.depths[0]!;
      for (let i = 1; i + 1 < face.points.length; i++) {
        const b = face.points[i]!,
          c = face.points[i + 1]!;
        const det = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
        if (Math.abs(det) < 1e-10) continue;
        const db = face.depths[i]! - da,
          dc = face.depths[i + 1]! - da;
        const dx = (db * (c[1] - a[1]) - dc * (b[1] - a[1])) / det;
        const dy = ((b[0] - a[0]) * dc - (c[0] - a[0]) * db) / det;
        return {
          face,
          dx,
          dy,
          origin: da - dx * a[0] - dy * a[1],
          lo: [Math.min(...face.points.map((p) => p[0])), Math.min(...face.points.map((p) => p[1]))],
          hi: [Math.max(...face.points.map((p) => p[0])), Math.max(...face.points.map((p) => p[1]))],
        };
      }
      return null;
    })
    .filter((plane) => plane !== null);
  return surfaces.flatMap((s): ProjectedSurface[] => {
    if (s.face || !planes.length) return [s];
    const result: ProjectedSurface[] = [];
    let run: ProjectedSurface | undefined;
    for (let i = 1; i < s.points.length; i++) {
      const a = s.points[i - 1]!,
        b = s.points[i]!;
      const da = s.depths[i - 1]!,
        db = s.depths[i]!;
      const vx = b[0] - a[0],
        vy = b[1] - a[1];
      const candidates = planes.filter(
        (p) =>
          Math.min(a[0], b[0]) <= p.hi[0]! &&
          Math.max(a[0], b[0]) >= p.lo[0]! &&
          Math.min(a[1], b[1]) <= p.hi[1]! &&
          Math.max(a[1], b[1]) >= p.lo[1]! &&
          Math.max(p.dx * a[0] + p.dy * a[1] + p.origin - da, p.dx * b[0] + p.dy * b[1] + p.origin - db) > 0.00001,
      );
      const stops = [0, 1];
      for (const p of candidates) {
        // The stroke can also enter/leave an occluder through its depth plane.
        const start = p.dx * a[0] + p.dy * a[1] + p.origin - da;
        const delta = p.dx * vx + p.dy * vy - (db - da);
        if (Math.abs(delta) > 1e-10) {
          const t = -start / delta;
          if (t > 0 && t < 1) stops.push(t);
        }
        p.face.points.forEach((c, j) => {
          const d = p.face.points[(j + 1) % p.face.points.length]!;
          const ex = d[0] - c[0],
            ey = d[1] - c[1],
            det = vx * ey - vy * ex;
          if (Math.abs(det) < 1e-10) return;
          const t = ((c[0] - a[0]) * ey - (c[1] - a[1]) * ex) / det;
          const u = ((c[0] - a[0]) * vy - (c[1] - a[1]) * vx) / det;
          if (t > 0 && t < 1 && u >= 0 && u <= 1) stops.push(t);
        });
      }
      stops.sort((x, y) => x - y);
      for (let j = 1; j < stops.length; j++) {
        const low = stops[j - 1]!,
          high = stops[j]!;
        if (high - low < 1e-10) continue;
        const t = (low + high) / 2,
          x = a[0] + vx * t,
          y = a[1] + vy * t,
          depth = da + (db - da) * t;
        if (candidates.some((p) => contains(p.face, x, y) && p.dx * x + p.dy * y + p.origin > depth + 0.00001)) {
          run = undefined;
          continue;
        }
        const from: [number, number] = [a[0] + vx * low, a[1] + vy * low];
        const to: [number, number] = [a[0] + vx * high, a[1] + vy * high];
        const last = run?.points.at(-1);
        if (run && last && Math.hypot(last[0] - from[0], last[1] - from[1]) < 1e-8) {
          const previous = run.points.at(-2)!;
          const ux = last[0] - previous[0],
            uy = last[1] - previous[1];
          const wx = to[0] - last[0],
            wy = to[1] - last[1];
          if (Math.abs(ux * wy - uy * wx) < 1e-10 && ux * wx + uy * wy >= 0) {
            run.points[run.points.length - 1] = to;
            run.depths[run.depths.length - 1] = da + (db - da) * high;
          } else {
            run.points.push(to);
            run.depths.push(da + (db - da) * high);
          }
        } else {
          run = { ...s, points: [from, to], depths: [da + (db - da) * low, da + (db - da) * high] };
          result.push(run);
        }
      }
    }
    return result;
  });
}
