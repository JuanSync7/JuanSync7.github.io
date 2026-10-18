import type { Vec3 } from './camera';
import { trees, type District, type Part } from './city';
import type { Rng } from './rng';

/** The islands around the platform's hub, each a shorter stack of boards (`kit/city.ts` parts)
 *  that makes one thing: a mine digging raw material, a foundry's production line, a finance
 *  exchange, and an energy island of reactor, cooling towers, wind and solar. Boards are about
 *  1.7 wide and 1.1 deep, centred on the island, ground at y = 0; level 0 is the lowest. */

export const ISLANDS = ['mine', 'foundry', 'exchange', 'energy'] as const;
export type Island = (typeof ISLANDS)[number];
/** How many boards each island stacks: the mine goes deep, the energy island carries pipe runs. */
export const DEPTH: Record<Island, number> = { mine: 3, foundry: 2, exchange: 2, energy: 3 };
export const IW = 1.7;
export const ID = 1.1;

/** Board k of an island, bottom to top. */
export function island(kind: Island, k: number, rng: Rng): District {
  const r = (a: number, b: number): number => a + rng() * (b - a);
  const parts: Part[] = [];
  const traces: District['traces'] = [];
  const pipes: Vec3[][] = [];
  const top = k === DEPTH[kind] - 1;
  const add = (kind: Part['kind'], x: number, z: number, w: number, d: number, h: number): void => {
    parts.push({ kind, x, z, w, d, h });
  };
  const ellipse = (cx: number, cz: number, rx: number, rz: number): void => {
    for (let i = 0; i < 20; i++) {
      const [a, b] = [(i / 20) * Math.PI * 2, ((i + 1) / 20) * Math.PI * 2];
      traces.push([cx + Math.cos(a) * rx, cz + Math.sin(a) * rz, cx + Math.cos(b) * rx, cz + Math.sin(b) * rz]);
    }
  };
  if (kind === 'mine') {
    if (top) {
      // The open pit is a funnel of benches; headframes stand over the shafts; a belt carries
      // ore from the pit to the heaps.
      for (let i = 1; i <= 4; i++) ellipse(-0.4, 0.05, 0.1 * i, 0.07 * i);
      add('headframe', 0.25, -0.28, 0.12, 0.12, 0.3);
      add('headframe', 0.55, 0.2, 0.1, 0.1, 0.22);
      for (let i = 0; i < 4; i++) add('heap', 0.35 + i * 0.13, -0.05 + r(-0.04, 0.04), 0.12, 0.12, r(0.06, 0.1));
      add('belt', 0.0, -0.05, 0.6, 0.03, 0.025);
      add('shed', 0.6, -0.38, 0.32, 0.16, 0.08);
      pipes.push([
        [-0.4, 0.01, 0.05],
        [0.3, 0.03, -0.05],
        [0.75, 0.03, -0.05],
      ]);
    } else if (k === 1) {
      for (let i = 0; i < 6; i++) for (const z of [-0.2, 0.15]) add('tank', -0.6 + i * 0.16, z, 0.11, 0.11, 0.07);
      add('block', 0.45, -0.25, 0.22, 0.18, 0.12);
      add('block', 0.5, 0.25, 0.3, 0.16, 0.08);
      add('belt', 0, 0.38, 1.2, 0.03, 0.02);
    } else {
      // Underground: drifts follow the ore body, carts wait at the shaft bottoms.
      for (const z of [-0.3, 0, 0.3]) traces.push([-0.75, z, 0.75, z + r(-0.08, 0.08)]);
      for (const x of [-0.5, 0.25, 0.55]) traces.push([x, -0.45, x, 0.45]);
      for (let i = 0; i < 9; i++) add('cell', r(-0.7, 0.7), [-0.3, 0, 0.3][i % 3] ?? 0, 0.06, 0.035, 0.03);
      for (let i = 0; i < 5; i++) add('heap', r(-0.6, 0.6), r(-0.4, 0.4), 0.09, 0.07, 0.04);
    }
  } else if (kind === 'foundry') {
    if (top) {
      // Saw-tooth production halls in rows, chimneys behind, an assembly line along the front.
      for (let i = 0; i < 3; i++) add('shed', -0.4 + i * 0.36, -0.2, 0.3, 0.34, r(0.08, 0.11));
      for (let i = 0; i < 3; i++) add('stack', -0.55 + i * 0.36, -0.44, 0.045, 0.045, r(0.22, 0.32));
      add('belt', 0, 0.18, 1.3, 0.035, 0.025);
      for (let i = 0; i < 4; i++) add('block', -0.5 + i * 0.32, 0.36, 0.14, 0.1, 0.06);
      add('tank', 0.7, -0.05, 0.12, 0.12, 0.12);
      add('tank', 0.7, 0.12, 0.09, 0.09, 0.09);
      pipes.push([
        [-0.65, 0.03, 0.18],
        [0.65, 0.03, 0.18],
      ]);
    } else {
      for (let i = 0; i < 5; i++)
        for (const z of [-0.25, 0.2]) add('block', -0.6 + i * 0.3, z, 0.22, 0.26, r(0.06, 0.1));
      for (const z of [-0.45, 0, 0.45]) traces.push([-0.8, z, 0.8, z]);
    }
  } else if (kind === 'exchange') {
    if (top) {
      // The exchange: towers crowd round the trading hall's dome, leaving a plaza open in
      // front of it (toward +x, +z, where a camera usually stands).
      add('dome', -0.05, -0.02, 0.4, 0.4, 0.2);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + r(-0.1, 0.1);
        if (Math.cos(a) > 0.15 && Math.sin(a) > 0.15) continue;
        const [x, z] = [Math.cos(a) * r(0.42, 0.68), Math.sin(a) * r(0.32, 0.44)];
        if (rng() > 0.6) add('tower', x, z, 0.09, 0.09, r(0.3, 0.55));
        else add('block', x, z, r(0.08, 0.13), r(0.08, 0.12), r(0.2, 0.5));
      }
      trees(rng, 0.45, 0.3, 0.36, 0.22, 6, parts);
      ellipse(-0.05, -0.02, 0.3, 0.27);
    } else {
      // The vault: a walled keep under the towers, servers in rows round it.
      for (let a = 0; a < 24; a++)
        add('wall', Math.cos((a / 24) * Math.PI * 2) * 0.3, Math.sin((a / 24) * Math.PI * 2) * 0.22, 0.07, 0.07, 0.06);
      add('tank', 0, 0, 0.2, 0.2, 0.1);
      for (let i = 0; i < 6; i++)
        for (const s of [-1, 1]) add('rack', s * (0.5 + (i % 2) * 0.14), -0.3 + (i >> 1) * 0.3, 0.08, 0.14, 0.12);
    }
  } else if (top) {
    // Energy: a reactor and its cooling towers, wind on one edge, solar rows on the other.
    add('dome', -0.15, -0.1, 0.24, 0.24, 0.14);
    add('cooler', -0.5, -0.22, 0.26, 0.26, 0.3);
    add('cooler', -0.55, 0.18, 0.22, 0.22, 0.26);
    add('block', 0.12, -0.12, 0.14, 0.16, 0.08);
    for (let i = 0; i < 5; i++) add('turbine', -0.7 + i * 0.32, 0.45, 0.03, 0.03, r(0.34, 0.42));
    for (let i = 0; i < 5; i++) add('solar', 0.55, -0.42 + i * 0.13, 0.4, 0.08, 0.05);
    pipes.push(
      [
        [-0.5, 0.02, -0.22],
        [-0.15, 0.02, -0.22],
        [-0.15, 0.02, -0.1],
      ],
      [
        [-0.55, 0.02, 0.18],
        [-0.15, 0.02, 0.18],
        [-0.15, 0.02, -0.1],
      ],
      [
        [0.12, 0.02, -0.12],
        [0.12, 0.02, 0.25],
        [0.55, 0.02, 0.25],
      ],
    );
  } else {
    // Under the plant: pipe runs between heat exchangers, and the grid's transformers below.
    const lo = k === 0;
    for (let i = 0; i < (lo ? 8 : 5); i++)
      add(lo ? 'block' : 'tank', -0.6 + i * (lo ? 0.17 : 0.28), lo ? -0.3 : r(-0.1, 0.1), 0.1, 0.1, lo ? 0.07 : 0.12);
    for (let i = 0; i < 4; i++) {
      const z = -0.38 + i * 0.25;
      pipes.push([
        [-0.75, 0.02, z],
        [r(-0.2, 0.2), 0.02, z],
        [r(0.3, 0.5), 0.02, z + 0.1],
        [0.75, 0.02, z + 0.1],
      ]);
    }
    if (lo) for (let i = 0; i < 4; i++) add('tank', 0.5, -0.1 + i * 0.15, 0.1, 0.1, 0.06);
  }
  return { parts, traces, pipes };
}
