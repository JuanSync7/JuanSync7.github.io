import type { Vec3 } from './camera';
import { bodyOf, isBox, isRound, place, type Part } from './city';
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

const WALLED = ['box', 'round', 'hex', 'tri'];
const standing = (p: Part): boolean =>
  (WALLED.includes(bodyOf(p.kind) ?? '') || p.kind === 'apartment') && p.h >= 0.07 && p.kind !== 'silo';

/** The faces a body's walls are made of, as `kit/shells.ts` draws them: a box's four, a hex's
 *  six, a triangle's three, a round tower's twelve; each as its outward angle and its
 *  distance out (at unit size: the part's w and d scale it). */
function faces(p: Part): [number, number][] {
  const body = bodyOf(p.kind) ?? (p.kind === 'apartment' ? 'box' : null);
  const n = body === 'box' ? 4 : body === 'hex' ? 6 : body === 'tri' ? 3 : body === 'round' ? 12 : 0;
  const a0 = n === 4 ? Math.PI / 4 : 0;
  const r = n === 4 ? Math.SQRT1_2 : 0.5;
  return Array.from({ length: n }, (_, k) => [a0 + ((k + 0.5) / n) * Math.PI * 2, r * Math.cos(Math.PI / n)]);
}

/** Window streaks on every face of every standing part, each lying on the face itself (a
 *  round tower's on its facets, a hex's on its six sides), floor by floor. */
export function windows(parts: readonly Part[], rng: Rng, max = 90): Lights {
  const out: Lights = { pos: [], phase: [], white: [] };
  for (const p of parts.filter(standing)) {
    const fs = faces(p);
    for (let y = 0.03; y < p.h - 0.015 && out.phase.length < max; y += 0.04) {
      for (const [a, apo] of fs) {
        if (rng() < (fs.length > 6 ? 0.75 : 0.5)) continue;
        // On the face: out from the centre along its normal, across it along its tangent.
        const [c, sn] = [Math.cos(a), Math.sin(a)];
        const half = Math.tan(Math.PI / fs.length) * apo;
        const u = (rng() - 0.5) * half * 0.8;
        const at = (v: number) =>
          place(p, (c * apo - sn * v) * p.w + c * 0.003, y, (sn * apo + c * v) * p.d + sn * 0.003);
        out.pos.push(...at(u - half * 0.45), ...at(u + half * 0.45));
        out.phase.push(rng());
        out.white.push(rng() > 0.55);
      }
    }
  }
  return out;
}

/** Skybridges between pairs of tall buildings a short walk apart, at two thirds of the lower. */
export function bridges(parts: readonly Part[], rng: Rng, max = 3): Vec3[][] {
  const OFFICES = ['block', 'tower', 'apartment', 'hex', 'tri'];
  const tall = parts.filter((p) => standing(p) && p.h >= 0.16 && !p.y && OFFICES.includes(p.kind));
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

const TAU = Math.PI * 2;

/** What moves: every runner's six blades at time t, and the hands of every clock face the
 *  camera (at yaw) can see, as segment endpoints in the district's frame. */
export function turning(parts: readonly Part[], t: number, yaw: number): number[] {
  const out: number[] = [];
  for (const p of parts) {
    const put = (x: number, y: number, z: number): void => void out.push(...place(p, x, y, z));
    if (p.kind === 'runner')
      for (let k = 0; k < 6; k++) {
        const a = t * 2.4 + (k / 6) * TAU;
        put(Math.cos(a) * p.w * 0.08, p.h * 0.6, Math.sin(a) * p.d * 0.08);
        put(Math.cos(a + 0.6) * p.w * 0.3, p.h * 0.6, Math.sin(a + 0.6) * p.d * 0.3);
      }
    if (p.kind !== 'clocktower') continue;
    const [m, hr] = [t * 0.35, (t * 0.35) / 12 + 1.1];
    const y = p.h * 0.62;
    for (const [nx, nz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const r = p.rot ?? 0;
      const [wx, wz] = [nx * Math.cos(r) - nz * Math.sin(r), nx * Math.sin(r) + nz * Math.cos(r)];
      if (wx * Math.sin(yaw) + wz * Math.cos(yaw) <= 0.05) continue;
      const [fx, fz] = [nx * (p.w / 2 + 0.002), nz * (p.d / 2 + 0.002)];
      for (const [a, len] of [
        [m, 0.26],
        [hr, 0.16],
      ] as const) {
        const [u, v] = [Math.sin(a) * p.w * len, Math.cos(a) * p.w * len];
        put(fx, y, fz);
        put(fx + (nz !== 0 ? u : 0), y + v, fz + (nx !== 0 ? -nx * u : 0));
      }
    }
  }
  return out;
}
