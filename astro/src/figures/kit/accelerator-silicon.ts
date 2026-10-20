import { fine, grid, rect, slab, specks, type Paint } from './iso2d';

/** The silicon of the accelerator package (`kit/accelerator.ts`): two compute dies with
 *  their floorplans, and eight HBM stacks, with the footprints the layers under them share. */

/** The compute dies (x0, x1) over z ±1.0, and the memory stacks' centres (x, z). */
export const DIES = [
  [-1.63, -0.03],
  [0.03, 1.63],
] as const;
export const HBM_X = [-1.2, -0.4, 0.4, 1.2];
export const HBM = { hw: 0.36, hd: 0.25, z: 1.36 };

/** One HBM stack: a base logic die, eight DRAM dies seamed round the near faces, a cap die,
 *  and the field of through-silicon vias showing on top. */
export function stack(p: Paint, x: number, z: number): void {
  const [x0, x1, z0, z1] = [x - HBM.hw, x + HBM.hw, z - HBM.hd, z + HBM.hd];
  slab(p, x0 - 0.02, z0 - 0.02, x1 + 0.02, z1 + 0.02, 0.46, 0.49);
  slab(p, x0, z0, x1, z1, 0.49, 0.68);
  const o: number[] = [];
  for (let k = 1; k <= 8; k++) {
    const y = 0.49 + k * 0.021;
    o.push(x0, y, z1, x1, y, z1, x1, y, z1, x1, y, z0);
  }
  rect(o, x0 + 0.05, z0 + 0.05, x1 - 0.05, z1 - 0.05, 0.681);
  fine(p, o, 0.24);
  specks(p, grid(x, z, 0.42, 0.12, 14, 4), 0.681);
}

/** One compute die: seal ring, PHY lanes along both long edges toward the stacks, the
 *  die-to-die link along the edge it shares, a band of L2 cache, and two banks of cores,
 *  each core with its tensor unit. `inner` points toward the other die. */
export function die(p: Paint, x0: number, x1: number, inner: number): void {
  slab(p, x0, -1, x1, 1, 0.46, 0.68);
  const [o, y] = [[] as number[], 0.681];
  rect(o, x0 + 0.03, -0.97, x1 - 0.03, 0.97, y);
  for (const s of [-1, 1]) {
    rect(o, x0 + 0.06, s * 0.94, x1 - 0.06, s * 0.82, y);
    for (let u = x0 + 0.09; u < x1 - 0.06; u += 0.035) o.push(u, y, s * 0.93, u, y, s * 0.83);
  }
  const ix = inner > 0 ? x1 : x0;
  rect(o, ix - inner * 0.04, -0.78, ix - inner * 0.14, 0.78, y);
  for (let z = -0.75; z < 0.76; z += 0.035) o.push(ix - inner * 0.05, y, z, ix - inner * 0.13, y, z);
  const [cx0, cx1] = inner > 0 ? [x0 + 0.06, x1 - 0.18] : [x0 + 0.18, x1 - 0.06];
  rect(o, cx0, -0.1, cx1, 0.1, y);
  for (let u = cx0 + 0.03; u < cx1; u += 0.03) o.push(u, y, -0.1, u, y, 0.1);
  const cw = (cx1 - cx0) / 6;
  for (let i = 0; i < 6; i++)
    for (const z0 of [-0.78, -0.47, 0.15, 0.46]) {
      const u = cx0 + i * cw;
      rect(o, u, z0, u + cw - 0.025, z0 + 0.28, y);
      rect(o, u + 0.03, z0 + 0.03, u + 0.09, z0 + 0.09, y);
    }
  fine(p, o, 0.22);
}
