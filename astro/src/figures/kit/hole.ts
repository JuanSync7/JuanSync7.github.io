import { Batch } from './cosmos';
import { ink } from './ink';
import { between, type Rng } from './rng';

/** A black hole with its accretion disc, seen nearly edge-on: the near side of the disc
 *  crosses in front of the shadow, and the far side, bent by gravity, arches up over it
 *  (and faintly under it), with the thin photon ring at the edge of the shadow. The side of
 *  the disc turning towards us is brighter. `lens` bends anything behind it (a host
 *  galaxy, field stars) outward round the Einstein ring, and hides what falls in. */

export interface Disc {
  /** Particles: radius (in shadow radii), angle, brightness. */
  bits: [number, number, number][];
  tilt: number;
  roll: number;
  /** Disc span, in shadow radii. */
  inner: number;
  outer: number;
}

export function disc(rng: Rng, n = 1400): Disc {
  const [inner, outer] = [between(rng, 2.2, 2.8), between(rng, 4.5, 7)];
  const bits: Disc['bits'] = Array.from({ length: n }, () => {
    const r = inner + Math.pow(rng(), 1.6) * (outer - inner);
    return [r, rng() * Math.PI * 2, 0.25 + Math.pow(rng(), 2) * 0.75 * (1 - (r - inner) / (outer - inner))];
  });
  return { bits, tilt: between(rng, 0.06, 0.32), roll: between(rng, -0.35, 0.35), inner, outer };
}

/** Bend a point at canvas offset (dx, dy) from the hole outward by the Einstein radius `e`
 *  (both in pixels); null if it falls into the shadow `s`. */
export function lens(dx: number, dy: number, e: number, s: number): [number, number] | null {
  const r = Math.hypot(dx, dy);
  if (r < 1e-3) return null;
  const k = (r + Math.sqrt(r * r + 4 * e * e)) / (2 * r);
  return r * k < s * 1.05 ? null : [dx * k, dy * k];
}

/** Draw the disc and the shadow at (cx, cy), the shadow `s` pixels across, its hot spot
 *  (the signal) orbiting just outside the inner edge. */
export function drawHole(ctx: CanvasRenderingContext2D, d: Disc, cx: number, cy: number, s: number, t: number): void {
  const [cr, sr] = [Math.cos(d.roll), Math.sin(d.roll)];
  const at = (x: number, y: number): [number, number] => [cx + (x * cr - y * sr) * s, cy + (x * sr + y * cr) * s];
  const [ct, st] = [Math.cos(d.tilt), Math.sin(d.tilt)];
  const turn = (r: number, a: number): number => a + t * 1.8 * Math.pow(r / d.inner, -1.5);
  let batch = new Batch();
  const bit = (p: [number, number], a: number, size: number): void => batch.dot(p[0], p[1], size, a);
  const flush = (): void => {
    batch.flush(ctx, 0.9);
    batch = new Batch();
  };
  // The far half, seen directly: mostly hidden behind the shadow drawn over it.
  const back: [number, number, number][] = [];
  for (const [r, a0, b] of d.bits) {
    const a = turn(r, a0);
    const [x, z] = [Math.cos(a) * r, Math.sin(a) * r];
    const beam = 0.55 + 0.45 * Math.sin(a);
    if (z < 0) {
      bit(at(x, z * st), b * beam * 0.5, 1.2);
      back.push([r, x, b * beam]);
    }
  }
  flush();
  const glow = ctx.createRadialGradient(cx, cy, s * 0.9, cx, cy, s * 3.2);
  glow.addColorStop(0, ink.line(0.16));
  glow.addColorStop(1, ink.line(0));
  ctx.fillStyle = glow;
  ctx.fillRect(cx - s * 3.2, cy - s * 3.2, s * 6.4, s * 6.4);
  ctx.fillStyle = ink.ground(1);
  ctx.beginPath();
  ctx.arc(cx, cy, s, 0, Math.PI * 2);
  ctx.fill();
  // The far half again, bent up over the shadow, and a thinner image of it under it.
  for (const [r, x, b] of back) {
    const th = Math.acos(Math.max(-1, Math.min(1, x / r)));
    const up = 1.08 + (r - d.inner) * 0.32;
    bit(at(Math.cos(th) * up, -Math.sin(th) * up * (1 - st * 0.6)), b * 0.95, 1.5);
    const down = 1.04 + (r - d.inner) * 0.06;
    if (r < d.inner + 1.2) bit(at(Math.cos(th) * down, Math.sin(th) * down), b * 0.3, 1);
  }
  flush();
  ctx.strokeStyle = ink.line(0.75);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, s * 1.03, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  for (const [r, a0, b] of d.bits) {
    const a = turn(r, a0);
    const [x, z] = [Math.cos(a) * r, Math.sin(a) * r];
    if (z >= 0) bit(at(x, z * st), b * (0.55 + 0.45 * Math.sin(a)) * ct + 0.05, 1.5);
  }
  flush();
  const ha = turn(d.inner * 1.1, 0);
  const [hx, hz] = [Math.cos(ha) * d.inner * 1.1, Math.sin(ha) * d.inner * 1.1];
  const hp = at(hx, hz * st);
  if (hz >= 0 || Math.abs(hx) > 1.05) {
    ctx.fillStyle = ink.signal(0.95);
    ctx.fillRect(hp[0] - 2.5, hp[1] - 2.5, 5, 5);
  }
}
