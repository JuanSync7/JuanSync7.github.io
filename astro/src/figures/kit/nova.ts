import { Batch } from './cosmos';
import { beacon, ray } from './glow';
import { ink } from './ink';
import { fbm, noise2 } from './noise';
import { between, pick, type Rng } from './rng';

/** A supernova on a loop: the star flares, its shell blows out and thins, and what stays
 *  is the remnant: a clumpy shell brightest at its rim, fingers of ejecta reaching past
 *  it, a faint shock ahead, and at the centre the pulsar in the signal, its two beams
 *  sweeping. Seeded as a shell, a ring (a bright equatorial ring with two faint ones) or a
 *  web of filaments. */

export const NOVAS = ['shell', 'ring', 'web'] as const;
export type NovaKind = (typeof NOVAS)[number];

export interface Nova {
  kind: NovaKind;
  /** Shell points: a direction on the sphere and how far out along it. */
  pts: [number, number, number, number, number][];
  /** Ejecta fingers: direction (on the sky) and reach. */
  fingers: [number, number][];
  period: number;
  tilt: number;
}

export function nova(rng: Rng, kind: NovaKind = pick(rng, NOVAS)): Nova {
  const n = noise2(rng);
  const pts: Nova['pts'] = [];
  const count = 2200;
  const m = noise2(rng);
  for (let i = 0; i < count; i++) {
    // Even directions (a Fibonacci sphere), pushed in and out by noise so the shell clumps.
    const y = 1 - (2 * (i + 0.5)) / count;
    const r = Math.sqrt(1 - y * y);
    const a = i * 2.39996;
    const [x, z] = [Math.cos(a) * r, Math.sin(a) * r];
    const reach = 0.86 + fbm(n, x * 2 + y, z * 2 - y, 3) * 0.5;
    // How much the point sits on a filament: ridges of a second noise over the sphere.
    const fil = 1 - Math.abs(fbm(m, x * 2.6 + z, y * 2.6 - z, 3)) * 3;
    pts.push([x, y, z, reach, fil]);
  }
  const fingers = Array.from({ length: 24 + Math.floor(rng() * 24) }, (): [number, number] => [
    rng() * Math.PI * 2,
    between(rng, 1.02, 1.3),
  ]);
  return { kind, pts, fingers, period: between(rng, 11, 16), tilt: between(rng, 0.3, 1.1) };
}

/** Draw it at (cx, cy) with a full-grown radius of R pixels, at time t. */
export function drawNova(ctx: CanvasRenderingContext2D, v: Nova, cx: number, cy: number, R: number, t: number): void {
  const u = (t / v.period + 0.55) % 1;
  // The blast: a flare in the first moments, then the shell grows quickly and slows.
  const flash = Math.max(0, 1 - u / 0.06);
  const grow = 1 - Math.pow(1 - Math.min(1, u / 0.85), 2.2);
  const fade = u < 0.85 ? 1 : 1 - (u - 0.85) / 0.15;
  const rad = R * (0.04 + 0.96 * grow);
  if (flash > 0) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * (0.2 + flash * 0.6));
    g.addColorStop(0, ink.line(0.9 * flash));
    g.addColorStop(1, ink.line(0));
    ctx.fillStyle = g;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
  }
  const spin = t * 0.05;
  const [ct, st] = [Math.cos(v.tilt), Math.sin(v.tilt)];
  const dots = new Batch();
  if (v.kind === 'ring') {
    // An equatorial ring of hot knots, and two faint rings above and below it.
    for (const [off, rr, al] of [
      [0, 0.55, 0.8],
      [-0.35, 0.9, 0.25],
      [0.35, 0.9, 0.25],
    ] as const) {
      for (let k = 0; k < 90; k++) {
        const a = (k / 90) * Math.PI * 2 + spin;
        const [x, z] = [Math.cos(a) * rr, Math.sin(a) * rr];
        const p = [cx + x * rad, cy + (off * ct + z * st) * rad] as const;
        dots.dot(p[0], p[1], 2, al * (k % 6 === 0 ? 1 : 0.45));
      }
    }
  }
  for (const [x, y, z, reach, fil] of v.pts) {
    if (v.kind === 'web' && fil < 0.55) continue;
    if (v.kind === 'ring' && Math.abs(y) > 0.35) continue;
    const [xr, zr] = [x * Math.cos(spin) - z * Math.sin(spin), x * Math.sin(spin) + z * Math.cos(spin)];
    const [X, Y, Z] = [xr, y * ct - zr * st, y * st + zr * ct];
    // Limb brightening: a thin shell looks brightest where we see along it, at its edge.
    const limb = 0.25 + 0.75 * (1 - Math.abs(Z));
    const r = rad * reach * (v.kind === 'ring' ? 0.5 : 1);
    dots.dot(cx + X * r, cy + Y * r, 1.5, (v.kind === 'web' ? 1 : 0.5) * limb * limb);
  }
  // The ejecta: each finger a stream of particles flying out from the shell, brightest
  // where they leave it and thinning as they go.
  const turn = spin * 0.3;
  for (const [k, [a, reach]] of v.fingers.entries()) {
    const [c, s] = [Math.cos(a + turn), Math.sin(a + turn)];
    for (let j = 0; j < 7; j++) {
      const q = (j / 7 + t * (0.05 + (k % 5) * 0.012) + k * 0.37) % 1;
      const d = rad * (0.78 + q * (reach - 0.62));
      dots.dot(cx + c * d, cy + s * d, 1.6, (1 - q) * 0.95);
    }
  }
  // The shock front ahead of it: a thin ring of faint points, not a drawn circle.
  for (let k = 0; k < 220; k++) {
    const a = (k / 220) * Math.PI * 2 + Math.sin(k * 12.9898) * 0.02;
    const d = rad * (1.18 + Math.sin(k * 78.233) * 0.015);
    dots.dot(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1, 0.22 + 0.12 * Math.sin(k * 3.1));
  }
  dots.flush(ctx, 0.62 * fade);
  // Light rays: soft wedges whose brightness is a pulse running outward, the light of the
  // blast still crossing the remnant.
  ctx.globalCompositeOperation = 'lighter';
  for (const [k, [a]] of v.fingers.entries()) {
    if (k % 2) continue;
    const phase = (t * 0.18 + k * 0.29) % 1;
    ray(ctx, cx, cy, a + turn, rad * 0.55, rad * 1.6, rad * 0.12, phase, 0.16 * fade * (1 - phase * 0.6));
  }
  ctx.globalCompositeOperation = 'source-over';
  // The pulsar: the star's collapsed core in the signal, a soft point with its two beams
  // as jets of particles sweeping round.
  const b = t * 0.9;
  ctx.fillStyle = ink.signal(0.8);
  for (const side of [-1, 1])
    for (let j = 0; j < 6; j++) {
      const q = (j / 6 + t * 0.45) % 1;
      const wob = Math.sin(j * 7.1 + side) * 0.05;
      const [x, y] = [cx + side * Math.cos(b + wob) * R * 0.28 * q, cy + side * Math.sin(b + wob) * R * 0.11 * q];
      ctx.globalAlpha = (1 - q) * (1 - q) * 0.9;
      ctx.beginPath();
      ctx.arc(x, y, 1.3 * (1 - q * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  ctx.globalAlpha = 1;
  beacon(ctx, cx, cy, 9);
}
