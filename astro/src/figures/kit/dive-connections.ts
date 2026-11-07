import type { ArchitecturePlan } from './architecture-plan';
import type { UrbanBlockPlan } from './urban-block';
import { R, WX, WY, within, type Box, type Linework, type Plan, type Pt, type Seg } from './sketch';

export interface NestOpening {
  opening: [Pt, Pt];
  center: Pt;
  width: number;
}

export interface NestRoute {
  id: 'front' | 'rear' | 'wing';
  source: NestOpening;
  target: NestOpening;
  centerline: Pt[];
  curbs: [Pt[], Pt[]];
}

export interface NestConnection {
  kind: 'street-building' | 'wing-floor';
  aperture: Box;
  childShell: Box;
  routes: NestRoute[];
  linework: Linework;
}

const object = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const architecture = (v: unknown): v is ArchitecturePlan =>
  object(v) &&
  v.kind === 'architecture' &&
  Array.isArray(v.rooms) &&
  Array.isArray(v.entrances) &&
  Array.isArray(v.shell);
const urban = (v: unknown): v is UrbanBlockPlan => object(v) && v.kind === 'urban-block' && Array.isArray(v.lots);
const opening = (a: Pt, b: Pt): NestOpening => ({
  opening: [[...a], [...b]],
  center: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
  width: Math.hypot(b[0] - a[0], b[1] - a[1]),
});
const aperture = (p: Plan): Box => [p.w[0] - WX, p.w[1] - WY, p.w[0] + WX, p.w[1] + WY];
const sources = (p: Plan): { id: NestRoute['id']; source: NestOpening }[] => {
  if (urban(p.model)) {
    const lot = p.model.lots.find((l) => l.selected);
    if (!lot) return [];
    return (
      [
        ['front', lot.path[0]],
        ['rear', lot.rearAccess[0]],
      ] as const
    ).map(([id, pt]) => ({ id, source: opening([pt[0] - 0.0125, pt[1]], [pt[0] + 0.0125, pt[1]]) }));
  }
  if (architecture(p.model)) {
    const room = p.model.rooms.find((r) => r.selected);
    return room ? [{ id: 'wing', source: opening(...room.door.opening) }] : [];
  }
  return [];
};

/** The inspection frame remains continuous except at the real approach doorway. */
export function selectedOutline(parent: Plan): Seg[] {
  const [x0, y0, x1, y1] = aperture(parent);
  const outline: Seg[] = [
    [x0, y0, x0, y1],
    [x1, y0, x1, y1],
  ];
  for (const y of [y0, y1]) {
    const gaps = sources(parent)
      .map((s) => s.source.opening)
      .filter(([a]) => Math.abs(a[1] - y) < 1e-8)
      .sort((a, b) => a[0][0] - b[0][0]);
    let x = x0;
    for (const [a, b] of gaps) {
      if (a[0] > x) outline.push([x, y, a[0], y]);
      x = Math.max(x, b[0]);
    }
    if (x < x1) outline.push([x, y, x1, y]);
  }
  return outline;
}

const unit = (a: Pt, b: Pt): Pt => {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
};

/** Orthogonal ribbon with mitred turns; only the first leg tapers. */
function porchCurbs(points: Pt[], fromWidth: number, width: number): [Pt[], Pt[]] {
  const normals = points.slice(1).map((p, i): Pt => {
    const direction = unit(points[i] ?? p, p);
    return [-direction[1], direction[0]];
  });
  const curb = (side: number): Pt[] =>
    points.map((p, i): Pt => {
      const before = normals[Math.max(0, i - 1)] ?? [0, 0];
      const after = normals[Math.min(normals.length - 1, i)] ?? before;
      if (i === 0) return [p[0] + (after[0] * fromWidth * side) / 2, p[1] + (after[1] * fromWidth * side) / 2];
      if (i === points.length - 1)
        return [p[0] + (before[0] * width * side) / 2, p[1] + (before[1] * width * side) / 2];
      return [p[0] + ((before[0] + after[0]) * width * side) / 2, p[1] + ((before[1] + after[1]) * width * side) / 2];
    });
  return [curb(-1), curb(1)];
}

/** A narrow wing margin cannot fit a dogleg as wide as its doorway. Taper directly
 * into its access column before reaching the child facade, then turn through its door. */
function wingCurbs(
  source: NestOpening,
  target: NestOpening,
  marginX: number,
  porchY: number,
  front: number,
): [Pt[], Pt[]] {
  const sideToChild = Math.sign(target.center[0] - marginX);
  const curb = (side: number): Pt[] => {
    const x = marginX + (front * side * target.width) / 2;
    const y = target.center[1] + (sideToChild * side * target.width) / 2;
    return [
      [source.center[0] + (front * side * source.width) / 2, source.center[1]],
      [x, porchY],
      [x, y],
      [target.center[0], y],
    ];
  };
  return [curb(-1), curb(1)];
}

/** All points are in the parent's drawing coordinates. Curbs join physical openings,
 * stay in the empty frame margin, and never draw a route through a child's room. */
export function nestConnections(parent: Plan, child: Plan): NestConnection | null {
  if (
    !architecture(child.model) ||
    (!urban(parent.model) && !(architecture(parent.model) && parent.model.scale === 'building'))
  )
    return null;
  const project = ([x, y]: Pt): Pt => [parent.w[0] + x / R, parent.w[1] + y / R];
  const shell = child.model.shell;
  const childShell: Box = [
    parent.w[0] + shell[0] / R,
    parent.w[1] + shell[1] / R,
    parent.w[0] + shell[2] / R,
    parent.w[1] + shell[3] / R,
  ];
  const win = aperture(parent);
  if (!within(childShell, win)) return null;
  const entrances = child.model.entrances
    .map(([a, b]) => opening(project(a), project(b)))
    .sort((a, b) => a.center[0] - b.center[0]);
  const routes: NestRoute[] = [];
  const linework: Linework = { segs: [[], [], []], dots: [] };
  for (const item of sources(parent)) {
    const target = item.id === 'rear' ? entrances[entrances.length - 1] : entrances[0];
    if (!target) continue;
    const front = item.source.center[1] < parent.w[1] ? -1 : 1;
    const targetSide = target.center[0] < parent.w[0] ? -1 : 1;
    const marginX = ((targetSide < 0 ? win[0] : win[2]) + target.center[0]) / 2;
    const shellFront = front < 0 ? childShell[1] : childShell[3];
    const porchY = (item.source.center[1] + shellFront) / 2;
    const centerline: Pt[] =
      item.id === 'wing'
        ? [[...item.source.center], [marginX, porchY], [marginX, target.center[1]], [...target.center]]
        : [
            [...item.source.center],
            [item.source.center[0], porchY],
            [marginX, porchY],
            [marginX, target.center[1]],
            [...target.center],
          ];
    const curbs =
      item.id === 'wing'
        ? wingCurbs(item.source, target, marginX, porchY, front)
        : porchCurbs(centerline, item.source.width, target.width);
    routes.push({ ...item, target, centerline, curbs });
    for (const curb of curbs)
      for (let i = 1; i < curb.length; i++) {
        const a = curb[i - 1],
          b = curb[i];
        if (a && b) linework.segs[1].push([...a, ...b]);
      }
  }
  return routes.length
    ? { kind: urban(parent.model) ? 'street-building' : 'wing-floor', aperture: win, childShell, routes, linework }
    : null;
}
