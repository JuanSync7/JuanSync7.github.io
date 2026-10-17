import type { Vec3 } from './camera';
import { isBox, isRound, type Part } from './city';
import type { Rng } from './rng';

/** What makes a district look lived in: windows that come on and go off, skybridges between
 *  tall buildings, and power lines from a generator out to its neighbours. Everything is in
 *  the district's own coordinates, ground at y = 0, built from its parts (`kit/city.ts`). */

export interface Lights {
  /** Segment endpoints, one short streak per window. */
  pos: number[];
  /** Per window: where in its on/off cycle it starts (0..1), and whether it burns white. */
  phase: number[];
  white: boolean[];
}

const standing = (p: Part): boolean => (isBox(p.kind) || isRound(p.kind) || p.kind === 'apartment') && p.h >= 0.07;

/** Window streaks on the two faces a camera in front and to the right sees (+x and +z). */
export function windows(parts: readonly Part[], rng: Rng, max = 90): Lights {
  const out: Lights = { pos: [], phase: [], white: [] };
  for (const p of parts.filter(standing)) {
    for (let y = 0.03; y < p.h - 0.015 && out.phase.length < max; y += 0.04) {
      for (const face of [0, 1]) {
        if (rng() < 0.45) continue;
        const s = (rng() - 0.5) * 0.4;
        if (face === 0) {
          const x = p.x + p.w / 2 + 0.003;
          out.pos.push(x, y, p.z + (s - 0.24) * p.d, x, y, p.z + (s + 0.24) * p.d);
        } else {
          const z = p.z + p.d / 2 + 0.003;
          out.pos.push(p.x + (s - 0.24) * p.w, y, z, p.x + (s + 0.24) * p.w, y, z);
        }
        out.phase.push(rng());
        out.white.push(rng() > 0.55);
      }
    }
  }
  return out;
}

/** Skybridges between pairs of tall buildings a short walk apart, at two thirds of the lower. */
export function bridges(parts: readonly Part[], rng: Rng, max = 3): Vec3[][] {
  const tall = parts.filter((p) => standing(p) && p.h >= 0.12);
  const out: Vec3[][] = [];
  tall.forEach((a, i) => {
    tall.slice(i + 1).forEach((b) => {
      const d = Math.hypot(a.x - b.x, a.z - b.z);
      if (out.length < max && d > 0.18 && d < 0.5 && rng() > 0.35) {
        const y = Math.min(a.h, b.h) * 0.66;
        out.push([
          [a.x, y, a.z],
          [b.x, y, b.z],
        ]);
      }
    });
  });
  return out;
}

/** Power lines from the district's generator (its largest round part) to its nearest
 *  buildings, run along the ground in an L like a trace on a board. */
export function power(parts: readonly Part[], n = 4): Vec3[][] {
  const gen = parts.filter((p) => isRound(p.kind)).sort((a, b) => b.w * b.h - a.w * a.h)[0];
  if (!gen) return [];
  const near = parts
    .filter((p) => (isBox(p.kind) || p.kind === 'apartment') && p.h >= 0.05)
    .sort((a, b) => Math.hypot(a.x - gen.x, a.z - gen.z) - Math.hypot(b.x - gen.x, b.z - gen.z))
    .slice(0, n);
  return near.map((t): Vec3[] => [
    [gen.x, 0.004, gen.z],
    [t.x, 0.004, gen.z],
    [t.x, 0.004, t.z],
  ]);
}

/** The roof of a standing part chosen at random, for a pipe to land on. */
export function roof(parts: readonly Part[], rng: Rng): Part | undefined {
  const tall = parts.filter(standing);
  return tall[Math.floor(rng() * tall.length)];
}

/** The rotors of a district's wind turbines at time t, as segment endpoints: three slim
 *  blades each, turning in the plane in front of the mast, a little out of step. */
export function rotors(parts: readonly Part[], t: number): number[] {
  const out: number[] = [];
  parts
    .filter((p) => p.kind === 'turbine')
    .forEach((p, n) => {
      const [hx, hy, hz] = [p.x, p.h, p.z + 0.035];
      for (let k = 0; k < 3; k++) {
        const a = t * 1.6 + n * 0.7 + (k * Math.PI * 2) / 3;
        const [c, s] = [Math.cos(a), Math.sin(a)];
        const tip = p.h * 0.42;
        // A blade is a thin triangle: root, a widened shoulder, and the tip.
        const sh: [number, number] = [hx + c * tip * 0.25 - s * 0.012, hy + s * tip * 0.25 + c * 0.012];
        out.push(hx, hy, hz, sh[0], sh[1], hz, sh[0], sh[1], hz, hx + c * tip, hy + s * tip, hz);
        out.push(hx + c * tip, hy + s * tip, hz, hx, hy, hz);
      }
    });
  return out;
}
