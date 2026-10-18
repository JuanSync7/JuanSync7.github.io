import { ink } from './ink';

/** Soft light for figures drawn in points: a round signal mark that fades into what is
 *  around it (a hard square of teal reads as a pixel, not a star), and a soft grey sprite
 *  for haze and the glow along a galaxy's arms. */

/** The signal as a point of light at (x, y): a round core of radius r/4 in a halo that
 *  fades to nothing at r. */
export function beacon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a = 1): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, ink.signal(0.95 * a));
  g.addColorStop(0.22, ink.signal(0.6 * a));
  g.addColorStop(0.5, ink.signal(0.14 * a));
  g.addColorStop(1, ink.signal(0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

let sprite: HTMLCanvasElement | null = null;

/** A 32 px round grey glow, made once, drawn scaled with `drawImage`: thousands of soft
 *  dots cost one image each, no gradient each. */
export function puff(): HTMLCanvasElement {
  if (sprite) return sprite;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d');
  if (x) {
    const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, ink.line(1));
    g.addColorStop(0.35, ink.line(0.4));
    g.addColorStop(1, ink.line(0));
    x.fillStyle = g;
    x.fillRect(0, 0, 32, 32);
  }
  sprite = c;
  return c;
}

/** A ray of light from (x, y) along angle a, from `from` out to `len`, widening to `w` at
 *  its end, its brightness a pulse travelling outward: `phase` 0..1 is where the pulse
 *  is along it. Faded at both ends, so it never reads as a drawn line. */
export function ray(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  a: number,
  from: number,
  len: number,
  w: number,
  phase: number,
  alpha: number,
): void {
  const [c, s] = [Math.cos(a), Math.sin(a)];
  const [x0, y0, x1, y1] = [x + c * from, y + s * from, x + c * len, y + s * len];
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  const p = Math.min(0.9, Math.max(0.1, phase));
  g.addColorStop(0, ink.line(0));
  g.addColorStop(p - 0.1, ink.line(alpha * 0.2));
  g.addColorStop(p, ink.line(alpha));
  g.addColorStop(p + 0.1, ink.line(alpha * 0.2));
  g.addColorStop(1, ink.line(0));
  const w0 = w * 0.3;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x0 - (s * w0) / 2, y0 + (c * w0) / 2);
  ctx.lineTo(x1 - (s * w) / 2, y1 + (c * w) / 2);
  ctx.lineTo(x1 + (s * w) / 2, y1 - (c * w) / 2);
  ctx.lineTo(x0 + (s * w0) / 2, y0 - (c * w0) / 2);
  ctx.fill();
}
