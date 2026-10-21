import type { Group } from 'three';
import { circle, fine, joints, rect, slab } from './layers';
import type { Mats } from './package';
import { PKG, TIV } from './package-plan';

/** The memory package that sits on top of a phone processor (`kit/package.ts`): LPDDR DRAM
 *  dies stacked four high, two side by side on each layer, each layer stepped back from the
 *  edge so the pads along its outer edge stay uncovered; gold wires looped from every pad down
 *  to bond fingers on a thin coreless substrate; the epoxy cap over it all; and the ring of
 *  package-on-package balls under the substrate, one on every via of the package below. */

const TIERS = 4;
const STEP = 0.05;
const PADS = 23;
const SIDES = [-1, 1] as const;
/** A die's outer edge, as |z|, on tier k: each layer is stepped in so the pads below show. */
const outer = (k: number): number => 1.18 - k * STEP;
const padX = (i: number): number => -1.1 + (i * 2.2) / (PADS - 1);
/** Where tier k's wires land: alternate tiers on two rows of fingers, shifted along x so no
 *  two wires share a finger. */
const finger = (k: number, i: number, s: number): [number, number] => [
  padX(i) + (k - 1.5) * 0.022,
  s * (k % 2 === 0 ? 1.27 : 1.35),
];

export function memSubstrate(g: Group, m: Mats): number {
  const h = 0.05;
  slab(g, m, PKG.a * 2, h, PKG.b * 2);
  const [o, y, { a, b }] = [[] as number[], h + 0.001, PKG];
  // A two-layer coreless laminate: one seam round the near faces; solder mask, the die-attach
  // outline, and the bond fingers with a trace from each out to its via.
  o.push(-a, h / 2, b, a, h / 2, b, a, h / 2, b, a, h / 2, -b);
  rect(o, -a + 0.05, -b + 0.05, a - 0.05, b - 0.05, y);
  for (const s of SIDES) rect(o, -1.2, s * 0.18, 1.2, s * outer(0), y);
  for (let k = 0; k < TIERS; k++)
    for (let i = 0; i < PADS; i++)
      for (const s of SIDES) {
        const [x, z] = finger(k, i, s);
        rect(o, x - 0.009, z - s * 0.035, x + 0.009, z + s * 0.035, y);
        if (k % 2 === 1) {
          o.push(x, y, z + s * 0.035, x, y, s * 1.405);
          circle(o, x, s * 1.415, 0.01, y);
        }
      }
  fine(g, m, o);
  return h;
}

export function dramDies(g: Group, m: Mats): number {
  const o: number[] = [];
  for (let k = 0; k < TIERS; k++) {
    const [y0, y1] = [k * STEP + 0.008, (k + 1) * STEP];
    for (const s of SIDES) {
      const [zo, zi] = [s * outer(k), s * (0.18 - k * STEP)];
      slab(g, m, 2.4, y1 - y0, Math.abs(zo - zi), 0, y0, (zo + zi) / 2);
      // Bond pads along the outer edge; on the top layer, the die's banks and its spine.
      for (let i = 0; i < PADS; i++)
        rect(o, padX(i) - 0.013, zo - s * 0.045, padX(i) + 0.013, zo - s * 0.019, y1 + 0.001);
      if (k === TIERS - 1) {
        // Eight banks in two rows either side of the spine, clear of the pad row.
        const [za, zb] = [Math.min(zo, zi) + 0.06, Math.max(zo, zi) - 0.06];
        const mid = (za + zb) / 2;
        o.push(-1.15, y1 + 0.001, mid, 1.15, y1 + 0.001, mid);
        for (let j = 0; j < 4; j++)
          for (const [z0, z1] of [
            [za, mid - 0.03],
            [mid + 0.03, zb],
          ])
            rect(o, -1.12 + j * 0.565, z0 ?? za, -0.6 + j * 0.565, z1 ?? zb, y1 + 0.001);
      }
    }
  }
  fine(g, m, o);
  return TIERS * STEP;
}

/** Each wire: a ball bond on the pad, a near-vertical rise, an arc out over the edge of the
 *  layers below, and a stitch on its finger: a cubic curve sampled in eight pieces. */
export function wireBonds(g: Group, m: Mats): number {
  const o: number[] = [];
  let top = 0;
  for (let k = 0; k < TIERS; k++)
    for (const s of SIDES)
      for (let i = 0; i < PADS; i++) {
        const [x0, y0, z0] = [padX(i), (k + 1) * STEP + 0.001, s * (outer(k) - 0.032)];
        const [x1, z1] = finger(k, i, s);
        const peak = y0 + 0.05;
        top = Math.max(top, peak);
        const c = [z0, z0, z1 - s * 0.03, z1];
        const yy = [y0, peak, peak, 0.002];
        let prev: number[] = [x0, y0, z0];
        for (let n = 1; n <= 8; n++) {
          const t = n / 8;
          const w = [(1 - t) ** 3, 3 * t * (1 - t) ** 2, 3 * t * t * (1 - t), t ** 3];
          const at = [
            x0 + (x1 - x0) * t,
            w.reduce((a, q, j) => a + q * (yy[j] ?? 0), 0),
            w.reduce((a, q, j) => a + q * (c[j] ?? 0), 0),
          ];
          o.push(...prev, ...at);
          prev = at;
        }
        circle(o, x0, z0, 0.011, y0, 8);
      }
  fine(g, m, o);
  return top;
}

export function memCap(g: Group, m: Mats): number {
  const h = 0.3;
  slab(g, m, PKG.a * 2, h, PKG.b * 2);
  const [o, y, { a, b }] = [[] as number[], h + 0.002, PKG];
  // The mark: outline, pin-one dot, three rule lines for the part number and lot, and a
  // data matrix in the near corner (dots, never letters).
  rect(o, -a + 0.08, -b + 0.08, a - 0.08, b - 0.08, y);
  circle(o, -a + 0.22, -b + 0.22, 0.06, y);
  for (const [x1, z] of [
    [0.3, -0.3],
    [-0.1, -0.1],
    [0.5, 0.1],
  ] as const)
    o.push(-1.05, y, z, x1, y, z);
  for (let i = 0; i < 10; i++)
    for (let j = 0; j < 10; j++)
      if (i === 0 || j === 9 || (i * 7 + j * 13 + i * j) % 5 < 2)
        rect(o, 0.62 + i * 0.05, 0.55 + j * 0.05, 0.655 + i * 0.05, 0.585 + j * 0.05, y);
  fine(g, m, o);
  return h;
}

export function popBalls(g: Group, m: Mats): number {
  joints(g, m, TIV, 0.03);
  return 0.06;
}
