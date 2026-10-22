import type { Group } from 'three';
import { fine, rect, slab } from './layers';
import type { Mats } from './package';
import { DIE } from './package-plan';

/** A phone processor die (`kit/package.ts`) with its floorplan drawn on top, in the order a
 *  die shot of an A-series chip shows it: two performance cores sharing an L2, four efficiency
 *  cores with theirs, a six-core GPU, a sixteen-core neural engine, two banks of system cache,
 *  the image, display and media engines and the secure enclave, and LPDDR interfaces along
 *  both long edges. In the package the die faces down; it is drawn face up so it can be read. */

const lines = (o: number[], x0: number, x1: number, z0: number, z1: number, y: number, every: number): void => {
  for (let x = x0 + every; x < x1 - every / 2; x += every) o.push(x, y, z0, x, y, z1);
};
const cells = (o: number[], x0: number, z0: number, x1: number, z1: number, n: number, k: number, y: number) => {
  const [w, d] = [(x1 - x0) / n, (z1 - z0) / k];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < k; j++)
      rect(o, x0 + i * w + 0.008, z0 + j * d + 0.008, x0 + (i + 1) * w - 0.008, z0 + (j + 1) * d - 0.008, y);
  return [w, d] as const;
};

export function socDie(g: Group, m: Mats): number {
  const { a, b, h } = DIE;
  slab(g, m, a * 2, h, b * 2);
  const [o, y] = [[] as number[], h + 0.002];
  rect(o, -a + 0.03, -b + 0.03, a - 0.03, b - 0.03, y);
  rect(o, -a + 0.05, -b + 0.05, a - 0.05, b - 0.05, y);
  // LPDDR interfaces along both long edges, toward the vias that carry them up to the memory.
  for (const s of [-1, 1]) {
    rect(o, -1.0, s * 0.87, 1.0, s * 0.94, y);
    lines(o, -1.0, 1.0, s * 0.87, s * 0.94, y, 0.03);
  }
  // CPU: two performance cores, each with its own blocks, over a shared L2; four efficiency
  // cores over theirs.
  for (const x0 of [-1.0, -0.71]) {
    rect(o, x0, -0.84, x0 + 0.27, -0.52, y);
    rect(o, x0 + 0.03, -0.81, x0 + 0.13, -0.7, y);
    rect(o, x0 + 0.15, -0.81, x0 + 0.24, -0.64, y);
  }
  rect(o, -1.0, -0.48, -0.44, -0.28, y);
  lines(o, -1.0, -0.44, -0.48, -0.28, y, 0.025);
  cells(o, -1.0, -0.2, -0.44, -0.04, 4, 1, y);
  rect(o, -1.0, 0.0, -0.44, 0.14, y);
  lines(o, -1.0, -0.44, 0.0, 0.14, y, 0.025);
  // GPU: six cores, each four shader arrays.
  const [gw, gd] = cells(o, -0.34, -0.84, 0.54, -0.18, 3, 2, y);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 2; j++) {
      const [cx, cz] = [-0.34 + (i + 0.5) * gw, -0.84 + (j + 0.5) * gd];
      o.push(
        cx,
        y,
        cz - gd / 2 + 0.02,
        cx,
        y,
        cz + gd / 2 - 0.02,
        cx - gw / 2 + 0.02,
        y,
        cz,
        cx + gw / 2 - 0.02,
        y,
        cz,
      );
    }
  // Neural engine: sixteen cores, each with its own buffer.
  const [nw, nd] = cells(o, 0.62, -0.84, 1.0, -0.18, 4, 4, y);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const [x0, z0] = [0.62 + i * nw, -0.84 + j * nd];
      rect(o, x0 + 0.025, z0 + 0.025, x0 + nw / 2, z0 + nd / 2, y);
    }
  // System-level cache: two banks of arrays.
  for (const [x0, x1] of [
    [-0.34, 0.31],
    [0.35, 1.0],
  ] as const) {
    rect(o, x0, -0.1, x1, 0.26, y);
    lines(o, x0, x1, -0.1, 0.26, y, 0.022);
    o.push(x0, y, 0.08, x1, y, 0.08);
  }
  // Image signal processor, display engine, media engine, secure enclave, always-on block.
  cells(o, -1.0, 0.36, -0.46, 0.8, 3, 2, y);
  rect(o, -0.4, 0.36, -0.05, 0.8, y);
  lines(o, -0.4, -0.05, 0.36, 0.8, y, 0.05);
  rect(o, 0.01, 0.36, 0.42, 0.8, y);
  rect(o, 0.04, 0.4, 0.2, 0.76, y);
  rect(o, 0.24, 0.4, 0.39, 0.76, y);
  rect(o, 0.48, 0.5, 0.66, 0.68, y);
  rect(o, 0.53, 0.55, 0.61, 0.63, y);
  rect(o, 0.72, 0.36, 1.0, 0.8, y);
  rect(o, 0.76, 0.4, 0.96, 0.76, y);
  fine(g, m, o);
  return h;
}
