/** The two clocks (from hairline): a discrete change gets a long ease-out, a continuous
 *  input gets a spring. Figures use these instead of inventing timings. */

export const EASE_MS = 700;

/** cubic-bezier(.32, .72, 0, 1) approximated: fast start, long settle. */
export function easeOut(t: number): number {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  return 1 - Math.pow(1 - k, 3.4);
}

/** Smooth 0..1 between two edges. */
export function smoothstep(a: number, b: number, x: number): number {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
}

export function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

export interface Spring {
  x: number;
  v: number;
  /** Target. */
  t: number;
}

export function spring(x = 0): Spring {
  return { x, v: 0, t: x };
}

/** Steps a spring with stiffness 100, damping 18, mass 1 (critically damped enough to never ring). */
export function stepSpring(s: Spring, dt: number): void {
  const h = Math.min(dt, 1 / 30);
  const a = 100 * (s.t - s.x) - 18 * s.v;
  s.v += a * h;
  s.x += s.v * h;
}

/** Exponential follow toward a target: frame-rate independent. */
export function follow(x: number, target: number, dt: number, rate = 8): number {
  return x + (target - x) * (1 - Math.exp(-rate * dt));
}
