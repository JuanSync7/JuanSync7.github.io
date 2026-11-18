import type { ScreenPoint } from './camera';
import { dot, line, poly } from './draw';
import { ink, mix } from './ink';

/** A point on a flat part, from its own coordinates: `u` across, `v` up, `n` out of its face. */
export type Plane = (u: number, v: number, n: number) => ScreenPoint;

const TAU = Math.PI * 2;
const BALL = 0.05;

/** How far each part reaches from its centre on its face, at any turn of it. */
export const reach = { dial: (r: number) => r, handle: (r: number) => r * 1.08 + BALL };

/** A rectangle on a face: [u0, u1, v0, v1]. */
export type Rect = readonly [number, number, number, number];
export const around = (cu: number, cv: number, r: number): Rect => [cu - r, cu + r, cv - r, cv + r];

/** Parts sit on what holds them (CLAUDE.md, the bounds rule, here for a canvas figure): each part
 *  stays inside `host` by `gap`, and no two parts come closer than `gap`. Throws at load, so the
 *  figure fails its audit instead of drawing a dial through a handle. */
export function seat(host: Rect, parts: Record<string, Rect>, gap: number): void {
  const list = Object.entries(parts);
  for (const [what, [u0, u1, v0, v1]] of list) {
    const out = Math.max(host[0] + gap - u0, u1 - (host[1] - gap), host[2] + gap - v0, v1 - (host[3] - gap));
    if (out > 1e-9) throw new Error(`bounds: ${what} pokes ${out.toFixed(3)} past its face`);
  }
  list.forEach(([a, p], i) =>
    list.slice(i + 1).forEach(([b, q]) => {
      const clear = Math.max(q[0] - p[1], p[0] - q[1], q[2] - p[3], p[2] - q[3]);
      if (clear < gap) throw new Error(`bounds: ${a} and ${b} are ${clear.toFixed(3)} apart, need ${gap}`);
    }),
  );
}

/** Monotone-chain convex hull: the outline of a drum is the hull of both of its end rings. */
function hull(pts: ScreenPoint[]): ScreenPoint[] {
  const s = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: ScreenPoint, a: ScreenPoint, b: ScreenPoint) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list: ScreenPoint[]) => {
    const out: ScreenPoint[] = [];
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2]!, out[out.length - 1]!, p) <= 0) out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  return [...half(s), ...half([...s].reverse())];
}

function fillStroke(ctx: CanvasRenderingContext2D, pts: readonly ScreenPoint[], fill: string, edge: string) {
  poly(ctx, pts);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.stroke();
}

/** A short cylinder: `ring(th, s)` is the point at angle `th` round the axis and `s` along it.
 *  Draws the side as the hull of both ends, then `detail`, then the end turned to the eye. */
export function drum(
  ctx: CanvasRenderingContext2D,
  ring: (th: number, s: number) => ScreenPoint,
  s0: number,
  s1: number,
  side: string,
  cap: string,
  edge: string,
  detail?: () => void,
): void {
  const at = (s: number) => Array.from({ length: 36 }, (_, i) => ring((i / 36) * TAU, s));
  const near = (pts: ScreenPoint[]) => pts.reduce((d, p) => d + p[2], 0) / pts.length;
  const [a, b] = [at(s0), at(s1)];
  fillStroke(ctx, hull([...a, ...b]), side, edge);
  // Anything drawn on the side now (knurls) is hidden by the cap where it runs round the back.
  detail?.();
  // The cap is whichever end is nearer the eye: a dial on a door that has swung past 45° shows
  // the end against the door, not its face.
  fillStroke(ctx, near(b) >= near(a) ? b : a, cap, edge);
}

/** A slab on a plane, `[u0, u1, v0, v1, n0, n1]`: its `u1` end, its top and whichever broad face
 *  is turned to the eye (`nFace` true for the `n1` face). */
export function slab(
  ctx: CanvasRenderingContext2D,
  q: Plane,
  [u0, u1, v0, v1, n0, n1]: readonly number[],
  nFace: boolean,
) {
  const tone = (t: number) => mix('ground', 'panel', t);
  const edge = ink.line(0.7);
  fillStroke(ctx, [q(u1!, v0!, n0!), q(u1!, v0!, n1!), q(u1!, v1!, n1!), q(u1!, v1!, n0!)], tone(0.35), edge);
  fillStroke(
    ctx,
    [q(u0!, v1!, n0!), q(u1!, v1!, n0!), q(u1!, v1!, n1!), q(u0!, v1!, n1!)],
    mix('ground', 'panel2', 0.6),
    edge,
  );
  const n = nFace ? n1! : n0!;
  fillStroke(ctx, [q(u0!, v0!, n), q(u1!, v0!, n), q(u1!, v1!, n), q(u0!, v1!, n)], tone(0.75), edge);
}

/** The combination dial: a fixed bezel carrying the index mark, a graduated dial that turns
 *  (`turn`, radians), and a knurled knob. The dial's zero tick and the index are the signal, so
 *  the lock reads as open when the two meet. */
export function dial(
  ctx: CanvasRenderingContext2D,
  q: Plane,
  cu: number,
  cv: number,
  r: number,
  n: number,
  turn: number,
) {
  const around = (rad: number) => (th: number, s: number) => q(cu + rad * Math.sin(th), cv + rad * Math.cos(th), s);
  const steel = (t: number) => mix('ground', 'panel', t);
  drum(ctx, around(r), n, n + 0.035, steel(0.35), steel(0.6), ink.line(0.75));
  const face = n + 0.07;
  drum(ctx, around(r * 0.84), n + 0.035, face, steel(0.3), steel(0.8), ink.line(0.75));
  // Fifty graduations; every fifth one is long. They turn with the dial.
  for (let i = 0; i < 50; i++) {
    const th = turn + (i / 50) * TAU;
    const long = i % 5 === 0;
    const zero = i === 0;
    const a = around(r * 0.8)(th, face);
    const b = around(r * (long ? 0.6 : 0.7))(th, face);
    line(ctx, a, b, zero ? ink.signal(0.95) : ink.line(long ? 0.85 : 0.5));
  }
  poly(
    ctx,
    Array.from({ length: 36 }, (_, i) => around(r * 0.52)((i / 36) * TAU, face)),
  );
  ctx.strokeStyle = ink.line(0.35);
  ctx.stroke();
  // The index: a small notch on the bezel at twelve o'clock.
  const tip = around(r * 0.86)(0, n + 0.036);
  poly(ctx, [tip, around(r * 0.98)(0.07, n + 0.036), around(r * 0.98)(-0.07, n + 0.036)]);
  ctx.fillStyle = ink.signal(0.95);
  ctx.fill();
  // The knob, with knurls running along its side.
  const knob = around(r * 0.3);
  drum(ctx, knob, face, face + 0.12, steel(0.45), steel(0.85), ink.line(0.8), () => {
    for (let i = 0; i < 18; i++) {
      const th = turn + (i / 18) * TAU;
      line(ctx, knob(th, face + 0.01), knob(th, face + 0.11), ink.line(0.45));
    }
  });
}

/** The bolt-work handle: a hub and three spokes with ball ends, turned by `turn` radians. */
export function handle(
  ctx: CanvasRenderingContext2D,
  q: Plane,
  cu: number,
  cv: number,
  r: number,
  n: number,
  turn: number,
) {
  const around = (rad: number) => (th: number, s: number) => q(cu + rad * Math.sin(th), cv + rad * Math.cos(th), s);
  const steel = (t: number) => mix('ground', 'panel', t);
  drum(ctx, around(r * 0.32), n, n + 0.05, steel(0.35), steel(0.6), ink.line(0.7));
  const s = n + 0.11;
  for (let i = 0; i < 3; i++) {
    const th = turn + (i / 3) * TAU;
    const side = 0.022;
    const off = (d: number) => [Math.cos(th) * d, -Math.sin(th) * d] as const;
    const [du, dv] = off(side);
    const tipAt = (rad: number, sign: number) =>
      q(cu + rad * Math.sin(th) + du * sign, cv + rad * Math.cos(th) + dv * sign, s);
    fillStroke(ctx, [tipAt(0.04, 1), tipAt(r, 1), tipAt(r, -1), tipAt(0.04, -1)], steel(0.7), ink.line(0.75));
    const [x, y] = q(cu + r * 1.08 * Math.sin(th), cv + r * 1.08 * Math.cos(th), s);
    const [ex] = q(cu + r * 1.08 * Math.sin(th) + BALL, cv + r * 1.08 * Math.cos(th), s);
    dot(ctx, x, y, Math.abs(ex - x), steel(0.85));
    ctx.strokeStyle = ink.line(0.75);
    ctx.stroke();
  }
  drum(ctx, around(r * 0.16), n + 0.05, n + 0.15, steel(0.5), steel(0.9), ink.line(0.8));
}
