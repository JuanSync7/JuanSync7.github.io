import type { Vec3 } from './camera';
import type { PropModel, TableSurface } from './tableparts';
import type { RoomView } from './roomview';

export interface FlatFace {
  surface: TableSurface;
  points: Vec3[];
}
interface Plane {
  n: Vec3;
  d: number;
}
interface Node {
  plane?: Plane;
  same: FlatFace[];
  front?: Node;
  back?: Node;
}
const EPS = 1e-7;
const trees = new WeakMap<PropModel, Node>();
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
function plane(points: Vec3[]): Plane | undefined {
  const a = points[0];
  if (!a) return;
  for (let i = 1; i + 1 < points.length; i++) {
    const b = points[i],
      c = points[i + 1];
    if (!b || !c) continue;
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
      v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n: Vec3 = [
      (u[1] ?? 0) * (v[2] ?? 0) - (u[2] ?? 0) * (v[1] ?? 0),
      (u[2] ?? 0) * (v[0] ?? 0) - (u[0] ?? 0) * (v[2] ?? 0),
      (u[0] ?? 0) * (v[1] ?? 0) - (u[1] ?? 0) * (v[0] ?? 0),
    ];
    const length = Math.hypot(...n);
    if (length > EPS) {
      const unit: Vec3 = [n[0] / length, n[1] / length, n[2] / length];
      return { n: unit, d: dot(unit, a) };
    }
  }
}
function side(face: FlatFace, p: Plane): number {
  let front = false,
    back = false;
  for (const q of face.points) {
    const d = dot(p.n, q) - p.d;
    front ||= d > EPS;
    back ||= d < -EPS;
  }
  return front && back ? 2 : front ? 1 : back ? -1 : 0;
}
function split(face: FlatFace, p: Plane): [FlatFace | undefined, FlatFace | undefined] {
  const front: Vec3[] = [],
    back: Vec3[] = [];
  const points = face.points;
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length];
    if (!a || !b) continue;
    const da = dot(p.n, a) - p.d,
      db = dot(p.n, b) - p.d;
    if (da >= -EPS) front.push(a);
    if (da <= EPS) back.push(a);
    if ((!face.surface.face && i === points.length - 1) || da * db >= -EPS * EPS) continue;
    const t = da / (da - db),
      q: Vec3 = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])];
    front.push(q);
    back.push(q);
  }
  const minimum = face.surface.face ? 3 : 2;
  return [
    front.length >= minimum ? { ...face, points: front } : undefined,
    back.length >= minimum ? { ...face, points: back } : undefined,
  ];
}
function build(faces: FlatFace[]): Node {
  let choice: Plane | undefined,
    score = Infinity;
  const candidates = faces.filter((f) => f.surface.face);
  for (let i = 0; i < candidates.length; i += Math.max(1, Math.floor(candidates.length / 10))) {
    const face = candidates[i],
      p = face && plane(face.points);
    if (!p) continue;
    let front = 0,
      back = 0,
      cut = 0;
    for (const f of faces) {
      const s = side(f, p);
      if (s === 2) cut++;
      else if (s > 0) front++;
      else if (s < 0) back++;
    }
    const cost = cut * 6 + Math.abs(front - back);
    if (cost < score) {
      score = cost;
      choice = p;
    }
  }
  if (!choice) return { same: faces };
  const same: FlatFace[] = [],
    front: FlatFace[] = [],
    back: FlatFace[] = [];
  for (const f of faces) {
    const s = side(f, choice);
    if (s === 2) {
      const [a, b] = split(f, choice);
      if (a) front.push(a);
      if (b) back.push(b);
    } else if (s > 0) front.push(f);
    else if (s < 0) back.push(f);
    else same.push(f);
  }
  return {
    plane: choice,
    same: same.sort((a, b) => Number(Boolean(b.surface.face)) - Number(Boolean(a.surface.face))),
    ...(front.length ? { front: build(front) } : {}),
    ...(back.length ? { back: build(back) } : {}),
  };
}
/** Split intersecting planes once per assembly; a tall case cannot paint over its own books. */
export function orderedRoomFaces(model: PropModel, view: RoomView): FlatFace[] {
  let tree = trees.get(model);
  if (!tree) {
    const faces = model.surfaces.flatMap((surface): FlatFace[] => {
      if (!surface.face)
        return surface.points.slice(1).flatMap((b, i) => {
          const a = surface.points[i];
          return a ? [{ surface, points: [a, b] }] : [];
        });
      const p = plane(surface.points);
      if (!p) return [];
      if (surface.points.every((q) => Math.abs(dot(p.n, q) - p.d) < EPS)) return [{ surface, points: surface.points }];
      const a = surface.points[0];
      return surface.points.slice(1, -1).flatMap((b, i) => {
        const c = surface.points[i + 2];
        return a && c ? [{ surface, points: [a, b, c] }] : [];
      });
    });
    tree = build(faces);
    trees.set(model, tree);
  }
  const out: FlatFace[] = [],
    parallel = !Number.isFinite(view.projection.dist);
  const eye: Vec3 = parallel
    ? [view.position[0] - view.target[0], view.position[1] - view.target[1], view.position[2] - view.target[2]]
    : view.position;
  const visit = (node?: Node): void => {
    if (!node) return;
    const front = !node.plane || dot(node.plane.n, eye) - (parallel ? 0 : node.plane.d) >= 0;
    visit(front ? node.back : node.front);
    out.push(...node.same);
    visit(front ? node.front : node.back);
  };
  visit(tree);
  return out;
}
