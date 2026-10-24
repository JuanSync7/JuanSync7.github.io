import type { Plot } from './city';

/** City streets for `kit/city.ts` boards: a street is its two kerbs; where two cross, a zebra
 *  crossing over each arm, just back from the junction where the pavements meet it; every
 *  street is a lane (`District.lanes`) that buildings keep clear of, and people walk its
 *  pavements (`kit/crowd.ts`), crossing on the zebras. */

/** Half a street's width, and how far a pavement's walkers are from its middle. */
export const KERB = 0.03;
export const PAVEMENT = 0.05;

/** Streets along x at each of zs and along z at each of xs, over the box x0..x1, z0..z1. */
export function streets(
  P: Plot,
  xs: readonly number[],
  zs: readonly number[],
  box: [number, number, number, number],
): void {
  const [x0, x1, z0, z1] = box;
  for (const x of xs) {
    for (const s of [-1, 1]) P.line(x + s * KERB, z0, x + s * KERB, z1);
    P.lanes.push([x, z0, x, z1]);
  }
  for (const z of zs) {
    for (const s of [-1, 1]) P.line(x0, z + s * KERB, x1, z + s * KERB);
    P.lanes.push([x0, z, x1, z]);
  }
  // A crossing over each arm of each junction, on the pavement's line.
  for (const x of xs)
    for (const z of zs)
      for (const s of [-1, 1]) {
        P.add('zebra', x, z + s * PAVEMENT, KERB * 2, 0.022, 0.002);
        P.add('zebra', x + s * PAVEMENT, z, KERB * 2, 0.022, 0.002, 0, Math.PI / 2);
      }
}

/** Fill a city block (x0..x1, z0..z1, between streets) with buildings on a grid of lots,
 *  set back from the pavements: towers where `tall` is high, mid-rise offices otherwise. No
 *  tower is taller than `top`, so it clears the board above with its crown and spire. */
export function block(P: Plot, x0: number, x1: number, z0: number, z1: number, tall: number, top = 0.5): void {
  const inset = PAVEMENT + 0.025;
  const [a0, a1, b0, b1] = [x0 + inset, x1 - inset, z0 + inset, z1 - inset];
  const nx = Math.max(1, Math.round((a1 - a0) / 0.13));
  const nz = Math.max(1, Math.round((b1 - b0) / 0.13));
  const kinds = ['block', 'block', 'tower', 'hex', 'tri'] as const;
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < nz; j++) {
      if (P.rng() < 0.12) continue;
      const lw = (a1 - a0) / nx;
      const ld = (b1 - b0) / nz;
      const [cx, cz] = [a0 + (i + 0.5) * lw, b0 + (j + 0.5) * ld];
      const high = P.rng() < tall;
      const kind = high ? (kinds[Math.floor(P.rng() * kinds.length)] ?? 'block') : 'block';
      const s = Math.min(lw, ld) * P.r(0.6, 0.85);
      P.add(
        kind,
        cx,
        cz,
        s,
        kind === 'block' ? Math.min(ld * 0.85, s * P.r(0.8, 1.2)) : s,
        high ? P.r(0.2, top) : P.r(0.06, 0.14),
      );
    }
}
