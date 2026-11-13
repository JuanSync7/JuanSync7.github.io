import { project, type Camera } from './camera';
import { poly } from './draw';
import { ink, mix } from './ink';

/** Drawing helpers for the platform parts (`platform.ts`): face tones, a cylinder, a batch of
 *  3D segments, and a cloud whose outline is the union of its puffs. */

export function tones(lit: boolean) {
  return {
    right: mix('ground', 'panel', 0.55),
    left: mix('ground', 'panel', 0.95),
    top: lit ? mix('panel', 'panelSignal', 0.7) : mix('panel', 'panel2', 0.75),
    edge: lit ? ink.signal(0.9) : ink.line(0.55),
    crease: ink.line(0.16),
  };
}

export function cyl(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  x: number,
  z: number,
  r: number,
  y0: number,
  y1: number,
): void {
  const ring = (y: number) =>
    Array.from({ length: 24 }, (_, k) =>
      project(cam, x + Math.cos((k / 24) * Math.PI * 2) * r, y, z + Math.sin((k / 24) * Math.PI * 2) * r),
    );
  const [lo, hi] = [ring(y0), ring(y1)];
  ctx.strokeStyle = ink.line(0.55);
  const side = [...lo.slice(21), ...lo.slice(0, 10), ...hi.slice(0, 10).reverse(), ...hi.slice(21).reverse()];
  poly(ctx, side);
  ctx.fillStyle = mix('ground', 'panel', 0.8);
  ctx.fill();
  ctx.stroke();
  poly(ctx, hi);
  ctx.fillStyle = mix('panel', 'panel2', 0.75);
  ctx.fill();
  ctx.stroke();
}

export function lines(ctx: CanvasRenderingContext2D, cam: Camera, segs: number[][], a: number): void {
  ctx.beginPath();
  for (const [x0, y0, z0, x1, y1, z1] of segs) {
    const p = project(cam, x0 ?? 0, y0 ?? 0, z0 ?? 0);
    const q = project(cam, x1 ?? 0, y1 ?? 0, z1 ?? 0);
    ctx.moveTo(p[0], p[1]);
    ctx.lineTo(q[0], q[1]);
  }
  ctx.strokeStyle = ink.line(a);
  ctx.stroke();
}

export function cloud(ctx: CanvasRenderingContext2D, cam: Camera, x: number, y: number, z: number): void {
  const [cx, cy] = project(cam, x, y, z);
  const s = cam.scale;
  const puffs = [
    [-0.9, -0.15, 0.55],
    [-0.2, -0.55, 0.75],
    [0.65, -0.3, 0.6],
    [1.15, 0, 0.4],
    [-1.35, 0.05, 0.38],
  ].map(([dx = 0, dy = 0, r = 0]) => [cx + dx * s, cy + dy * s, r * s] as const);
  ctx.fillStyle = ink.ground();
  for (const [px, py, r] of puffs) {
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  for (const [px, py, r] of puffs)
    for (let k = 0; k < 48; k++) {
      const [a, b] = [(k / 48) * Math.PI * 2, ((k + 1) / 48) * Math.PI * 2];
      const [ax, ay, bx, by] = [px + Math.cos(a) * r, py + Math.sin(a) * r, px + Math.cos(b) * r, py + Math.sin(b) * r];
      const inside = puffs.some(([qx, qy, qr]) => (qx !== px || qy !== py) && Math.hypot(ax - qx, ay - qy) < qr - 0.5);
      if (inside || ay > cy + 0.4 * s) continue;
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
    }
  ctx.moveTo(cx - 1.7 * s, cy + 0.4 * s);
  ctx.lineTo(cx + 1.5 * s, cy + 0.4 * s);
  ctx.strokeStyle = ink.line(0.6);
  ctx.stroke();
}
