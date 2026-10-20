import { DIES, HBM, HBM_X, die, stack } from './accelerator-silicon';
import { cap, fine, grid, pt, rect, ring, slab, specks, spheres, type Paint } from './iso2d';
import { ink } from './ink';
import type { Rng } from './rng';

/** An AI accelerator's 2.5D package, the CoWoS way, drawn on a 2D canvas in hairline
 *  isometric for `accelerator-package`: two reticle-sized compute dies joined edge to edge
 *  with eight HBM stacks along their long sides, all on one silicon interposer, on C4 bumps,
 *  on an organic substrate with its capacitors, on a ball grid, under one copper lid. Each
 *  assembly paints itself in its own frame at its assembled height; the figure lifts it.
 *  One unit ≈ 10 mm across; heights are drawn about three times true so the layers read. */

export type { Paint } from './iso2d';

export const ASSEMBLY_IDS = [
  'balls',
  'substrate',
  'c4',
  'interposer',
  'ubumps',
  'hbm-back',
  'dies',
  'hbm-front',
  'tim',
  'lid',
] as const;
export type AssemblyId = (typeof ASSEMBLY_IDS)[number];

/** How far each assembly rises when the package is open, and its extent [x0, z0, x1, z1,
 *  y0, y1] assembled, for sizing its sprite. The two halves of the HBM rise with the dies. */
export const LIFT: Record<AssemblyId, number> = {
  balls: -1.0,
  substrate: 0,
  c4: 1.0,
  interposer: 2.05,
  ubumps: 3.0,
  'hbm-back': 4.05,
  dies: 4.05,
  'hbm-front': 4.05,
  tim: 5.35,
  lid: 7.05,
};
const S = 2.8;
const I = 1.75;
export const EXTENT: Record<AssemblyId, readonly number[]> = {
  balls: [-S, -S, S, S, -0.17, 0],
  substrate: [-S, -S, S, S, 0, 0.3],
  c4: [-1.7, -1.7, 1.7, 1.7, 0.24, 0.32],
  interposer: [-I, -I, I, I, 0.32, 0.42],
  ubumps: [-1.7, -1.7, 1.7, 1.7, 0.4, 0.46],
  'hbm-back': [-1.6, -1.65, 1.6, -1.07, 0.46, 0.68],
  dies: [-1.65, -1.02, 1.65, 1.02, 0.46, 0.68],
  'hbm-front': [-1.6, 1.07, 1.6, 1.65, 0.46, 0.68],
  tim: [-1.72, -1.7, 1.72, 1.7, 0.68, 0.71],
  lid: [-2.7, -2.7, 2.7, 2.7, 0.24, 0.9],
};

const PAINT: Record<AssemblyId, (p: Paint, rng: Rng) => void> = {
  balls: (p) => {
    // The ball grid, open in the middle where nine land-side capacitors hang under the core.
    for (const [x, z] of grid(0, 0, 0.6, 0.6, 3, 3)) cap(p, x, z, -0.07, true);
    spheres(
      p,
      grid(0, 0, 5.4, 5.4, 18, 18, (x, z) => Math.abs(x) < 0.55 && Math.abs(z) < 0.55),
      -0.085,
      0.085,
    );
  },
  substrate: (p) => {
    slab(p, -S, -S, S, S, 0, 0.24);
    const o: number[] = [];
    // Build-up layers either side of a thicker core, seamed round the two near faces, with
    // plated vias through the core; the solder mask's keep-out where the lid's foot lands;
    // fiducials, the pin-one mark, and escape traces running out to the capacitor rows.
    for (const y of [0.03, 0.06, 0.09, 0.15, 0.18, 0.21]) o.push(-S, y, S, S, y, S, S, y, S, S, y, -S);
    for (let u = -2.7; u <= 2.71; u += 0.12) o.push(u, 0.09, S, u, 0.15, S, S, 0.09, u, S, 0.15, u);
    const top = 0.241;
    rect(o, -2.7, -2.7, 2.7, 2.7, top);
    rect(o, -2.52, -2.52, 2.52, 2.52, top);
    ring(o, 2.62, -2.62, 0.05, top);
    ring(o, -2.62, 2.62, 0.05, top);
    o.push(-2.45, top, -2.2, -2.2, top, -2.45);
    for (let u = -1.6; u <= 1.61; u += 0.2)
      o.push(u, top, 1.8, u, top, 2.05, u, top, -1.8, u, top, -2.05, 1.8, top, u, 2.05, top, u);
    fine(p, o, 0.2);
    for (let u = -1.6; u <= 1.61; u += 0.2) {
      cap(p, u, -2.15, top, true);
      cap(p, -2.15, u, top, false);
    }
    for (let u = -1.6; u <= 1.61; u += 0.2) {
      cap(p, 2.15, u, top, false);
      cap(p, u, 2.15, top, true);
    }
  },
  c4: (p) => spheres(p, grid(0, 0, 3.3, 3.3, 22, 22), 0.28, 0.038),
  interposer: (p) => {
    slab(p, -I, -I, I, I, 0.32, 0.42);
    const [o, y] = [[] as number[], 0.421];
    o.push(-I, 0.39, I, I, 0.39, I, I, 0.39, I, I, 0.39, -I);
    rect(o, -1.69, -1.69, 1.69, 1.69, y);
    // Probe pads along every edge, alignment crosses in the corners, the faint footprints
    // where the dies and stacks land, wire bundles from each die's PHY to its stacks, the
    // die-to-die link across the middle, and through-silicon vias wherever nothing sits.
    for (let u = -1.6; u <= 1.61; u += 0.05)
      o.push(u, y, -1.66, u, y, -1.6, u, y, 1.66, u, y, 1.6, -1.66, y, u, -1.6, y, u, 1.66, y, u, 1.6, y, u);
    for (const [x, z] of grid(0, 0, 3.1, 3.1, 2, 2))
      o.push(x - 0.06, y, z, x + 0.06, y, z, x, y, z - 0.06, x, y, z + 0.06);
    for (const [x0, x1] of DIES) rect(o, x0, -1, x1, 1, y);
    for (const x of HBM_X)
      for (const s of [-1, 1]) {
        rect(o, x - HBM.hw, s * HBM.z - HBM.hd, x + HBM.hw, s * HBM.z + HBM.hd, y);
        for (let k = 0; k < 14; k++) {
          const u = x - HBM.hw + 0.05 + k * 0.047;
          o.push(u, y, s * 0.86, u, y, s * (HBM.z - 0.1));
        }
      }
    for (let z = -0.8; z <= 0.81; z += 0.06) o.push(-0.24, y, z, 0.24, y, z);
    fine(p, o, 0.2);
    const busy = (x: number, z: number): boolean => Math.abs(z) < 1.7 && Math.abs(x) < 1.65;
    const tsv = grid(0, 0, 3.4, 3.4, 40, 40, busy);
    specks(p, tsv, y);
  },
  ubumps: (p) => {
    // Underfill round each die and stack, flaring out as a fillet, over its microbumps.
    const o: number[] = [];
    const feet = [
      ...DIES.map(([x0, x1]) => [x0, -1, x1, 1] as const),
      ...HBM_X.flatMap((x) =>
        [-1, 1].map((s) => [x - HBM.hw, s * HBM.z - HBM.hd, x + HBM.hw, s * HBM.z + HBM.hd] as const),
      ),
    ];
    for (const [x0, z0, x1, z1] of feet) {
      rect(o, x0, z0, x1, z1, 0.46);
      rect(o, x0 - 0.05, z0 - 0.05, x1 + 0.05, z1 + 0.05, 0.42);
      o.push(x1, 0.46, z1, x1 + 0.05, 0.42, z1 + 0.05, x0, 0.46, z1, x0 - 0.05, 0.42, z1 + 0.05);
      o.push(x1, 0.46, z0, x1 + 0.05, 0.42, z0 - 0.05);
      specks(
        p,
        grid(
          (x0 + x1) / 2,
          (z0 + z1) / 2,
          x1 - x0 - 0.08,
          z1 - z0 - 0.08,
          Math.round((x1 - x0) * 14),
          Math.round((z1 - z0) * 14),
        ),
        0.44,
      );
    }
    fine(p, o, 0.3);
  },
  'hbm-back': (p) => HBM_X.forEach((x) => stack(p, x, -HBM.z)),
  dies: (p) => DIES.forEach(([x0, x1], i) => die(p, x0, x1, i === 0 ? 1 : -1)),
  'hbm-front': (p) => HBM_X.forEach((x) => stack(p, x, HBM.z)),
  tim: (p) => {
    slab(p, -1.72, -1.7, 1.72, 1.7, 0.68, 0.71);
    const o: number[] = [];
    rect(o, -1.62, -1.6, 1.62, 1.6, 0.711);
    for (let u = -3; u <= 3.01; u += 0.12) {
      const [a, b] = [Math.max(-1.6, u - 1.6), Math.min(1.6, u + 1.6)];
      if (b > a) o.push(a, 0.711, a - u, b, 0.711, b - u);
    }
    fine(p, o, 0.14);
  },
  lid: (p, rng) => {
    // A nickel-plated copper lid: a foot bonded to the substrate, a body, and a raised plateau
    // where the heatsink sits, with its chamfer, pin-one notch, fiducials, a mark plate and a
    // data matrix (dots, not words).
    slab(p, -2.7, -2.7, 2.7, 2.7, 0.24, 0.3);
    slab(p, -2.6, -2.6, 2.6, 2.6, 0.3, 0.84);
    slab(p, -2.4, -2.4, 2.4, 2.4, 0.84, 0.9);
    const [o, y] = [[] as number[], 0.901];
    rect(o, -2.3, -2.3, 2.3, 2.3, y);
    o.push(-2.3, y, -1.95, -1.95, y, -2.3);
    ring(o, 2.05, 2.05, 0.1, y);
    ring(o, 2.05, 2.05, 0.04, y);
    ring(o, -2.05, -2.05, 0.1, y);
    rect(o, -1.3, 0.9, 0.9, 1.7, y);
    for (const [a, b, z] of [
      [-1.15, 0.1, 1.1],
      [-1.15, 0.6, 1.3],
      [-1.15, -0.2, 1.5],
    ] as const)
      o.push(a, y, z, b, y, z);
    o.push(-2.6, 0.57, 2.6, 2.6, 0.57, 2.6, 2.6, 0.57, 2.6, 2.6, 0.57, -2.6);
    fine(p, o, 0.26);
    p.ctx.fillStyle = p.lit ? ink.signal(0.7) : ink.line(0.3);
    for (let i = 0; i < 10; i++)
      for (let j = 0; j < 10; j++)
        if (i === 0 || j === 9 || rng() < 0.45) {
          const [sx, sy] = pt(p, 1.2 + i * 0.05, y, 0.95 + j * 0.05);
          p.ctx.fillRect(sx - 0.8, sy - 0.8, 1.6, 1.6);
        }
  },
};

export function paint(id: AssemblyId, p: Paint, rng: Rng): void {
  PAINT[id](p, rng);
}
