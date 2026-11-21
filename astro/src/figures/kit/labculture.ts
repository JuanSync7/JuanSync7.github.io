import { Matrix4, Quaternion, Vector3, type InstancedMesh } from 'three';
import type { Sketch, V3 } from './monoline';
import { SCREEN } from './labbench';
import { DISH } from './labkit';
import { mulberry32 } from './rng';

/** The lab room's experiment: a culture growing in the open dish, colony by colony, logged as a
 *  growth curve on the monitor. Each run is seeded, so every run grows a different plate; the
 *  plate is cleared and seeded again when the curve tops out. */

export const RUN = 12;
const N = 26;
const GROW = 1.6;
const CLEAR = 11.2;
/** The curve's midpoint (s into a run) and steepness: count = N / (1 + e^(-RATE (u - MID))). */
const MID = 4.6;
const RATE = 1.1;

interface Colony {
  x: number;
  z: number;
  r: number;
  at: number;
}

/** Where and when each colony of run `c` appears: spread over the agar, none touching. */
export function plate(seed: number, c: number): Colony[] {
  const rng = mulberry32(seed + c * 7919);
  const out: Colony[] = [];
  for (let tries = 0; out.length < N && tries < 2000; tries++) {
    const [a, d] = [rng() * Math.PI * 2, Math.sqrt(rng()) * (DISH.r - 0.008)];
    const [x, z, r] = [Math.cos(a) * d, Math.sin(a) * d, 0.0045 + rng() * rng() * 0.008];
    if (out.some((o) => Math.hypot(o.x - x, o.z - z) < o.r + r + 0.003)) continue;
    // Colonies come up along the growth curve: few, then many, then few.
    const share = (out.length + 0.5 + (rng() - 0.5) * 0.8) / N;
    out.push({ x, z, r, at: MID + Math.log(share / (1 - share)) / RATE });
  }
  return out;
}

const ease = (a: number, b: number, x: number): number => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
const m = new Matrix4();
const q = new Quaternion();
const p = new Vector3();
const s = new Vector3();

const up = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
const MAG = SCREEN.r / DISH.r;

/** Sets every colony's size for time `u` into the run, in the dish and magnified on the monitor
 *  (`spots` holds both: the dish first, then the screen); returns how many have come up. */
export function grow(spots: InstancedMesh, colonies: Colony[], u: number): number {
  const gone = 1 - ease(CLEAR, CLEAR + 0.6, u);
  let count = 0;
  for (let i = 0; i < N; i++) {
    const c = colonies[i];
    const k = c ? ease(c.at, c.at + GROW, u) * gone : 0;
    if (c && k > 0.4 && gone > 0.5) count++;
    const [x, z, r] = [c?.x ?? 0, c?.z ?? 0, (c?.r ?? 0) * k + 1e-5];
    spots.setMatrixAt(i, m.compose(p.set(DISH.x + x, DISH.y + 0.0006, DISH.z + z), q, s.set(r, 0.0012, r)));
    const at = p.set(SCREEN.x + x * MAG, SCREEN.y - z * MAG, SCREEN.z);
    spots.setMatrixAt(N + i, m.compose(at, up, s.set(r * MAG, 0.0008, r * MAG)));
  }
  spots.instanceMatrix.needsUpdate = true;
  return count;
}

/** How much of the growth curve is drawn at time `u`: it follows the colonies up. */
export const logged = (u: number): number => (u > CLEAR ? 0 : Math.min(1, u / 9.2));

/** The growth curve, drawn on the monitor as it is logged (`reveal`). */
export function curve(k: Sketch): void {
  k.moving('plot', [0, 0, 0], () => {
    const pts: V3[] = Array.from({ length: 40 }, (_, i): V3 => {
      const x = i / 39;
      return [1.645 + x * 0.29, 1.113 + 0.25 / (1 + Math.exp(-RATE * (x * 9.2 - MID))), 0.192];
    });
    k.line(pts, 'hot');
  });
}

/** Spots to allocate: each colony twice, in the dish and on the screen. */
export const COLONIES = N * 2;
