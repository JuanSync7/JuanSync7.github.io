import { project, type Camera } from './camera';
import { ink, mix } from './ink';

/** Hairline isometric on a 2D canvas, for figures that paint parts into sprites
 *  (`kit/accelerator.ts`): solids with their near faces, top, silhouette and one crease;
 *  fine detail as one faint path of 3D segments; outlines and rings as segments; grids
 *  sorted far to near; solder spheres, specks for bumps too small to shade, and chip
 *  capacitors. Each takes a `Paint`: where to draw, the camera, and whether it is lit. */

export type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
export interface Paint {
  ctx: Ctx;
  cam: Camera;
  lit: boolean;
  /** Added to every height: paints a part where it sits when opened (`kit/hbm.ts`). */
  lift?: number;
}

export const pt = (p: Paint, x: number, y: number, z: number): [number, number] => {
  const s = project(p.cam, x, y + (p.lift ?? 0), z);
  return [s[0], s[1]];
};

/** A solid: the two faces toward the viewer and the top, then the silhouette and one crease. */
export function slab(p: Paint, x0: number, z0: number, x1: number, z1: number, y0: number, y1: number): void {
  const { ctx } = p;
  const [tb, tr, tf, tl] = [pt(p, x0, y1, z0), pt(p, x1, y1, z0), pt(p, x1, y1, z1), pt(p, x0, y1, z1)];
  const [br, bf, bl] = [pt(p, x1, y0, z0), pt(p, x1, y0, z1), pt(p, x0, y0, z1)];
  const face = (q: [number, number][], fill: string): void => {
    ctx.beginPath();
    q.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  face([tr, tf, bf, br], mix('ground', 'panel', 0.55));
  face([tl, tf, bf, bl], mix('ground', 'panel', 0.95));
  face([tb, tr, tf, tl], p.lit ? mix('panel', 'panelSignal', 0.7) : mix('panel', 'panel2', 0.75));
  ctx.beginPath();
  [tb, tr, br, bf, bl, tl].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.strokeStyle = p.lit ? ink.signal(0.95) : ink.line(0.5);
  ctx.stroke();
  ctx.beginPath();
  [tr, tf, tl].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = p.lit ? ink.signal(0.45) : ink.line(0.14);
  ctx.stroke();
}

/** Fine detail: 3D segments (x, y, z, x, y, z, …) stroked as one path, fainter than edges. */
export function fine(p: Paint, o: number[], a = 0.22): void {
  const { ctx } = p;
  ctx.beginPath();
  for (let i = 0; i + 5 < o.length; i += 6) {
    const [ax, ay] = pt(p, o[i] ?? 0, o[i + 1] ?? 0, o[i + 2] ?? 0);
    const [bx, by] = pt(p, o[i + 3] ?? 0, o[i + 4] ?? 0, o[i + 5] ?? 0);
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
  }
  ctx.strokeStyle = p.lit ? ink.signal(Math.min(0.75, a * 2.2)) : ink.line(a);
  ctx.stroke();
}

export function rect(o: number[], x0: number, z0: number, x1: number, z1: number, y: number): void {
  o.push(x0, y, z0, x1, y, z0, x1, y, z0, x1, y, z1, x1, y, z1, x0, y, z1, x0, y, z1, x0, y, z0);
}
export function ring(o: number[], x: number, z: number, r: number, y: number, n = 14): void {
  for (let i = 0; i < n; i++) {
    const [a, b] = [(i / n) * Math.PI * 2, ((i + 1) / n) * Math.PI * 2];
    o.push(x + Math.cos(a) * r, y, z + Math.sin(a) * r, x + Math.cos(b) * r, y, z + Math.sin(b) * r);
  }
}
/** An n × k grid over w × d centred on (cx, cz), less what `skip` rejects, far to near. */
export function grid(
  cx: number,
  cz: number,
  w: number,
  d: number,
  n: number,
  k: number,
  skip?: (x: number, z: number) => boolean,
) {
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < k; j++) {
      const [x, z] = [cx + ((i + 0.5) / n - 0.5) * w, cz + ((j + 0.5) / k - 0.5) * d];
      if (!skip?.(x, z)) out.push([x, z]);
    }
  return out.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
}
/** Solder spheres, far to near: a filled disc, its rim, and a short arc of shine. */
export function spheres(p: Paint, at: [number, number][], y: number, r: number): void {
  const { ctx } = p;
  const rs = r * p.cam.scale;
  for (const [x, z] of at) {
    const [sx, sy] = pt(p, x, y, z);
    ctx.beginPath();
    ctx.arc(sx, sy, rs, 0, Math.PI * 2);
    ctx.fillStyle = mix('ground', 'panel2', 0.7);
    ctx.fill();
    ctx.strokeStyle = p.lit ? ink.signal(0.8) : ink.line(0.4);
    ctx.stroke();
    if (rs > 2.5) {
      ctx.beginPath();
      ctx.arc(sx, sy, rs * 0.55, Math.PI * 1.1, Math.PI * 1.55);
      ctx.strokeStyle = p.lit ? ink.signal(0.5) : ink.line(0.25);
      ctx.stroke();
    }
  }
}
/** Bumps too small to shade: one square dot each. */
export function specks(p: Paint, at: [number, number][], y: number): void {
  p.ctx.fillStyle = p.lit ? ink.signal(0.8) : ink.line(0.42);
  for (const [x, z] of at) {
    const [sx, sy] = pt(p, x, y, z);
    p.ctx.fillRect(sx - 0.6, sy - 0.6, 1.2, 1.2);
  }
}
/** A chip capacitor with its two metal ends. */
export function cap(p: Paint, x: number, z: number, y: number, along: boolean): void {
  const [hw, hd] = along ? [0.08, 0.045] : [0.045, 0.08];
  slab(p, x - hw, z - hd, x + hw, z + hd, y, y + 0.05);
  const o: number[] = [];
  for (const s of [-1, 1])
    if (along) o.push(x + s * 0.05, y + 0.05, z - hd, x + s * 0.05, y + 0.05, z + hd);
    else o.push(x - hw, y + 0.05, z + s * 0.05, x + hw, y + 0.05, z + s * 0.05);
  fine(p, o, 0.35);
}
