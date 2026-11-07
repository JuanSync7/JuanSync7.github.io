import { ink } from './ink';
import { smoothstep } from './motion';
import { A, type Linework, type Plan, type Pt } from './sketch';
import { selectedOutline, type NestConnection } from './dive-connections';

export type DiveProjection = (depth: number, x: number, y: number) => Pt;

/** The same painter serves the animated dive and the full-scale layout contact sheets. */
export function paintDiveLevel(
  ctx: CanvasRenderingContext2D,
  plan: Plan,
  depth: number,
  size: number,
  project: DiveProjection,
  connection: NestConnection | null = null,
): void {
  const alpha = smoothstep(0.04, 0.3, size) * (1 - smoothstep(3, 7, size));
  if (alpha <= 0.01) return;
  // A child drawing belongs to its parent's aperture, including during transitions.
  const [c0, c1] = [project(depth, -A, -1), project(depth, A, 1)];
  ctx.save();
  ctx.beginPath();
  ctx.rect(c0[0], c0[1], c1[0] - c0[0], c1[1] - c0[1]);
  ctx.clip();
  const near = smoothstep(0.25, 0.8, size);
  const tones = [0.5 * alpha, 0.34 * alpha * (0.55 + 0.45 * near), 0.2 * alpha * near];
  const drawings: Linework[] = [plan];
  if (plan.detail) drawings.push(plan.detail);
  if (plan.interfaces) drawings.push(plan.interfaces);
  if (connection) drawings.push(connection.linework);
  for (const drawing of drawings) {
    drawing.segs.forEach((segs, tone) => {
      if ((tones[tone] ?? 0) < 0.01) return;
      ctx.strokeStyle = ink.line(tones[tone] ?? 0);
      ctx.beginPath();
      for (const [x0, y0, x1, y1] of segs) {
        const [p0, p1] = [project(depth, x0, y0), project(depth, x1, y1)];
        ctx.moveTo(p0[0], p0[1]);
        ctx.lineTo(p1[0], p1[1]);
      }
      ctx.stroke();
    });
    ctx.fillStyle = ink.line(0.4 * alpha * near);
    for (const [x, y] of drawing.dots) {
      const p = project(depth, x, y);
      ctx.fillRect(Math.round(p[0]) - 1, Math.round(p[1]) - 1, 2, 2);
    }
  }
  // Opacity depends on physical size, so advancing the level index cannot flash the border.
  ctx.strokeStyle = ink.signal(0.95 * alpha * smoothstep(0.08, 0.65, size));
  ctx.beginPath();
  for (const [x0, y0, x1, y1] of selectedOutline(plan)) {
    const [p0, p1] = [project(depth, x0, y0), project(depth, x1, y1)];
    ctx.moveTo(p0[0], p0[1]);
    ctx.lineTo(p1[0], p1[1]);
  }
  ctx.stroke();
  ctx.restore();
}
