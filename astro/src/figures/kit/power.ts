import type { Plot } from './city';
import { powerline, substation } from './civic';
import { capacitors, dam, geothermal } from './industry';

/** The energy island's three boards, and the small grid every island gets: a substation
 *  feeding poles out to the buildings that draw power. Bottom up: a battery station that
 *  stores the island's output beside the dam; fuel cells, a fuel-rod store under its
 *  crane, transformers and geothermal wells; on top the reactor, cooling towers, wind and
 *  sun. Each level's port, where its power goes up by via, is at its switchyard. */

/** A substation at (x, z) with a line of poles out to each target. */
export function grid(P: Plot, x: number, z: number, targets: readonly [number, number][]): void {
  const from = substation(P, x, z);
  for (const [tx, tz] of targets)
    powerline(
      P,
      from,
      [
        [(x + tx) / 2, (z + tz) / 2],
        [tx, tz],
      ],
      0.08,
    );
}

/** Small buildings of mixed shapes along a row: offices, a control room, stores. */
export function smalls(P: Plot, x: number, z: number, n: number, step = 0.1): void {
  const kinds = ['block', 'hex', 'tri', 'block', 'house', 'dome'] as const;
  for (let i = 0; i < n; i++) {
    const kind = kinds[Math.floor(P.rng() * kinds.length)] ?? 'block';
    const s = P.r(0.05, 0.08);
    P.add(kind, x + i * step, z + P.r(-0.02, 0.02), s, s * P.r(0.8, 1.2), kind === 'dome' ? s * 0.5 : P.r(0.04, 0.09));
  }
}

export function energy(P: Plot, k: number): void {
  if (k === 2) {
    // The reactor and its turbine hall between two cooling towers; wind along the back
    // edge, solar rows to the right; the switchyard's transformers send it all out.
    P.add('dome', -0.35, -0.15, 0.26, 0.26, 0.16);
    P.add('hall', -0.05, -0.15, 0.24, 0.14, 0.08);
    P.add('factory', -0.35, 0.18, 0.22, 0.12, 0.07);
    P.add('cooler', -0.78, -0.32, 0.3, 0.3, 0.34);
    P.add('cooler', -0.82, 0.12, 0.26, 0.26, 0.3);
    P.pipe([-0.35, 0.03, -0.15], [-0.17, 0.03, -0.15]);
    P.pipe([-0.78, 0.03, -0.32], [-0.6, 0.03, -0.32], [-0.6, 0.03, -0.15], [-0.48, 0.03, -0.15]);
    P.pipe([-0.82, 0.03, 0.12], [-0.6, 0.03, 0.12], [-0.6, 0.03, -0.15]);
    for (let i = 0; i < 8; i++) P.add('turbine', -1.0 + i * 0.28, 0.6, 0.03, 0.03, P.r(0.34, 0.42));
    for (let i = 0; i < 8; i++) P.add('solar', 0.72, -0.62 + i * 0.12, 0.46, 0.08, 0.05);
    for (let i = 0; i < 3; i++) P.add('transformer', 0.12 + i * 0.09, 0.4, 0.07, 0.06, 0.06);
    grid(P, 0.2, 0.22, [
      [0.07, -0.15],
      [-0.2, 0.3],
      [0.45, -0.3],
    ]);
    smalls(P, 0.05, -0.5, 5);
    P.trees(1.0, 0.45, 0.25, 0.18, 4, false);
  } else if (k === 1) {
    // Fuel: cell modules in rows, the rods' pool under its crane; geothermal wells; the
    // switchyard where the level's power leaves.
    geothermal(P, 0.25, -0.1);
    for (let r = 0; r < 2; r++)
      for (let i = 0; i < 5; i++) P.add('fuelcell', -0.6 + i * 0.12, 0.26 + r * 0.13, 0.09, 0.07, 0.06);
    P.add('rods', -0.6, -0.3, 0.26, 0.16, 0.06);
    P.add('crane', -0.6, -0.3, 0.3, 0.2, 0.12);
    P.add('hall', -0.25, -0.32, 0.18, 0.12, 0.06);
    for (let i = 0; i < 3; i++) P.add('transformer', 0.55 + i * 0.09, 0.3, 0.07, 0.06, 0.06);
    capacitors(P, 0.55, 0.42, 2, 5);
    grid(P, 0.62, 0.05, [
      [-0.4, 0.1],
      [0.25, -0.1],
      [-0.25, -0.2],
    ]);
    smalls(P, -0.75, -0.5, 6);
    P.port(0.72, 0.18);
    P.trees(0.75, -0.42, 0.18, 0.12, 3, false);
  } else {
    // Storage under it all: a battery station of containers in rows with their inverters
    // and transformers, beside the dam that holds the lake.
    dam(P, -0.45, 0.05);
    for (let r = 0; r < 3; r++)
      for (let i = 0; i < 6; i++) P.add('battery', 0.15 + i * 0.11, -0.4 + r * 0.09, 0.1, 0.05, 0.045);
    for (let i = 0; i < 3; i++) P.add('block', 0.2 + i * 0.22, -0.1, 0.06, 0.05, 0.05);
    for (let i = 0; i < 3; i++) P.add('transformer', 0.25 + i * 0.18, 0.05, 0.07, 0.06, 0.06);
    grid(P, 0.5, 0.3, [
      [0.25, -0.15],
      [-0.2, 0.05],
      [0.75, 0.05],
    ]);
    smalls(P, 0.05, 0.42, 7);
    P.port(0.45, 0.05);
    P.trees(-0.75, -0.45, 0.2, 0.14, 3, false);
  }
}
