import { fine, rect, slab, specks, type Paint } from './iso2d';

/** The dies of one HBM stack (`kit/hbm.ts`), cut open along their through-silicon via band so
 *  the near face is a section: z runs from the back edge (−DEPTH) to the cut (0). Each die
 *  faces down, so its wiring (BEOL) is the thin band along its underside and its bumps hang
 *  below; the floorplan on top is drawn faintly, as if seen through the silicon. */

/** Half-width and depth of a DRAM die, and the half-size of the larger base die under it. */
export const HALF = 1;
export const DEPTH = 1;
export const BASE = 1.08;

/** Via columns: four channel groups of six across the band, and three rows back from the cut. */
export const TSV_X = [-0.72, -0.24, 0.24, 0.72].flatMap((c) => [0, 1, 2, 3, 4, 5].map((i) => c + (i - 2.5) * 0.034));
export const TSV_Z = [-0.035, -0.07, -0.105];
export const VIAS: [number, number][] = TSV_X.flatMap((x) => TSV_Z.map((z): [number, number] => [x, z]));

export type DieKind = 'core' | 'top' | 'base';
export type Lit = (part: string) => Paint;

/** A core DRAM die's floorplan: the via band and the periphery behind it, then four channels,
 *  each two pseudo-channels of two bank groups, every bank group split into mats with a row
 *  decoder down its middle. */
function cells(o: number[], y: number): void {
  rect(o, -0.95, -0.13, 0.95, -0.01, y);
  o.push(-0.95, y, -0.17, 0.95, y, -0.17);
  for (const c of [-0.72, -0.24, 0.24, 0.72])
    for (const [x0, x1] of [
      [c - 0.21, c - 0.01],
      [c + 0.01, c + 0.21],
    ] as const)
      for (const [z0, z1] of [
        [-0.95, -0.59],
        [-0.56, -0.2],
      ] as const) {
        rect(o, x0, z0, x1, z1, y);
        o.push((x0 + x1) / 2, y, z0, (x0 + x1) / 2, y, z1);
        for (let z = z0 + 0.09; z < z1 - 0.02; z += 0.09) o.push(x0, y, z, x1, y, z);
      }
}

/** The base die's floorplan: the via band, the PHY along the edge that faces the compute die
 *  with one stripe per lane group, the direct-access test port's pads on the far edge, and
 *  the logic between (channel controllers, ECC and self-test, repair). */
function logic(p: Paint, o: number[], y: number): void {
  rect(o, -1.0, -0.13, 1.0, -0.01, y);
  rect(o, 0.76, -1.0, 1.02, -0.2, y);
  for (let z = -0.97; z < -0.22; z += 0.05) o.push(0.78, y, z, 1.0, y, z);
  rect(o, -1.02, -0.92, -0.86, -0.28, y);
  for (let i = 0; i < 4; i++)
    for (const [z0, z1] of [
      [-0.95, -0.6],
      [-0.55, -0.2],
    ] as const) {
      const x0 = -0.8 + i * 0.38;
      rect(o, x0, z0, x0 + 0.34, z1, y);
      rect(o, x0 + 0.04, z0 + 0.04, x0 + 0.14, z0 + 0.12, y);
    }
  const pads: [number, number][] = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 12; j++) pads.push([-0.99 + i * 0.05, -0.89 + j * 0.052]);
  specks(p, pads, y);
}

/** One die from y0 to y1. Core and base dies are pierced by the vias; the top die is not, and
 *  is left thick so the stack grinds to its height. */
export function die(at: Lit, kind: DieKind, y0: number, y1: number): void {
  const part = kind === 'core' ? 'dram' : kind;
  const h = kind === 'base' ? BASE : HALF;
  const d = kind === 'base' ? BASE : DEPTH;
  const body = at(part);
  slab(body, -h, -d, h, 0, y0, y1);
  const [plan, top] = [[] as number[], y1 + 0.001];
  rect(plan, -h + 0.03, -d + 0.03, h - 0.03, -0.005, top);
  if (kind === 'base') logic(body, plan, top);
  else cells(plan, top);
  fine(body, plan, 0.13);
  // The section: wiring layers along the underside, thicker on the logic die.
  const beol = kind === 'base' ? 0.04 : 0.022;
  const cut: number[] = [];
  for (const f of kind === 'base' ? [0.25, 0.5, 0.75, 1] : [0.5, 1])
    cut.push(-h, y0 + beol * f, 0, h, y0 + beol * f, 0);
  fine(body, cut, 0.32);
  if (kind === 'top') return;
  // Each via: a copper column from the wiring up through the silicon, with its landing pad on
  // the back face, where the next die's bump sits.
  const v: number[] = [];
  for (const x of TSV_X) {
    v.push(x, y0 + beol, 0, x, y1, 0, x - 0.011, y1, 0, x + 0.011, y1, 0);
    v.push(x - 0.006, y0 + beol, 0, x - 0.006, y1 - 0.004, 0);
  }
  const via = at('tsv');
  fine(via, v, 0.42);
  specks(via, VIAS, top);
}
