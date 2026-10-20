import { Batch } from './batch';
import { beacon } from './glow';
import { ink } from './ink';
import { between, pick, type Rng } from './rng';

export { Batch };

/** Galaxies as clouds of stars: spirals with their arms, knots and dust, barred spirals,
 *  ellipticals and irregulars, every one seeded, each seen at its own tilt and roll and
 *  turning faster near the core. `drawGalaxy` takes a placement function from the galaxy's
 *  sky plane to the canvas, so one galaxy can sit in a field of others, be lensed round a
 *  black hole, or be flown into. */

export const KINDS = ['spiral', 'spiral', 'barred', 'elliptical', 'irregular'] as const;
export type Kind = (typeof KINDS)[number];
export type Pt = [number, number];
/** A placement: from the galaxy's sky plane (its radius is 1) to the canvas, or null if
 *  the point is not drawn. */
export type Place = (x: number, y: number) => Pt | null;

export interface Star {
  /** Radius in the disc, angle, height off it. */
  r: number;
  a: number;
  y: number;
  /** Brightness 0..1; below 0 a dust grain, drawn dark. */
  b: number;
  /** A soft glow round the star this wide (galaxy radii), for the haze along an arm. */
  glow?: number | undefined;
}
export interface Galaxy {
  kind: Kind;
  stars: Star[];
  /** How far the disc is tipped up from edge-on (0 edge-on, π/2 face-on), and its turn
   *  on the sky. */
  tilt: number;
  roll: number;
  spin: number;
  /** Radius of the bright core. */
  core: number;
}

const gauss = (rng: Rng): number => (rng() + rng() + rng() - 1.5) / 1.5;

export function galaxy(rng: Rng, n: number, kind: Kind = pick(rng, KINDS)): Galaxy {
  const stars: Star[] = [];
  const arms = 2 + Math.floor(rng() * 4);
  const wind = between(rng, 2, 5.5);
  const bar = kind === 'barred' ? between(rng, 0.2, 0.4) : 0;
  const core = kind === 'elliptical' ? between(rng, 0.25, 0.45) : between(rng, 0.08, 0.2);
  const flat = between(rng, 0.25, 0.9);
  const clumps = Array.from(
    { length: 4 + Math.floor(rng() * 5) },
    () => [between(rng, 0.2, 0.9), rng() * 6.3, between(rng, 0.06, 0.18)] as const,
  );
  for (let i = 0; i < n; i++) {
    const u = rng();
    if (kind === 'elliptical') {
      // An ellipsoid, densest at the centre: radius from a steep power, a random direction.
      const r = Math.pow(rng(), 1.8);
      const [a, c] = [rng() * Math.PI * 2, rng() * 2 - 1];
      stars.push({ r: r * Math.sqrt(1 - c * c), a, y: r * c * flat, b: 0.2 + (1 - r) * 0.6 * rng() });
    } else if (kind === 'irregular') {
      const [cr, ca, cs] = clumps[i % clumps.length] ?? [0.5, 0, 0.1];
      const [x, z] = [cr * Math.cos(ca) + gauss(rng) * cs * 2, cr * Math.sin(ca) * 0.6 + gauss(rng) * cs * 2];
      stars.push({ r: Math.hypot(x, z), a: Math.atan2(z, x), y: gauss(rng) * 0.05, b: rng() * (u < 0.1 ? 1 : 0.6) });
    } else if (u < 0.22) {
      const r = Math.abs(gauss(rng)) * core * 1.6;
      stars.push({ r, a: rng() * Math.PI * 2, y: gauss(rng) * core * 0.5, b: 0.4 + rng() * 0.5 });
    } else if (u < 0.45) {
      // The disc between the arms: an exponential spread of older, dimmer stars.
      const r = Math.min(1, -Math.log(1 - rng() * 0.95) * 0.3);
      stars.push({ r, a: rng() * Math.PI * 2, y: gauss(rng) * 0.03, b: rng() * 0.35 });
    } else if (bar && u < 0.55) {
      const x = gauss(rng) * bar;
      stars.push({
        r: Math.abs(x),
        a: (x < 0 ? Math.PI : 0) + gauss(rng) * 0.12,
        y: gauss(rng) * 0.02,
        b: 0.3 + rng() * 0.5,
      });
    } else {
      // An arm star: along a log spiral from the core (or the bar's end), scattered more at
      // the rim; one in eight sits in a knot of young stars, one in six is dust on the
      // arm's inner edge.
      const arm = i % arms;
      const r = Math.max(bar, core * 0.6) + Math.pow(rng(), 0.8) * (1 - Math.max(bar, core * 0.6));
      const spread = gauss(rng) * (0.16 + 0.26 * (1 - r));
      const a = (arm / arms) * Math.PI * 2 + (r - bar) * wind + spread;
      const dust = u > 0.9;
      const knot = !dust && u > 0.83;
      stars.push({
        r: r + (knot ? gauss(rng) * 0.01 : 0),
        a: dust ? a - 0.12 : knot ? Math.round(a * 4) / 4 + gauss(rng) * 0.02 : a,
        y: gauss(rng) * 0.025,
        b: dust ? -0.5 : knot ? 0.75 + rng() * 0.25 : rng() * 0.7,
      });
    }
  }
  return {
    kind,
    stars,
    tilt: between(rng, 0, 1.45),
    roll: rng() * Math.PI,
    spin: (rng() < 0.5 ? -1 : 1) * between(rng, 0.02, 0.06),
    core,
  };
}

/** A star's place on the galaxy's sky plane at time t: turned on its orbit (faster inside),
 *  tipped by the tilt and turned by the roll. Also its depth, toward the viewer positive. */
export function sky(g: Galaxy, s: Star, t: number): [number, number, number] {
  const a = s.a + (t * g.spin) / Math.sqrt(Math.max(0.05, s.r));
  const [x, z] = [Math.cos(a) * s.r, Math.sin(a) * s.r];
  const [ct, st] = [Math.cos(g.tilt), Math.sin(g.tilt)];
  const [X, Y] = [x, s.y * ct - z * st];
  const [cr, sr] = [Math.cos(g.roll), Math.sin(g.roll)];
  return [X * cr - Y * sr, X * sr + Y * cr, s.y * st + z * ct];
}

export interface Look {
  /** Overall opacity. */
  alpha: number;
  /** Canvas pixels per unit of the galaxy, for the glow and the size of a star. */
  size: number;
  /** The core in the signal. */
  hot?: boolean;
  /** Where each star was a moment ago, in a fly-through. A star moving fast across the
   *  view is close to the camera: it is drawn bigger and softer, never as a streak. */
  was?: Place | undefined;
}

/** A star at p, d pixels across, that was at q a moment ago. The faster it crosses the view
 *  the nearer the camera it is, so it grows into a soft round glow and dims as it grows (its
 *  light spread over more of the view); a slow one stays a sharp point. */
function near(b: Batch, p: Pt, q: Pt | null | undefined, d: number, a: number): void {
  const move = q ? Math.hypot(q[0] - p[0], q[1] - p[1]) : 0;
  const k = Math.min(1, Math.max(0, (move - 1.5) / 5));
  if (k < 1) b.dot(p[0], p[1], d, a * (1 - k));
  if (k > 0) {
    const r = d * (1.2 + Math.min(move, 24) * 0.22);
    b.glow(p[0], p[1], r, a * k * Math.min(1, (2.4 * d) / r));
  }
}

export function drawGalaxy(ctx: CanvasRenderingContext2D, g: Galaxy, t: number, place: Place, look: Look): void {
  const { alpha, size } = look;
  if (alpha < 0.01) return;
  const c = place(0, 0);
  if (c && size * g.core > 2) {
    ctx.save();
    ctx.translate(c[0], c[1]);
    ctx.rotate(g.roll);
    ctx.scale(1, Math.max(0.12, Math.sin(g.tilt)));
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * g.core * 2.2);
    glow.addColorStop(0, ink.line(0.32 * alpha));
    glow.addColorStop(1, ink.line(0));
    ctx.fillStyle = glow;
    ctx.fillRect(-size * g.core * 2.2, -size * g.core * 2.2, size * g.core * 4.4, size * g.core * 4.4);
    ctx.restore();
  }
  const dot = Math.max(1, Math.min(2.4, size / 220));
  // A galaxy only a few pixels across needs only some of its stars to read. The count
  // grows smoothly with its size, and the last stars fade in, so none pops into view.
  const all = g.stars.length;
  const want = Math.min(all, Math.max(150, all * Math.min(1, size / 160)));
  const b = new Batch();
  for (let i = 0; i < want; i++) {
    const s = g.stars[i];
    if (!s) continue;
    const [x, y] = sky(g, s, t);
    const p = place(x, y);
    if (!p) continue;
    if (s.b < 0) {
      b.dust(p[0], p[1], Math.min(dot, 1.4));
      continue;
    }
    const a = (0.15 + s.b * 0.75) * Math.min(1, (want - i) / (want * 0.15));
    // The haze reads only while it is a soft blur among the stars; close up it would be a
    // white wash over the view, so it thins as it grows and is gone past 90 px.
    const hr = s.glow ? size * s.glow : 0;
    if (hr > 3 && hr < 90) b.glow(p[0], p[1], hr, a * Math.min(1, 14 / hr) * 0.2);
    near(b, p, look.was?.(x, y), s.b > 0.93 ? dot * 1.6 : dot, a);
  }
  b.flush(ctx, alpha * 0.8);
  if (look.hot && c) {
    beacon(ctx, c[0], c[1], 8);
  }
}

/** Faint field stars scattered over a plane `w` × `h` units, centred on the origin. */
export function field(rng: Rng, n: number, w: number, h: number): Star[] {
  return Array.from({ length: n }, () => ({ r: (rng() - 0.5) * w, a: (rng() - 0.5) * h, y: 0, b: Math.pow(rng(), 3) }));
}

export function drawField(
  ctx: CanvasRenderingContext2D,
  stars: readonly Star[],
  t: number,
  place: Place,
  alpha = 1,
  was?: Place,
): void {
  const b = new Batch();
  for (const [i, s] of stars.entries()) {
    const p = place(s.r, s.a);
    if (!p) continue;
    const a = (0.12 + s.b * 0.85) * (0.75 + 0.25 * Math.sin(t * (0.8 + (i % 7) * 0.3) + i));
    near(b, p, was?.(s.r, s.a), s.b > 0.8 ? 2 : 1, a);
  }
  b.flush(ctx, alpha * 0.7);
}
