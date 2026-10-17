import { nearness, project, type Camera, type Vec3 } from './camera';
import { ink } from './ink';

/** Wire shapes: solids as lists of 3D line segments, built from a few primitives, moved
 *  with `place`, and stroked with depth fading. Wireframe objects, stacks, workflows and
 *  vector diagrams are all made of these. */

export type Seg = readonly [Vec3, Vec3];
export type Axis = 'x' | 'y' | 'z';

const TAU = Math.PI * 2;

/** The point at angle `a` on a circle of radius `r` around `c`, in the plane normal to `axis`. */
function around(c: Vec3, r: number, axis: Axis, a: number): Vec3 {
  const u = Math.cos(a) * r;
  const v = Math.sin(a) * r;
  if (axis === 'y') return [c[0] + u, c[1], c[2] + v];
  if (axis === 'x') return [c[0], c[1] + u, c[2] + v];
  return [c[0] + u, c[1] + v, c[2]];
}

/** A closed or open polyline through points. */
export function path(pts: readonly Vec3[], closed = false): Seg[] {
  const out: Seg[] = [];
  for (let i = 0; i + 1 < pts.length; i++) out.push([pts[i] as Vec3, pts[i + 1] as Vec3]);
  if (closed && pts.length > 2) out.push([pts[pts.length - 1] as Vec3, pts[0] as Vec3]);
  return out;
}

/** A circle (or an arc from a0 to a1) of n segments. */
export function circle(c: Vec3, r: number, axis: Axis = 'y', n = 24, a0 = 0, a1 = TAU): Seg[] {
  const pts: Vec3[] = [];
  for (let i = 0; i <= n; i++) pts.push(around(c, r, axis, a0 + ((a1 - a0) * i) / n));
  return path(pts);
}

/** The twelve edges of an axis-aligned box. */
export function box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Seg[] {
  const p = (x: number, y: number, z: number): Vec3 => [x, y, z];
  const b = [p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1)];
  const t = [p(x0, y1, z0), p(x1, y1, z0), p(x1, y1, z1), p(x0, y1, z1)];
  return [...path(b, true), ...path(t, true), ...b.map((q, i): Seg => [q, t[i] as Vec3])];
}

/** A cylinder along `axis` from c (base centre), with `rungs` rings and `n` side lines. */
export function cylinder(c: Vec3, r: number, h: number, n = 12, rungs = 2, r2 = r): Seg[] {
  const out: Seg[] = [];
  for (let k = 0; k < rungs; k++) {
    const f = rungs === 1 ? 0 : k / (rungs - 1);
    out.push(...circle([c[0], c[1] + h * f, c[2]], r + (r2 - r) * f, 'y', n));
  }
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    out.push([around(c, r, 'y', a), around([c[0], c[1] + h, c[2]], r2, 'y', a)]);
  }
  return out;
}

/** A 2D outline (x, y) pulled out along z from z0 to z1: both faces and the joins. */
export function extrude(outline: readonly (readonly [number, number])[], z0: number, z1: number): Seg[] {
  const a = outline.map(([x, y]): Vec3 => [x, y, z0]);
  const b = outline.map(([x, y]): Vec3 => [x, y, z1]);
  return [...path(a, true), ...path(b, true), ...a.map((q, i): Seg => [q, b[i] as Vec3])];
}

/** A sphere of `lat` parallels and `lon` meridians. */
export function globe(c: Vec3, r: number, lat = 6, lon = 10): Seg[] {
  const out: Seg[] = [];
  for (let i = 1; i < lat; i++) {
    const phi = -Math.PI / 2 + (i / lat) * Math.PI;
    out.push(...circle([c[0], c[1] + Math.sin(phi) * r, c[2]], Math.cos(phi) * r, 'y', 28));
  }
  for (let j = 0; j < lon; j++) {
    const th = (j / lon) * Math.PI;
    const pts: Vec3[] = [];
    for (let i = 0; i <= 24; i++) {
      const phi = (i / 24) * TAU;
      const x = Math.cos(phi) * r;
      pts.push([c[0] + x * Math.cos(th), c[1] + Math.sin(phi) * r, c[2] + x * Math.sin(th)]);
    }
    out.push(...path(pts));
  }
  return out;
}

export interface Placement {
  /** Turns about y, then x, then z, in radians. */
  yaw?: number;
  pitch?: number;
  roll?: number;
  scale?: number;
  at?: Vec3;
}

/** Turns, scales and moves a shape. */
export function place(segs: readonly Seg[], o: Placement): Seg[] {
  const cy = Math.cos(o.yaw ?? 0);
  const sy = Math.sin(o.yaw ?? 0);
  const cx = Math.cos(o.pitch ?? 0);
  const sx = Math.sin(o.pitch ?? 0);
  const cz = Math.cos(o.roll ?? 0);
  const sz = Math.sin(o.roll ?? 0);
  const k = o.scale ?? 1;
  const [tx, ty, tz] = o.at ?? [0, 0, 0];
  const f = (p: Vec3): Vec3 => {
    const x1 = p[0] * cy + p[2] * sy;
    const z1 = -p[0] * sy + p[2] * cy;
    const y2 = p[1] * cx - z1 * sx;
    const z2 = p[1] * sx + z1 * cx;
    const x3 = x1 * cz - y2 * sz;
    const y3 = x1 * sz + y2 * cz;
    return [x3 * k + tx, y3 * k + ty, z2 * k + tz];
  };
  return segs.map(([a, b]): Seg => [f(a), f(b)]);
}

export interface WireStyle {
  /** Overall opacity, 0..1. */
  alpha: number;
  /** Radius used for the depth fade: how far from the centre counts as "far". */
  radius?: number;
  /** Draw in the signal instead of the line ink. */
  signal?: boolean;
}

/** Strokes segments with nearer ones brighter: the wireframe look. */
export function strokeWire(ctx: CanvasRenderingContext2D, segs: readonly Seg[], cam: Camera, s: WireStyle): void {
  for (const [a, b] of segs) {
    const pa = project(cam, a[0], a[1], a[2]);
    const pb = project(cam, b[0], b[1], b[2]);
    const near = nearness((pa[2] + pb[2]) / 2, s.radius ?? 1.1);
    const al = (0.1 + near * 0.6) * s.alpha;
    if (al < 0.01) continue;
    ctx.strokeStyle = s.signal ? ink.signal(Math.min(1, al + 0.3)) : ink.line(al);
    ctx.beginPath();
    ctx.moveTo(pa[0], pa[1]);
    ctx.lineTo(pb[0], pb[1]);
    ctx.stroke();
  }
}

/** The point a fraction `u` of the way along a polyline, by length. */
export function along(pts: readonly Vec3[], u: number): Vec3 {
  const lens = pts.slice(1).map((q, i) => {
    const p = pts[i] ?? q;
    return Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
  });
  let d = u * lens.reduce((s, l) => s + l, 0);
  for (let i = 0; i < lens.length; i++) {
    const l = lens[i] ?? 0;
    const a = pts[i];
    const b = pts[i + 1];
    if (a && b && (d <= l || i === lens.length - 1)) {
      const k = l > 0 ? Math.min(1, d / l) : 0;
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    }
    d -= l;
  }
  return pts[0] ?? [0, 0, 0];
}

/** Starts a path through the projected points; the caller sets the style and strokes it. */
export function tracePath(ctx: CanvasRenderingContext2D, cam: Camera, pts: readonly Vec3[]): void {
  ctx.beginPath();
  pts.forEach((q, i) => {
    const s = project(cam, q[0], q[1], q[2]);
    if (i) ctx.lineTo(s[0], s[1]);
    else ctx.moveTo(s[0], s[1]);
  });
}
