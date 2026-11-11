import type { ChipNet, ChipPlan, ChipPort } from './chip-types';
import { BOUND, inset, type Pt } from './sketch';
import { contactChannel, type TrackAxis } from './chip-contact-channel';
import {
  BOARD_OBSTACLE_MARGIN,
  BOARD_VIA_RADIUS,
  parallelConflict,
  runContactConflict,
  segmentBoxHit,
  reservedRunConflict,
  reservedViaConflict,
  terminalConflict,
  viaConflict,
} from './chip-contact-clearance';

const STEP = 0.018,
  EPS = 1e-8;
const axis = (p: ChipPort): TrackAxis => (p.side === 'n' || p.side === 's' ? 1 : 0);
const normal = (p: ChipPort): Pt =>
  p.side === 'n' ? [0, -1] : p.side === 's' ? [0, 1] : p.side === 'w' ? [-1, 0] : [1, 0];
const distance = (a: Pt, b: Pt): number => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
const same = (a: Pt, b: Pt): boolean => distance(a, b) < EPS;

export function simplifyBoardRoute(points: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (const p of points) {
    if (out.length && same(out[out.length - 1] ?? p, p)) continue;
    const a = out[out.length - 2],
      b = out[out.length - 1];
    if (
      a &&
      b &&
      ((Math.abs(a[0] - b[0]) < EPS && Math.abs(b[0] - p[0]) < EPS) ||
        (Math.abs(a[1] - b[1]) < EPS && Math.abs(b[1] - p[1]) < EPS))
    )
      out.pop();
    out.push([...p]);
  }
  return out;
}

/** Pad escape is a wire run, not an automatic via. Only an actual turn later
 * consumes an annulus; a clear straight escape may pass a virtual crossing. */
export function routeBoardNet(plan: ChipPlan, a: ChipPort, b: ChipPort, signal: string): Pt[] | undefined {
  const unrelated = plan.nets.filter((n) => n.signal !== signal);
  const key = (id: string): string => {
    const c = plan.components.find((part) => part.ports.some((p) => p.id === id));
    const group = c?.pinGroups?.findIndex((pins) => pins.includes(id));
    return c && (c.kind === 'power-rail' || c.kind === 'pad')
      ? `${c.id}:conductor`
      : c && group !== undefined && group >= 0
        ? `${c.id}:group${group}`
        : id;
  };
  const ownKeys = new Set(
    [a.id, b.id, ...plan.nets.filter((n) => n.signal === signal).flatMap((n) => [n.from, n.to])].map(key),
  );
  const routed = new Set(plan.nets.flatMap((n) => [n.from, n.to])),
    planned = new Set(plan.routePorts ?? []);
  const reservations = plan.components
    .flatMap((c) => c.ports)
    .filter((p) => planned.has(p.id) && !routed.has(p.id) && !ownKeys.has(key(p.id)))
    .map((p): Pt => {
      const n = normal(p);
      return [p.point[0] + n[0] * STEP, p.point[1] + n[1] * STEP];
    });
  const obstacles = plan.components.map((c) => ({ id: c.id, box: inset(c.box, -BOARD_OBSTACLE_MARGIN) }));
  const owner = (p: ChipPort) => plan.components.find((c) => c.ports.includes(p))?.id;
  const sourceOwner = owner(a),
    targetOwner = owner(b);
  const run = (p: Pt, q: Pt, ignore: (string | undefined)[] = []): boolean =>
    obstacles.every((c) => ignore.includes(c.id) || !segmentBoxHit(p, q, c.box)) &&
    unrelated.every((n) => !parallelConflict(p, q, n) && !runContactConflict(p, q, n)) &&
    !reservedRunConflict(p, q, reservations);
  const turn = (p: Pt): boolean =>
    obstacles.every(
      ({ box }) => !(p[0] > box[0] + EPS && p[0] < box[2] - EPS && p[1] > box[1] + EPS && p[1] < box[3] - EPS),
    ) &&
    unrelated.every((n) => !viaConflict(p, n)) &&
    !reservedViaConflict(p, reservations);
  if (unrelated.some((n) => terminalConflict(a.point, n) || terminalConflict(b.point, n))) return undefined;
  const escape = (port: ChipPort, own: string | undefined): Pt | undefined => {
    const d = normal(port);
    for (let k = 1; k <= 5; k++) {
      const q: Pt = [port.point[0] + d[0] * STEP * k, port.point[1] + d[1] * STEP * k];
      if (run(port.point, q, [own])) return q;
    }
    return undefined;
  };
  const start = escape(a, sourceOwner),
    end = escape(b, targetOwner);
  if (!start || !end) return undefined;
  const headsOut = (port: ChipPort, p: Pt): boolean => {
    const d = normal(port);
    return axis(port) === 0
      ? Math.abs(port.point[1] - p[1]) < EPS && (p[0] - port.point[0]) * d[0] > 0
      : Math.abs(port.point[0] - p[0]) < EPS && (p[1] - port.point[1]) * d[1] > 0;
  };
  const valid = (candidate: Pt[]): Pt[] | undefined => {
    const points = simplifyBoardRoute([a.point, ...candidate, b.point]),
      first = points[1],
      last = points[points.length - 2];
    if (!first || !last || !headsOut(a, first) || !headsOut(b, last)) return undefined;
    for (let i = 1; i < points.length; i++) {
      const p = points[i - 1],
        q = points[i];
      if (!p || !q) return undefined;
      const ignore = [...(i === 1 ? [sourceOwner] : []), ...(i === points.length - 1 ? [targetOwner] : [])];
      if (!run(p, q, ignore) || (i < points.length - 1 && !turn(q))) return undefined;
    }
    return points;
  };
  const xs = [
    start[0],
    end[0],
    ...plan.components.flatMap((c) => [1, 2, 3].flatMap((k) => [c.box[0] - STEP * k, c.box[2] + STEP * k])),
  ];
  const ys = [
    start[1],
    end[1],
    ...plan.components.flatMap((c) => [1, 2, 3].flatMap((k) => [c.box[1] - STEP * k, c.box[3] + STEP * k])),
  ];
  const bounded = (values: number[], side: 0 | 1): number[] =>
    [...new Set(values)].filter((v) => v > BOUND[side] + 0.025 && v < BOUND[side + 2] - 0.025);
  const simple = (xValues: number[], yValues: number[]): Pt[] | undefined => {
    const candidates: Pt[][] = [
      [start, [end[0], start[1]], end],
      [start, [start[0], end[1]], end],
      ...xValues.map((x): Pt[] => [start, [x, start[1]], [x, end[1]], end]),
      ...yValues.map((y): Pt[] => [start, [start[0], y], [end[0], y], end]),
    ];
    // Cost does not depend on obstacles. Test shortest candidates first, avoiding
    // hundreds of full collision sweeps after a legal optimum is already known.
    const ranked = candidates.map((candidate) => {
      const points = simplifyBoardRoute([a.point, ...candidate, b.point]);
      const cost = points.reduce((n, p, i) => n + (i ? distance(points[i - 1] ?? p, p) : 0), 0) + points.length * 0.004;
      return { points, cost };
    });
    ranked.sort((a, b) => a.cost - b.cost);
    for (const { points } of ranked) {
      const checked = valid(points);
      if (checked) return checked;
    }
    return undefined;
  };
  const baseX = bounded(xs, 0),
    baseY = bounded(ys, 1);
  const direct = simple(baseX, baseY);
  if (direct) return direct;
  const rules = { run: (p: Pt, q: Pt) => run(p, q), turn, startAxis: axis(a), endAxis: axis(b) };
  const coarse = contactChannel(start, end, baseX, baseY, rules);
  if (coarse) {
    const checked = valid(coarse);
    if (checked) return checked;
  }
  // Refine only after the sparse component grid fails. These are geometrically
  // derived tracks around actual contacts/runs, never a salt-specific workaround.
  const tracks = contactTracks(unrelated, start, end);
  const fineX = bounded([...xs, ...tracks[0]], 0),
    fineY = bounded([...ys, ...tracks[1]], 1);
  const clear = simple(fineX, fineY);
  if (clear) return clear;
  const fine = contactChannel(start, end, fineX, fineY, rules);
  return fine ? valid(fine) : undefined;
}

function contactTracks(nets: ChipNet[], start: Pt, end: Pt): [number[], number[]] {
  const tracks: [number[], number[]] = [[], []],
    pair = BOARD_VIA_RADIUS * 2 + 0.002,
    edge = BOARD_VIA_RADIUS + 0.002;
  const lo = [Math.min(start[0], end[0]) - 0.2, Math.min(start[1], end[1]) - 0.2],
    hi = [Math.max(start[0], end[0]) + 0.2, Math.max(start[1], end[1]) + 0.2];
  for (const net of nets) {
    for (const p of [...net.vias, ...net.points.filter((_p, i) => i === 0 || i === net.points.length - 1)]) {
      if ((p[0] < lo[0] || p[0] > hi[0]) && (p[1] < lo[1] || p[1] > hi[1])) continue;
      for (const d of [-1, 1]) {
        tracks[0].push(p[0] + pair * d);
        tracks[1].push(p[1] + pair * d);
      }
    }
    for (let i = 1; i < net.points.length; i++) {
      const p = net.points[i - 1],
        q = net.points[i];
      if (!p || !q) continue;
      const side: 0 | 1 = Math.abs(p[0] - q[0]) < EPS ? 0 : 1;
      if (p[side] >= lo[side] && p[side] <= hi[side]) for (const d of [-1, 1]) tracks[side].push(p[side] + edge * d);
    }
  }
  return tracks;
}
