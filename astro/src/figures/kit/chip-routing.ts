import { BOUND, inset, type Box, type Pt, type Sketch, type Tone } from './sketch';
import type { ChipNet, ChipPlan, ChipPort, ChipSide } from './chip-types';
import { channelRoute } from './chip-channel';

const DELTA = 0.018;
const EPS = 1e-7;
const same = (a: Pt, b: Pt): boolean => Math.hypot(a[0] - b[0], a[1] - b[1]) < EPS;
const distance = (a: Pt, b: Pt): number => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
function hits(a: Pt, b: Pt, r: Box): boolean {
  if (Math.abs(a[0] - b[0]) < EPS)
    return (
      a[0] > r[0] + EPS && a[0] < r[2] - EPS && Math.max(a[1], b[1]) > r[1] + EPS && Math.min(a[1], b[1]) < r[3] - EPS
    );
  return (
    a[1] > r[1] + EPS && a[1] < r[3] - EPS && Math.max(a[0], b[0]) > r[0] + EPS && Math.min(a[0], b[0]) < r[2] - EPS
  );
}

function simplify(points: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (const p of points) {
    if (out.length && same(out[out.length - 1] ?? p, p)) continue;
    const [a, b] = [out[out.length - 2], out[out.length - 1]];
    if (
      a &&
      b &&
      ((Math.abs(a[0] - b[0]) < EPS && Math.abs(b[0] - p[0]) < EPS) ||
        (Math.abs(a[1] - b[1]) < EPS && Math.abs(b[1] - p[1]) < EPS))
    )
      out.pop();
    out.push(p);
  }
  return out;
}

function escape(p: ChipPort, length = DELTA): Pt {
  const d: Record<ChipSide, Pt> = { n: [0, -length], e: [length, 0], s: [0, length], w: [-length, 0] };
  return [p.point[0] + d[p.side][0], p.point[1] + d[p.side][1]];
}

/** Hanan routing channels follow legal macro edges. A route that cannot be placed is an
 * error, never a decorative straight line through an unrelated precision device. */
export function chipWire(S: Sketch, plan: ChipPlan, from: string, to: string, tone: Tone = 1): void {
  const ports = plan.components.flatMap((c) => c.ports);
  const [a, b] = [ports.find((p) => p.id === from), ports.find((p) => p.id === to)];
  if (!a || !b) throw new Error(`chip port missing: ${from} → ${to}`);
  const obstacles = plan.components.map((c) => inset(c.box, -DELTA * 0.5));
  const terminalKey = (id: string): string => {
    const c = plan.components.find((part) => part.ports.some((p) => p.id === id));
    const group = c?.pinGroups?.findIndex((pins) => pins.includes(id));
    if (c && group !== undefined && group >= 0) return `${c.id}:conductor${group}`;
    return c && (c.kind === 'pad' || c.kind === 'power-rail') ? `${c.id}:conductor` : id;
  };
  const keys = [terminalKey(from), terminalKey(to)];
  const connected = plan.nets.filter((n) => [n.from, n.to].some((p) => keys.includes(terminalKey(p))));
  const signal = connected[0]?.signal ?? keys.find((key) => key.endsWith(':conductor')) ?? `signal${plan.nets.length}`;
  const merged = new Set(connected.map((n) => n.signal));
  for (const n of plan.nets) if (merged.has(n.signal)) n.signal = signal;
  const access = (p: ChipPort): Pt => {
    for (let k = 1; k <= 5; k++) {
      const q = escape(p, DELTA * k);
      const own = plan.components.find((c) => c.ports.includes(p));
      if (plan.components.some((c) => c !== own && hits(p.point, q, inset(c.box, -DELTA * 0.5)))) continue;
      if (
        plan.nets.some((n) => n.signal !== signal && n.points.some((v, i) => i > 0 && on(q, n.points[i - 1] ?? v, v)))
      )
        continue;
      return q;
    }
    return escape(p);
  };
  const [start, end] = [access(a), access(b)];
  const legal = (p: Pt, q: Pt): boolean =>
    obstacles.every((r) => !hits(p, q, r)) && plan.nets.every((n) => n.signal === signal || !metalConflict(p, q, n));
  const xs = [
    start[0],
    end[0],
    ...plan.components.flatMap((c) => [1, 2, 3].flatMap((k) => [c.box[0] - DELTA * k, c.box[2] + DELTA * k])),
  ].filter((x) => x > BOUND[0] + 0.025 && x < BOUND[2] - 0.025);
  const ys = [
    start[1],
    end[1],
    ...plan.components.flatMap((c) => [1, 2, 3].flatMap((k) => [c.box[1] - DELTA * k, c.box[3] + DELTA * k])),
  ].filter((y) => y > BOUND[1] + 0.025 && y < BOUND[3] - 0.025);
  const candidates: Pt[][] = [
    [start, [end[0], start[1]], end],
    [start, [start[0], end[1]], end],
    ...xs.map((x): Pt[] => [start, [x, start[1]], [x, end[1]], end]),
    ...ys.map((y): Pt[] => [start, [start[0], y], [end[0], y], end]),
  ];
  let best: Pt[] | undefined;
  let cost = Infinity;
  for (const candidate of candidates) {
    if (!candidate.every((p, i) => i === 0 || legal(candidate[i - 1] ?? p, p))) continue;
    const score = candidate.reduce((d, p, i) => d + (i ? distance(candidate[i - 1] ?? p, p) : 0), 0);
    if (score < cost) {
      best = candidate;
      cost = score;
    }
  }
  if (!best) best = channelRoute(start, end, xs, ys, legal);
  if (!best) throw new Error(`no legal chip routing channel: ${from} → ${to}`);
  const points = simplify([a.point, ...best, b.point]).map(([x, y]): Pt => [x, y]);
  const vias = points.slice(1, -1);
  plan.nets.push({ id: `net${plan.nets.length}`, from, to, points, layer: 'metal-hv', signal, vias });
  S.poly(points, tone);
  for (const p of [a.point, b.point]) S.rect([p[0] - 0.006, p[1] - 0.006, p[0] + 0.006, p[1] + 0.006], 1);
  for (const p of points.slice(1, -1)) S.dot(...p);
}

function on(p: Pt, a: Pt, b: Pt): boolean {
  return distance(a, p) + distance(p, b) < distance(a, b) + EPS;
}

function metalConflict(a: Pt, b: Pt, net: ChipNet): boolean {
  if (net.vias.some((p) => on(p, a, b))) return true;
  for (let i = 1; i < net.points.length; i++) {
    const p = net.points[i - 1],
      q = net.points[i];
    if (!p || !q) continue;
    if (on(a, p, q) || on(b, p, q)) return true;
    const horizontal = Math.abs(a[1] - b[1]) < EPS;
    if (horizontal !== Math.abs(p[1] - q[1]) < EPS) continue;
    if (
      horizontal &&
      Math.abs(a[1] - p[1]) < EPS &&
      Math.min(Math.max(a[0], b[0]), Math.max(p[0], q[0])) > Math.max(Math.min(a[0], b[0]), Math.min(p[0], q[0])) + EPS
    )
      return true;
    if (
      !horizontal &&
      Math.abs(a[0] - p[0]) < EPS &&
      Math.min(Math.max(a[1], b[1]), Math.max(p[1], q[1])) > Math.max(Math.min(a[1], b[1]), Math.min(p[1], q[1])) + EPS
    )
      return true;
  }
  return false;
}
