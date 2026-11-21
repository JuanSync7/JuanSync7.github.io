import type { Group } from 'three';
import type { Drawing } from './drawing/monodraw';
import type { Sketch, V3 } from './drawing/monoline';

/** What the six experience scenes share (`experience-icon`): one floor, one frame, so the six
 *  cards read as a set at one scale, and the small moves they all use. Units are metres. */

/** The floor's side: every scene stands on the same square. */
export const F = 2.6;
/** Pixels per metre at the smallest width the cards are shown (a phone's card): what decides
 *  whether a cable is a line or a tube (`kit/cable.ts`). */
export const PX = 80;
/** The box every camera frames: the floor and 1.9 m of height above it. */
export const FRAME = [0, -0.03, 0, F, 1.9, F] as const;

export function floor(k: Sketch): void {
  k.object('floor', () => k.box(0, -0.03, 0, F, 0, F, { tier: 'soft' }));
}

/** Smoothstep of x between a and b. */
export function ease(a: number, b: number, x: number): number {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
}

/** Puts moving set `name` at its pivot plus `by`. */
export function shift(d: Drawing, name: string, pivot: V3, by: V3): Group | undefined {
  const g = d.moving.get(name);
  g?.position.set(pivot[0] + by[0], pivot[1] + by[1], pivot[2] + by[2]);
  return g;
}

/** Four square legs under a top from (x0, z0) to (x1, z1), `s` wide, from the floor to `y`. */
export function legs(k: Sketch, x0: number, z0: number, x1: number, z1: number, y: number, s = 0.04): void {
  for (const x of [x0, x1 - s]) for (const z of [z0, z1 - s]) k.box(x, 0, z, x + s, y, z + s);
}

/** A padlock hung on a face that looks along +x (yaw 0) or +z (yaw -π/2), its body's top
 *  centre at `at`: a body and its shackle. */
export function padlock(k: Sketch, at: V3, yaw: number, s = 1, tier: 'hot' | 'edge' = 'edge'): void {
  k.at(at, yaw, () => {
    k.box(0, -0.13 * s, -0.06 * s, 0.035 * s, 0, 0.06 * s, { tier });
    k.at([0.0175 * s, 0, 0], Math.PI / 2, () => k.torus(0, 0, 0, 0.042 * s, 0.009 * s, { tier }));
    k.circle([0.036 * s, -0.07 * s, 0], 0.012 * s, 'x', tier === 'hot' ? 'hot' : 'soft', 12);
  });
}

/** A path's point at `u` (0..1) of its length. */
export function along(path: V3[], u: number): V3 {
  const seg = path.slice(1).map((p, i) => {
    const a = path[i] ?? p;
    return Math.hypot(p[0] - a[0], p[1] - a[1], p[2] - a[2]);
  });
  let left = Math.min(1, Math.max(0, u)) * seg.reduce((s, x) => s + x, 0);
  for (let i = 0; i < seg.length; i++) {
    const l = seg[i] ?? 0;
    const [a, b] = [path[i], path[i + 1]];
    if (a && b && (left <= l || i === seg.length - 1)) {
      const f = l ? Math.min(1, left / l) : 0;
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
    }
    left -= l;
  }
  return path[0] ?? [0, 0, 0];
}
