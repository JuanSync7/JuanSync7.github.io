import type { Vec3 } from './camera';
import { Plot, type District } from './city';
import { powerline } from './civic';
import { bow } from './grounds';
import type { Rng } from './rng';

/** The dam's own board for the `district` template (2.4 × 1.5): an arch dam across a rock
 *  gorge, drawn open so its workings show. The reservoir stands at its water line behind
 *  it; penstocks run from intakes on its face down through it to the turbine runners in the
 *  powerhouse at its toe, each under its generator; the river leaves downstream; the
 *  transformers send the power out along a line of pylons. Rock formations close the gorge
 *  and line the shore, and trees grow on the banks. The seed picks where the dam stands, its
 *  height, the number of units, how the river bends and where the line runs. */

export const DAM_BOARD: [number, number] = [2.4, 1.5];
const [BW, BD] = [1.15, 0.7];

export function hydro(rng: Rng): District {
  const P = new Plot(rng);
  const xd = P.r(-0.2, 0.05);
  const [L, H, T] = [P.r(0.9, 1.05), P.r(0.24, 0.3), 0.22];
  const dam = P.add('damwall', xd, 0, T, L, H);
  P.landmark = dam;
  const face = xd - 0.15 * T;
  const reach = face + BW;
  P.add('reservoir', face - reach / 2, 0, reach, L, H * 0.8);
  const on = (x: number, z: number, r = 0): boolean => Math.abs(x) < BW - r && Math.abs(z) < BD - r;

  // The gorge: tall rock at both ends of the dam, and formations along the shore beyond the
  // water, so the lake is held by stone on every side.
  for (const s of [-1, 1]) {
    for (let k = 0; k < 6; k++) {
      const [x, z] = [xd + P.r(-0.3, 0.3), s * (L / 2 + P.r(0.06, 0.2))];
      const r = P.r(0.18, 0.3);
      if (on(x, z, r * 0.7)) P.add('rock', x, z, r * P.r(1.1, 1.5), r, P.r(H * 1.0, H * 1.35), 0, P.r(0, 3));
    }
    // Boulders and low shelves of rock, close together, round the shore.
    for (let a = 0.1; a < 1.5; a += P.r(0.07, 0.11)) {
      const [x, z] = [face - Math.sin(a) * reach * 1.04, s * Math.cos(a) * (L / 2) * 1.7];
      const r = P.r(0.12, 0.2);
      if (!on(x, z, r)) continue;
      if (P.rng() < 0.2) P.add('mesa', x, z, r * 2.2, r * 1.4, H * P.r(0.55, 0.7), 0, P.r(0, 3));
      else P.add('rock', x, z, r * P.r(1.2, 1.6), r, P.r(H * 0.85, H * 1.1), 0, P.r(0, 3));
    }
  }

  // The powerhouse at the toe, a runner and generator per unit, a penstock to each.
  const units = 2 + Math.floor(P.rng() * 3);
  const xp = xd + T * 0.5 + 0.12;
  const span = (units - 1) * 0.13;
  P.add('powerhouse', xp, 0, 0.2, span + 0.16, 0.11);
  for (let i = 0; i < units; i++) {
    const z = -span / 2 + i * 0.13;
    P.add('runner', xp, z, 0.1, 0.1, 0.03);
    P.add('generator', xp, z, 0.07, 0.07, 0.045, 0.04);
    const intake = face - bow(L) * (1 - ((2 * z) / L) ** 2);
    P.pipe([intake, H * 0.6, z], [xd + T * 0.2, H * 0.25, z], [xp - 0.03, 0.02, z]);
  }

  // The river: banks wandering out to the board's edge, its current, and ripples.
  const bend = P.r(0.15, 0.3) * (P.rng() < 0.5 ? -1 : 1);
  const mid = (x: number): number => bend * Math.sin(((x - xp) / (BW - xp)) * Math.PI * 0.8);
  const wide = (x: number): number => 0.12 + ((x - xp) / (BW - xp)) * 0.12;
  for (let x = xp + 0.1; x < BW - 0.04; x += 0.06)
    for (const s of [-1, 1]) P.line(x, mid(x) + s * wide(x), x + 0.06, mid(x + 0.06) + s * wide(x + 0.06));
  const current: Vec3[] = [];
  for (let x = xp + 0.1; x < BW; x += 0.08) current.push([x, 0.004, mid(x)]);
  P.pipe(...current);
  for (let k = 0; k < 9; k++) {
    const x = xp + 0.2 + ((k * 0.43) % 1) * (BW - xp - 0.3);
    const z = mid(x) + (((k * 0.71) % 1) - 0.5) * wide(x);
    P.line(x, z, x + 0.05, z);
  }

  // The switchyard and the line out; a service road from the crest down to the plant.
  const side = -Math.sign(bend) || 1;
  const yard: [number, number] = [xp + 0.12, side * (span / 2 + 0.22)];
  for (let i = 0; i < 3; i++) P.add('transformer', yard[0] + i * 0.08, yard[1], 0.06, 0.05, 0.06);
  P.add('block', yard[0] - 0.08, yard[1] + side * 0.12, 0.1, 0.07, 0.06);
  powerline(
    P,
    [yard[0] + 0.16, 0.06, yard[1]],
    [
      [yard[0] + 0.35, yard[1] + side * 0.1],
      [yard[0] + 0.6, yard[1] + side * 0.18],
      [BW - 0.05, side * (BD - 0.05)],
    ],
    0.13,
  );
  const r = (z: number): Vec3 => [xd + T * 0.6, 0.004, z];
  P.road(
    [
      r(side * (L / 2 - 0.04)),
      [xp + 0.1, 0.004, side * (span / 2 + 0.1)],
      [xp - 0.06, 0.004, side * (span / 2 + 0.08)],
      r(side * 0.2),
    ],
    0.035,
  );

  // Trees on both banks downstream and on the slopes above the lake.
  for (let x = xp + 0.15; x < BW - 0.1; x += 0.22)
    for (const s of [-1, 1]) {
      const z = mid(x) + s * (wide(x) + 0.14);
      if (on(x, z) && Math.abs(z - yard[1]) > 0.15) P.trees(x, z, 0.2, 0.14, 2, false);
    }
  for (const s of [-1, 1]) P.trees(face - reach * 0.55, s * 0.62, 0.5, 0.14, 4, false);
  P.trees(face - reach * 0.92, 0, 0.12, 0.4, 3, false);
  return P.done();
}
