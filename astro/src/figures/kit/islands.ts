import { Plot, type District } from './city';
import { airport, datacentre, powerline, substation } from './civic';
import { assembly, capacitors, conveyor, dam, furnace, geothermal, pit, refinery, silos } from './industry';
import type { Rng } from './rng';

/** The islands round the platform's hub, each a shorter stack of boards (`kit/city.ts`)
 *  that makes one thing: a mine that digs, smelts and refines; a foundry whose open line
 *  builds cars; a finance exchange; an energy island of reactor, wind, sun, geothermal and
 *  hydro; and the airport the planes fly from. Each board is centred on the island, ground at
 *  y = 0; level 0 is the lowest. */

export const ISLANDS = ['mine', 'foundry', 'exchange', 'energy', 'airport'] as const;
export type Island = (typeof ISLANDS)[number];
/** How many boards each island stacks: the mine goes deep, energy carries the most plant. */
export const DEPTH: Record<Island, number> = { mine: 3, foundry: 2, exchange: 2, energy: 3, airport: 1 };

/** Board k's width and depth: most islands 1.7 × 1.1; the energy island's top, where most
 *  of its plant stands, and the airport's runway board are larger. */
export function size(kind: Island, k: number): [number, number] {
  if (kind === 'energy') return k === 2 ? [2.4, 1.5] : [1.8, 1.2];
  if (kind === 'airport') return [2.3, 1.05];
  if (kind === 'mine') return [1.8, 1.2];
  return [1.7, 1.1];
}

function mine(P: Plot, k: number): void {
  if (k === 2) {
    // Pit to crusher by haul truck, crusher to silos by belt; the silos feed the shaft down.
    pit(P, -0.42, 0.05, [0.06, -0.08]);
    conveyor(P, [0.11, -0.08], [0.3, -0.3]);
    silos(P, 0.3, -0.36, 3);
    P.add('hall', 0.62, 0.28, 0.24, 0.14, 0.07);
    P.add('shed', 0.62, 0.02, 0.2, 0.12, 0.06);
    for (let i = 0; i < 3; i++) P.add('heap', 0.32 + i * 0.12, 0.2, 0.1, 0.1, P.r(0.05, 0.08));
    P.rocks(0.72, -0.42, 0.24, 0.16, 5);
    P.trees(-0.75, -0.45, 0.2, 0.14, 4, false);
  } else if (k === 1) {
    // Smelting and refining as one line: ore in from the shaft, metal on to the refinery,
    // product out to the store.
    const metal = furnace(P, -0.4, -0.12, [-0.7, 0.2]);
    P.add('silo', -0.72, 0.28, 0.07, 0.07, 0.12);
    conveyor(P, metal, [0.0, -0.12], 0.03);
    P.add('shed', 0.06, -0.12, 0.14, 0.12, 0.06);
    const out = refinery(P, 0.25, -0.3, [0.13, -0.12]);
    for (let i = 0; i < 3; i++) P.add('block', out[0] + 0.1 + i * 0.09, out[1] + 0.1, 0.07, 0.07, 0.05);
    conveyor(P, out, [out[0] + 0.1, out[1] + 0.1], 0.02);
    P.add('stack', -0.6, -0.38, 0.04, 0.04, 0.3);
  } else {
    // Underground: drifts follow the ore body; carts wait at the shaft bottoms.
    for (const z of [-0.3, 0, 0.3]) P.line(-0.8, z, 0.8, z + P.r(-0.08, 0.08));
    for (const x of [-0.5, 0.25, 0.55]) P.line(x, -0.5, x, 0.5);
    for (let i = 0; i < 9; i++) P.add('cell', P.r(-0.7, 0.7), [-0.3, 0, 0.3][i % 3] ?? 0, 0.06, 0.035, 0.03);
    P.rocks(-0.3, 0.15, 0.5, 0.25, 9);
    P.rocks(0.45, -0.25, 0.3, 0.2, 6);
    for (let i = 0; i < 3; i++) P.add('tank', 0.7, -0.3 + i * 0.12, 0.08, 0.08, 0.06);
    P.add('stack', -0.7, -0.42, 0.05, 0.05, 0.2);
  }
}

function foundry(P: Plot, k: number): void {
  if (k === 1) {
    // The open car line, chimneys behind it, and a test track out front.
    assembly(P, -0.52, 0.42, -0.02);
    for (let i = 0; i < 3; i++) P.add('stack', -0.5 + i * 0.36, -0.4, 0.045, 0.045, P.r(0.24, 0.32));
    P.add('hall', 0.0, -0.36, 0.5, 0.14, 0.07);
    P.road(
      Array.from({ length: 24 }, (_, i) => [
        0.1 + Math.cos((i / 24) * Math.PI * 2) * 0.42,
        0.004,
        0.33 + Math.sin((i / 24) * Math.PI * 2) * 0.13,
      ]),
      0.045,
    );
    P.trees(0.1, 0.33, 0.5, 0.12, 4, false);
  } else {
    // The press shop and parts store feed the line above; trucks bring the steel in.
    for (let i = 0; i < 3; i++) P.add('hall', -0.45 + i * 0.3, -0.22, 0.24, 0.16, 0.08);
    for (let i = 0; i < 4; i++) P.add('block', -0.5 + i * 0.3, 0.2, 0.2, 0.14, P.r(0.05, 0.08));
    P.road(
      [
        [-0.75, 0.004, 0.0],
        [0.75, 0.004, 0.0],
        [0.75, 0.004, 0.42],
        [-0.75, 0.004, 0.42],
      ],
      0.05,
    );
  }
}

function exchange(P: Plot, k: number): void {
  if (k === 1) {
    // Towers crowd round the trading hall's dome, leaving a plaza open in front of it.
    P.add('dome', -0.05, -0.02, 0.4, 0.4, 0.2);
    const kinds = ['tower', 'block', 'hex', 'tri'] as const;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + P.r(-0.1, 0.1);
      if (Math.cos(a) > 0.15 && Math.sin(a) > 0.15) continue;
      const kind = kinds[i % 4] ?? 'block';
      P.add(
        kind,
        Math.cos(a) * P.r(0.42, 0.68),
        Math.sin(a) * P.r(0.32, 0.44),
        P.r(0.08, 0.12),
        P.r(0.08, 0.12),
        P.r(0.22, 0.52),
        0,
        a,
      );
    }
    P.trees(0.45, 0.3, 0.36, 0.22, 6);
    P.ellipse(-0.05, -0.02, 0.3, 0.27);
  } else {
    // The vault under the towers, the exchange's datacentre beside it.
    for (let a = 0; a < 24; a++) {
      const t = (a / 24) * Math.PI * 2;
      P.add('wall', Math.cos(t) * 0.3 - 0.35, Math.sin(t) * 0.22, 0.07, 0.07, 0.06, 0, t);
    }
    P.add('tank', -0.35, 0, 0.2, 0.2, 0.1);
    datacentre(P, 0.42, 0, 2);
  }
}

function energy(P: Plot, k: number): void {
  if (k === 2) {
    // The reactor and its turbine hall between two cooling towers; wind along the back
    // edge, solar rows to the right; a switchyard sends it all out.
    P.add('dome', -0.35, -0.15, 0.26, 0.26, 0.16);
    P.add('hall', -0.05, -0.15, 0.24, 0.14, 0.08);
    P.add('cooler', -0.78, -0.32, 0.3, 0.3, 0.34);
    P.add('cooler', -0.82, 0.12, 0.26, 0.26, 0.3);
    P.pipe([-0.35, 0.03, -0.15], [-0.17, 0.03, -0.15]);
    P.pipe([-0.78, 0.03, -0.32], [-0.6, 0.03, -0.32], [-0.6, 0.03, -0.15], [-0.48, 0.03, -0.15]);
    P.pipe([-0.82, 0.03, 0.12], [-0.6, 0.03, 0.12], [-0.6, 0.03, -0.15]);
    for (let i = 0; i < 8; i++) P.add('turbine', -1.0 + i * 0.28, 0.6, 0.03, 0.03, P.r(0.34, 0.42));
    for (let i = 0; i < 8; i++) P.add('solar', 0.72, -0.62 + i * 0.12, 0.46, 0.08, 0.05);
    const out = substation(P, 0.2, 0.22);
    powerline(P, out, [
      [0.07, -0.15],
      [-0.2, 0.25],
    ]);
  } else if (k === 1) {
    geothermal(P, 0.25, -0.1);
    capacitors(P, -0.55, 0.15, 3, 6);
    for (let i = 0; i < 3; i++) P.add('hall', -0.5 + i * 0.22, -0.32, 0.18, 0.1, 0.05, 0, 0);
  } else {
    // Hydro under the plant: a dam holds a lake; transformers and capacitor banks beside.
    dam(P, -0.15, 0.0);
    for (let i = 0; i < 3; i++) P.add('hall', 0.42, -0.35 + i * 0.2, 0.2, 0.12, 0.06, 0, 0);
    capacitors(P, 0.35, 0.32, 2, 7);
    for (let i = 0; i < 4; i++) P.add('block', -0.65 + i * 0.1, -0.45, 0.06, 0.05, 0.06);
  }
}

function field(P: Plot): void {
  P.runway = airport(P, 0, -0.08, 1.8);
  P.trees(-0.9, 0.35, 0.3, 0.2, 5, false);
  P.rocks(0.92, 0.32, 0.2, 0.18, 4);
}

/** Board k of an island, bottom to top. */
export function island(kind: Island, k: number, rng: Rng): District {
  const P = new Plot(rng);
  if (kind === 'mine') mine(P, k);
  else if (kind === 'foundry') foundry(P, k);
  else if (kind === 'exchange') exchange(P, k);
  else if (kind === 'energy') energy(P, k);
  else field(P);
  return P.done();
}
