import { Plot, type District } from './city';
import { airport, datacentre } from './civic';
import { block, streets } from './streets';
import { mine } from './mining';
import { energy, grid, smalls } from './power';
import type { Rng } from './rng';
import { foundry } from './works';

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

function exchange(P: Plot, k: number): void {
  if (k === 1) {
    // The financial district: the trading hall's dome behind the stock exchange's columned
    // front on its plaza, towers on the blocks either side, each crowned its own way.
    streets(P, [-0.42, 0.42], [0.22], [-0.85, 0.85, -0.55, 0.55]);
    P.add('dome', 0, -0.2, 0.36, 0.36, 0.2);
    P.add('bourse', 0, 0.36, 0.34, 0.14, 0.12);
    block(P, -0.85, -0.42, -0.55, 0.22, 0.85);
    block(P, 0.42, 0.85, -0.55, 0.22, 0.85);
    block(P, -0.85, -0.42, 0.22, 0.55, 0.4);
    block(P, 0.42, 0.85, 0.22, 0.55, 0.4);
    P.trees(-0.25, 0.4, 0.12, 0.16, 2, true);
    P.trees(0.25, 0.4, 0.12, 0.16, 2, true);
    grid(P, -0.7, 0.45, [
      [0, -0.2],
      [-0.6, -0.1],
    ]);
  } else {
    // The vault under the towers, the exchange's datacentre beside it.
    for (let a = 0; a < 24; a++) {
      const t = (a / 24) * Math.PI * 2;
      P.add('wall', Math.cos(t) * 0.3 - 0.35, Math.sin(t) * 0.22, 0.07, 0.07, 0.06, 0, t);
    }
    P.add('tank', -0.35, 0, 0.2, 0.2, 0.1);
    // The banks' own offices and the museum of money round the vault.
    P.add('museum', -0.35, 0.38, 0.26, 0.16, 0.12);
    block(P, -0.85, -0.55, -0.55, 0.0, 0.5, 0.26);
    datacentre(P, 0.42, 0, 2);
    grid(P, 0.42, 0.4, [[0.42, 0.12]]);
    smalls(P, -0.75, 0.42, 4);
    P.trees(-0.72, -0.42, 0.2, 0.1, 3, false);
  }
}

function field(P: Plot): void {
  P.runway = airport(P, 0, -0.08, 1.8);
  P.trees(-0.9, 0.35, 0.3, 0.2, 5, false);
  grid(P, 0.85, -0.42, [
    [0.26, 0.12],
    [-0.05, 0.14],
  ]);
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
