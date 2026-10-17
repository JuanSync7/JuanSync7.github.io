import { project, nearness, type Camera, type ScreenPoint, type Vec3 } from './camera';
import type { Mesh } from './models';
import { ink, mix } from './ink';

/** Drawing primitives shared by the figures. Strokes stay one pixel: weight is said with
 *  opacity and the signal, never with width or glow. */

export function clear(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

export function line(ctx: CanvasRenderingContext2D, a: readonly number[], b: readonly number[], style: string): void {
  ctx.strokeStyle = style;
  ctx.beginPath();
  ctx.moveTo(a[0] ?? 0, a[1] ?? 0);
  ctx.lineTo(b[0] ?? 0, b[1] ?? 0);
  ctx.stroke();
}

export function poly(ctx: CanvasRenderingContext2D, pts: readonly (readonly number[])[], close = true): void {
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0] ?? 0, p[1] ?? 0) : ctx.lineTo(p[0] ?? 0, p[1] ?? 0)));
  if (close) ctx.closePath();
}

export function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, style: string): void {
  ctx.fillStyle = style;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export interface MeshStyle {
  /** Overall opacity of the mesh, 0..1. */
  alpha: number;
  /** 0..1: how much of the near side turns to the signal. */
  hot: number;
  /** Radius used for the depth fade. */
  radius?: number;
  /** Per-vertex height override, for terrain. */
  lift?: (v: Vec3) => number;
}

/** Edges only, nearer edges brighter: the wireframe look. */
export function strokeMesh(ctx: CanvasRenderingContext2D, m: Mesh, cam: Camera, s: MeshStyle): void {
  const P: ScreenPoint[] = m.v.map((v) => project(cam, v[0], s.lift ? s.lift(v) : v[1], v[2]));
  for (const [ia, ib] of m.e) {
    const a = P[ia];
    const b = P[ib];
    if (!a || !b) continue;
    const near = nearness((a[2] + b[2]) / 2, s.radius);
    const al = (0.08 + near * 0.6) * s.alpha;
    if (al < 0.01) continue;
    const hot = near > 0.55 && s.hot > 0.05;
    line(ctx, a, b, hot ? ink.signal(al * (0.35 + s.hot * 0.65)) : ink.line(al));
  }
}

/** Flat-shaded triangles, back to front, lit from one fixed direction: the low-poly look. */
export function shadeMesh(ctx: CanvasRenderingContext2D, m: Mesh, cam: Camera, light: Vec3, hotTri = -1): void {
  const P = m.v.map((v) => project(cam, v[0], v[1], v[2]));
  const order = m.f
    .map((t, i) => ({ t, i, z: ((P[t[0]]?.[2] ?? 0) + (P[t[1]]?.[2] ?? 0) + (P[t[2]]?.[2] ?? 0)) / 3 }))
    .sort((a, b) => a.z - b.z);
  for (const { t, i } of order) {
    const a = m.v[t[0]];
    const b = m.v[t[1]];
    const c = m.v[t[2]];
    const pa = P[t[0]];
    const pb = P[t[1]];
    const pc = P[t[2]];
    if (!a || !b || !c || !pa || !pb || !pc) continue;
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const nl = Math.hypot(nx, ny, nz) || 1;
    const lit = Math.abs((nx * light[0] + ny * light[1] + nz * light[2]) / nl);
    poly(ctx, [pa, pb, pc]);
    ctx.fillStyle = i === hotTri ? mix('panelSignal', 'signal', 0.35 + lit * 0.4) : mix('ground', 'line4', 0.15 + lit * 0.85);
    ctx.fill();
    ctx.strokeStyle = i === hotTri ? ink.signal(0.9) : ink.line(0.08 + lit * 0.1);
    ctx.stroke();
  }
}
