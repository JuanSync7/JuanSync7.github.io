import { project, type Camera } from './camera';
import { ink } from './ink';

/** Hairline solids, after lucasmarkes/hairline (MIT): every part is a filled plate in the ground
 *  colour, so it hides what stands behind it, drawn with one stroke width and told apart by
 *  brightness alone. A solid's silhouette is bright, its top edge is one dim crease and its
 *  vertical corners are never drawn; a thin plate gets a single thickness line. Parts are drawn
 *  back to front (`depth`), links first, so the plates do the hiding. */

export type Tier = 'hi' | 'edge' | 'mid' | 'lo';
export interface Pen {
  ctx: CanvasRenderingContext2D;
  cam: Camera;
  t: number;
}

/** The four stroke tiers: lit (the signal), silhouettes, other strokes, what recedes. */
export const tier = (k: Tier): string =>
  k === 'hi' ? ink.signal(1) : k === 'edge' ? ink.line(0.92) : k === 'mid' ? ink.line(0.5) : ink.line(0.24);

type P = [number, number];
const at = (p: Pen, x: number, y: number, z: number): P => {
  const s = project(p.cam, x, y, z);
  return [s[0], s[1]];
};

function path(p: Pen, pts: P[], close: boolean): void {
  p.ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? p.ctx.lineTo(x, y) : p.ctx.moveTo(x, y)));
  if (close) p.ctx.closePath();
}

/** A polyline (or a dashed one) through world points. */
export function wire(p: Pen, pts: [number, number, number][], k: Tier, dash = false): void {
  path(
    p,
    pts.map(([x, y, z]) => at(p, x, y, z)),
    false,
  );
  p.ctx.setLineDash(dash ? [3, 3] : []);
  p.ctx.strokeStyle = tier(k);
  p.ctx.stroke();
  p.ctx.setLineDash([]);
}

/** A filled flat shape (a sheet, a card) through world points, outlined at `k`. */
export function sheet(p: Pen, pts: [number, number, number][], k: Tier): void {
  path(
    p,
    pts.map(([x, y, z]) => at(p, x, y, z)),
    true,
  );
  p.ctx.fillStyle = ink.ground(1);
  p.ctx.fill();
  p.ctx.strokeStyle = tier(k);
  p.ctx.stroke();
}

export interface Box {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  y0: number;
  y1: number;
}

/** A solid: plate-filled silhouette in `edge`, the top's front edges as one dim crease. */
export function solid(p: Pen, b: Box, edge: Tier = 'edge', crease: Tier = 'lo'): void {
  const { x0, x1, z0, z1, y0, y1 } = b;
  const tb = at(p, x0, y1, z0);
  const tr = at(p, x1, y1, z0);
  const tf = at(p, x1, y1, z1);
  const tl = at(p, x0, y1, z1);
  const hull: P[] = [tb, tr, at(p, x1, y0, z0), at(p, x1, y0, z1), at(p, x0, y0, z1), tl];
  path(p, hull, true);
  p.ctx.fillStyle = ink.ground(1);
  p.ctx.fill();
  p.ctx.strokeStyle = tier(edge);
  p.ctx.stroke();
  // A thin plate shows one thickness line; a solid its crease.
  path(p, [tr, tf, tl], false);
  p.ctx.strokeStyle = tier(y1 - y0 < 0.2 ? edge : crease);
  p.ctx.stroke();
}

/** A rectangle drawn on a solid's front (z = z1) face, e.g. a drawer front or a blade. */
export function onFront(p: Pen, x0: number, x1: number, y0: number, y1: number, z: number, k: Tier): void {
  path(p, [at(p, x0, y0, z), at(p, x1, y0, z), at(p, x1, y1, z), at(p, x0, y1, z)], true);
  p.ctx.strokeStyle = tier(k);
  p.ctx.stroke();
}

/** A dot at a world point. */
export function bead(p: Pen, x: number, y: number, z: number, r: number, k: Tier): void {
  const [sx, sy] = at(p, x, y, z);
  p.ctx.fillStyle = tier(k);
  p.ctx.beginPath();
  p.ctx.arc(sx, sy, r, 0, Math.PI * 2);
  p.ctx.fill();
}

/** Draw order for axis-aligned parts: far (small x + z) and low first. */
export const depth = (b: Box): number => (b.x0 + b.x1 + b.z0 + b.z1) / 2 + b.y0 * 0.01;

/** A box from its footprint centre, half-sizes and height range. */
export const cube = (x: number, z: number, hx: number, hz: number, y0: number, y1: number): Box => ({
  x0: x - hx,
  x1: x + hx,
  z0: z - hz,
  z1: z + hz,
  y0,
  y1,
});

/** 0..1 eased in and out. */
export const ease = (x: number): number => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

export type V = [number, number, number];
/** A part of an icon: a solid, its silhouette tier, and what is drawn on it once it is down. */
export interface Part {
  box: Box;
  edge?: Tier;
  then?: () => void;
}

/** A straight link between two world points. */
export const seg = (p: Pen, a: V, b: V, k: Tier, dash = false): void => wire(p, [a, b], k, dash);
/** A filled upright card in the x-y plane at depth z. */
export const card = (p: Pen, x0: number, x1: number, y0: number, y1: number, z: number, k: Tier): void =>
  sheet(p, [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], k); // prettier-ignore
/** The thin plinth every icon stands on. */
export const plinth = (p: Pen): void => solid(p, { x0: -3.3, x1: 3.3, z0: -3.3, z1: 3.3, y0: -0.14, y1: 0 }, 'mid');
/** Draws parts back to front, each followed by what sits on it. */
export const draw = (p: Pen, parts: Part[]): void =>
  [...parts]
    .sort((a, b) => depth(a.box) - depth(b.box))
    .forEach((q) => {
      solid(p, q.box, q.edge);
      q.then?.();
    });
export const lerp = (a: V, b: V, u: number): V => [
  a[0] + (b[0] - a[0]) * u,
  a[1] + (b[1] - a[1]) * u,
  a[2] + (b[2] - a[2]) * u,
];
/** The one lit packet, `u` of the way from a to b. */
export const along = (p: Pen, a: V, b: V, u: number): void => bead(p, ...lerp(a, b, u), 2.6, 'hi');
/** A padlock's shackle standing on a box's top. */
export const shackle = (p: Pen, x: number, y: number, z: number): void =>
  wire(
    p,
    Array.from({ length: 9 }, (_, i): V => {
      const a = (i / 8) * Math.PI;
      return [x + 0.3 * Math.cos(a), y + 0.34 * Math.sin(a), z];
    }),
    'edge',
  );
