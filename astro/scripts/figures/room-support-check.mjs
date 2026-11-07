import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const limits = JSON.parse(readFileSync(new URL('./room-support-limits.json', import.meta.url), 'utf8'));
const EPS = limits.contactTolerance;
function bounds(faces) {
  const points = faces.flatMap((s) => s.points);
  return {
    lo: [0, 1, 2].map((k) => Math.min(...points.map((p) => p[k]))),
    hi: [0, 1, 2].map((k) => Math.max(...points.map((p) => p[k]))),
  };
}
function horizontal(s, up) {
  if (!s.face || !s.points.every((p) => Math.abs(p[1] - s.points[0][1]) < EPS)) return false;
  const area = s.points.reduce((sum, p, i, a) => {
    const q = a[(i + 1) % a.length];
    return sum + p[0] * q[2] - q[0] * p[2];
  }, 0);
  return up ? area < -EPS : area > EPS;
}
function inside(s, x, z) {
  let hit = false;
  for (let i = 0, j = s.points.length - 1; i < s.points.length; j = i++) {
    const a = s.points[i],
      b = s.points[j];
    if (a[2] > z !== b[2] > z && x < ((b[0] - a[0]) * (z - a[2])) / (b[2] - a[2]) + a[0]) hit = !hit;
  }
  return hit;
}
// Copied accessories reuse solid ids. Shared vertices identify each actual solid,
// so a book on another shelf cannot accidentally supply this book's support.
function contentSolids(surfaces) {
  const faces = surfaces.filter((s) => s.face && ['book', 'kraft'].includes(s.finish)),
    parent = faces.map((_, i) => i),
    vertices = new Map();
  const root = (i) => (parent[i] === i ? i : (parent[i] = root(parent[i])));
  faces.forEach((s, i) =>
    s.points.forEach((p) => {
      const key = `${s.finish}:${s.solid}:${p.map((q) => Math.round(q / EPS)).join(',')}`;
      if (vertices.has(key)) parent[root(i)] = root(vertices.get(key));
      else vertices.set(key, i);
    }),
  );
  const groups = new Map();
  faces.forEach((s, i) => {
    const key = root(i);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  });
  return [...groups.values()].map((faces) => ({ faces, ...bounds(faces), finish: faces[0].finish }));
}
export function checkRoomSupports(p, parts, plan) {
  let contents = 0;
  for (const part of parts.filter((s) => s.interactive)) {
    const faces = part.model.surfaces,
      tops = faces.filter((s) => horizontal(s, true)),
      solids = contentSolids(faces);
    for (const solid of solids) {
      const x = (solid.lo[0] + solid.hi[0]) / 2,
        z = (solid.lo[2] + solid.hi[2]) / 2,
        y = solid.lo[1];
      // A box lid laps its own cardboard body; this is not a shelf-board exemption.
      const joint = solids.some(
        (b) =>
          b !== solid &&
          b.finish === solid.finish &&
          b.lo[1] < y - EPS &&
          b.hi[1] > y + EPS &&
          b.lo[0] < x &&
          b.hi[0] > x &&
          b.lo[2] < z &&
          b.hi[2] > z,
      );
      assert(
        joint ||
          Math.abs(y - plan.floor) < EPS ||
          tops.some((s) => Math.abs(s.points[0][1] - y) < EPS && inside(s, x, z)),
        `Unsupported shelf contents: ${p.theme.id}/${part.label} at ${JSON.stringify([x, y, z])}`,
      );
      contents++;
    }
  }
  const wall = parts.filter((s) => s.mount === 'wall');
  const anchored = new Set(
    wall.filter((part) => {
      const axis = part.side === 'back' ? 2 : 0,
        sign = part.side === 'right' ? -1 : 1,
        other = axis === 2 ? [0, 1] : [1, 2],
        b = part.model.bounds;
      return parts
        .filter((s) => !s.interactive && !s.cutaway && s.side === part.side)
        .some((host) =>
          host.model.surfaces.some((face) => {
            if (!face.face || !face.points.every((p) => Math.abs(p[axis] - face.points[0][axis]) < EPS)) return false;
            const [u, v] = other,
              area = face.points.reduce((sum, p, i, points) => {
                const q = points[(i + 1) % points.length];
                return sum + p[u] * q[v] - q[u] * p[v];
              }, 0);
            if (area * sign <= EPS) return false;
            const rear = sign > 0 ? b.lo[axis] : b.hi[axis],
              gap = sign * (rear - face.points[0][axis]),
              h = bounds([face]);
            return (
              gap <= limits.wallStandOffMax + EPS &&
              other.every((k) => b.hi[k] > h.lo[k] + EPS && b.lo[k] < h.hi[k] - EPS)
            );
          }),
        );
    }),
  );
  const touch = (a, b) =>
    [0, 1, 2].every((k) => a.lo[k] <= b.hi[k] + EPS && a.hi[k] >= b.lo[k] - EPS) &&
    [0, 1, 2].some((k) => Math.abs(a.hi[k] - b.lo[k]) < EPS || Math.abs(b.hi[k] - a.lo[k]) < EPS);
  for (let changed = true; changed; ) {
    changed = false;
    for (const part of wall)
      if (!anchored.has(part) && [...anchored].some((a) => touch(a.model.bounds, part.model.bounds))) {
        anchored.add(part);
        changed = true;
      }
  }
  for (const part of wall) assert(anchored.has(part), `Floating wall fixture: ${p.theme.id}/${part.label}`);
  return contents;
}
