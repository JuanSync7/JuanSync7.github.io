/** Independent audit geometry. Coordinates use drawing units, never rounded screen pixels. */
export const EPS = 1e-8;
export const finitePoint = (p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);
export const samePoint = (a, b, epsilon = EPS) => Math.hypot(a[0] - b[0], a[1] - b[1]) <= epsilon;
export const validBox = (b) =>
  Array.isArray(b) && b.length === 4 && b.every(Number.isFinite) && b[2] - b[0] > EPS && b[3] - b[1] > EPS;
export const insideBox = (p, b, strict = false) =>
  strict
    ? p[0] > b[0] + EPS && p[0] < b[2] - EPS && p[1] > b[1] + EPS && p[1] < b[3] - EPS
    : p[0] >= b[0] - EPS && p[0] <= b[2] + EPS && p[1] >= b[1] - EPS && p[1] <= b[3] + EPS;
export const boxOverlapInterior = (a, b) =>
  Math.min(a[2], b[2]) - Math.max(a[0], b[0]) > EPS && Math.min(a[3], b[3]) - Math.max(a[1], b[1]) > EPS;
export const segmentLength = ([x0, y0, x1, y1]) => Math.hypot(x1 - x0, y1 - y0);
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const subtract = (a, b) => [a[0] - b[0], a[1] - b[1]];
const endpoints = (s) => [
  [s[0], s[1]],
  [s[2], s[3]],
];

export function polylineSegments(points, closed = false) {
  const out = points.slice(1).map((b, i) => [...points[i], ...b]);
  if (closed && points.length > 1 && !samePoint(points[0], points.at(-1))) out.push([...points.at(-1), ...points[0]]);
  return out;
}

export function pointOnSegment(point, segment, epsilon = EPS) {
  const [a, b] = endpoints(segment);
  const delta = subtract(b, a),
    relative = subtract(point, a);
  const length = Math.hypot(...delta);
  if (length <= epsilon) return samePoint(point, a, epsilon);
  if (Math.abs(cross(delta, relative)) > epsilon * length) return false;
  const dot = delta[0] * relative[0] + delta[1] * relative[1];
  return dot >= -epsilon * length && dot <= length * length + epsilon * length;
}

/** Endpoints and segment interiors both count; matching only vertices misses T junctions. */
export const pointOnPolyline = (point, points, epsilon = EPS) =>
  points.length === 1
    ? samePoint(point, points[0], epsilon)
    : polylineSegments(points).some((segment) => pointOnSegment(point, segment, epsilon));

/** Proves every part of an intended segment exists in emitted linework, allowing splits.
 * Checking only endpoints/midpoints can incorrectly approve a wire with an invisible gap. */
export function segmentCoveredByLinework(segment, linework, epsilon = EPS) {
  const [a, b] = endpoints(segment),
    delta = subtract(b, a),
    length = Math.hypot(...delta);
  if (length <= epsilon) return false;
  const squared = length * length,
    tolerance = epsilon / length;
  const intervals = [];
  for (const candidate of linework) {
    const [c, d] = endpoints(candidate);
    if (
      Math.abs(cross(delta, subtract(c, a))) > epsilon * length ||
      Math.abs(cross(delta, subtract(d, a))) > epsilon * length
    )
      continue;
    const project = (p) => ((p[0] - a[0]) * delta[0] + (p[1] - a[1]) * delta[1]) / squared;
    const first = project(c),
      last = project(d);
    const low = Math.max(0, Math.min(first, last)),
      high = Math.min(1, Math.max(first, last));
    if (high >= low) intervals.push([low, high]);
  }
  intervals.sort((first, second) => first[0] - second[0]);
  let covered = 0;
  for (const [low, high] of intervals) {
    if (low > covered + tolerance) return false;
    covered = Math.max(covered, high);
    if (covered >= 1 - tolerance) return true;
  }
  return false;
}

export const routeCoveredByLinework = (points, linework, epsilon = EPS) =>
  points.length >= 2 &&
  polylineSegments(points).every((segment) => segmentCoveredByLinework(segment, linework, epsilon));

/** Distinguishes an X crossing, one-point touch, and a shared run. No slope division. */
export function segmentIntersection(first, second) {
  const [a, b] = endpoints(first),
    [c, d] = endpoints(second);
  const r = subtract(b, a),
    s = subtract(d, c),
    delta = subtract(c, a);
  const lr = Math.hypot(...r),
    ls = Math.hypot(...s);
  if (lr <= EPS || ls <= EPS) {
    const p = lr <= EPS ? a : c,
      other = lr <= EPS ? second : first;
    return pointOnSegment(p, other) ? { type: 'touch', point: p } : { type: 'none' };
  }
  const determinant = cross(r, s);
  if (Math.abs(determinant) > EPS * lr * ls) {
    const t = cross(delta, s) / determinant,
      u = cross(delta, r) / determinant;
    if (t < -EPS || t > 1 + EPS || u < -EPS || u > 1 + EPS) return { type: 'none' };
    const point = [a[0] + t * r[0], a[1] + t * r[1]];
    return { type: t > EPS && t < 1 - EPS && u > EPS && u < 1 - EPS ? 'proper' : 'touch', point };
  }
  if (Math.abs(cross(delta, r)) > EPS * lr) return { type: 'none' };
  const axis = Math.abs(r[0]) >= Math.abs(r[1]) ? 0 : 1;
  const t0 = (c[axis] - a[axis]) / r[axis],
    t1 = (d[axis] - a[axis]) / r[axis];
  const lo = Math.max(0, Math.min(t0, t1)),
    hi = Math.min(1, Math.max(t0, t1));
  if (hi < lo - EPS) return { type: 'none' };
  const start = [a[0] + lo * r[0], a[1] + lo * r[1]],
    end = [a[0] + hi * r[0], a[1] + hi * r[1]];
  return samePoint(start, end) ? { type: 'touch', point: start } : { type: 'overlap', range: [start, end] };
}

/** True only for positive travel through an open rectangle; a boundary run is clear. */
export function segmentHitsBoxInterior(segment, box) {
  if (!validBox(box) || segmentLength(segment) <= EPS) return false;
  const [a, b] = endpoints(segment),
    delta = subtract(b, a);
  let enter = 0,
    exit = 1;
  for (let axis = 0; axis < 2; axis++) {
    const low = box[axis] + EPS,
      high = box[axis + 2] - EPS;
    if (Math.abs(delta[axis]) <= EPS) {
      if (a[axis] <= low || a[axis] >= high) return false;
      continue;
    }
    const t0 = (low - a[axis]) / delta[axis],
      t1 = (high - a[axis]) / delta[axis];
    enter = Math.max(enter, Math.min(t0, t1));
    exit = Math.min(exit, Math.max(t0, t1));
    if (exit <= enter) return false;
  }
  return exit > enter && exit > 0 && enter < 1;
}

export const routeHitsBoxInterior = (points, box) =>
  polylineSegments(points).some((segment) => segmentHitsBoxInterior(segment, box));
export const orthogonalRoute = (points) =>
  points.length >= 2 &&
  points.every(finitePoint) &&
  polylineSegments(points).every(([x0, y0, x1, y1]) => Math.abs(x0 - x1) <= EPS || Math.abs(y0 - y1) <= EPS);

/** Endpoint joins are permitted only when BOTH routes terminate there. A T/X join needs a junction declaration. */
export function routeConflicts(first, second, { allowSharedEndpoints = true } = {}) {
  const conflicts = [];
  for (const [i, a] of polylineSegments(first).entries())
    for (const [j, b] of polylineSegments(second).entries()) {
      const hit = segmentIntersection(a, b);
      if (hit.type === 'none') continue;
      const terminal = (p, route) => samePoint(p, route[0]) || samePoint(p, route.at(-1));
      if (hit.type === 'touch' && allowSharedEndpoints && terminal(hit.point, first) && terminal(hit.point, second))
        continue;
      conflicts.push({ first: i, second: j, ...hit });
    }
  return conflicts;
}

/** Adjacent segments may share their vertex, but may not double back over each other. */
export function selfIntersections(points, closed = false) {
  const segments = polylineSegments(points, closed),
    out = [];
  for (let i = 0; i < segments.length; i++)
    for (let j = i + 1; j < segments.length; j++) {
      const hit = segmentIntersection(segments[i], segments[j]);
      if (hit.type === 'none') continue;
      const adjacent = j === i + 1 || (closed && i === 0 && j === segments.length - 1);
      if (adjacent && hit.type === 'touch') continue;
      out.push({ first: i, second: j, ...hit });
    }
  return out;
}

/** Explicit topology, independent of visually close coordinates. Edges are [from,to]. */
export function reachable(start, edges, directed = false) {
  const graph = new Map();
  for (const [from, to] of edges) {
    if (!graph.has(from)) graph.set(from, []);
    graph.get(from).push(to);
    if (!directed) {
      if (!graph.has(to)) graph.set(to, []);
      graph.get(to).push(from);
    }
  }
  const seen = new Set([start]),
    queue = [start];
  for (let i = 0; i < queue.length; i++)
    for (const next of graph.get(queue[i]) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  return seen;
}

/** Checks the emitted segments, not just a generator's semantic model. */
export function inspectLinework(plan, bound, aperture) {
  const issues = [];
  for (const [tone, segments] of plan.segs.entries())
    for (const [index, segment] of segments.entries()) {
      const at = `tone ${tone} segment ${index}`;
      if (!Array.isArray(segment) || segment.length !== 4 || !segment.every(Number.isFinite)) {
        issues.push(`${at}: nonfinite or malformed`);
        continue;
      }
      if (segmentLength(segment) <= EPS) issues.push(`${at}: zero length`);
      if (!insideBox(segment.slice(0, 2), bound) || !insideBox(segment.slice(2), bound))
        issues.push(`${at}: outside bounds`);
      if (aperture && segmentHitsBoxInterior(segment, aperture)) issues.push(`${at}: crosses selected aperture`);
    }
  for (const [index, point] of plan.dots.entries()) {
    if (!finitePoint(point) || !insideBox(point, bound)) issues.push(`dot ${index}: outside bounds or nonfinite`);
    else if (aperture && insideBox(point, aperture, true)) issues.push(`dot ${index}: inside selected aperture`);
  }
  return issues;
}
