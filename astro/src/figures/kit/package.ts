import type { BufferGeometry, Group, LineBasicMaterial, MeshBasicMaterial } from 'three';
import { circle, fine, joints, lattice, rect, slab } from './layers';

/** The parts of a 2.5D chip package for Chip package anatomy, each built in its own frame
 *  (ground at y = 0) into a group the figure lifts: solids filled with the ground under
 *  their edges, fine detail (floorplans, wiring, pad rows, layer seams, through-silicon vias)
 *  in a second, fainter line set, and joints (bumps, balls) as instanced spheres. The compute
 *  die sits in the middle of the interposer with two memory stacks on either side, as on an
 *  AI accelerator. Sizes are in one unit ≈ 10 mm. */

export const PART_IDS = [
  'lid',
  'tim',
  'die',
  'hbm',
  'underfill',
  'ubumps',
  'interposer',
  'c4',
  'caps',
  'substrate',
  'balls',
] as const;
export type PartId = (typeof PART_IDS)[number];

export interface Mats {
  edge: LineBasicMaterial;
  fine: LineBasicMaterial;
  fill: MeshBasicMaterial;
  /** The joints' material; set only for parts made of joints. */
  dots: MeshBasicMaterial | null;
  ball: BufferGeometry;
}

/** The compute die's half size, and the memory stacks' centres and half sizes: shared by
 *  every layer that lines up under them. */
const DIE = 0.6;
const HBM = { hw: 0.26, hd: 0.34, at: [-0.97, 0.97].flatMap((x) => [-0.43, 0.43].map((z) => [x, z] as const)) };

/** Where each part's marker sits on its top face (x, z), out toward the viewer's right so
 *  the leaders run out to the labels without crossing the stack. */
export const ANCHOR: Record<PartId, readonly [number, number]> = {
  lid: [1.3, 1.1],
  tim: [1.15, 0.7],
  die: [0.42, 0.3],
  hbm: [1.12, 0.62],
  underfill: [0.66, -0.3],
  ubumps: [0.35, 0.62],
  interposer: [1.22, 0.78],
  c4: [1.05, 0.76],
  caps: [1.45, 1.25],
  substrate: [1.6, 1.5],
  balls: [1.18, 1.53],
};

const under = (pad: number): [number, number, number, number][] => [
  [-DIE - pad, -DIE - pad, DIE + pad, DIE + pad],
  ...HBM.at.map(([x, z]): [number, number, number, number] => [
    x - HBM.hw - pad,
    z - HBM.hd - pad,
    x + HBM.hw + pad,
    z + HBM.hd + pad,
  ]),
];

/** Short pads along every edge of a rectangle, pointing in: the bond and probe pads round a
 *  die or an interposer. */
function padRows(o: number[], x0: number, z0: number, x1: number, z1: number, y: number, every: number, len: number) {
  for (let x = x0 + every; x < x1 - every / 2; x += every) o.push(x, y, z0, x, y, z0 + len, x, y, z1, x, y, z1 - len);
  for (let z = z0 + every; z < z1 - every / 2; z += every) o.push(x0, y, z, x0 + len, y, z, x1, y, z, x1 - len, y, z);
}

/** Build part `id` into g; returns its height. `skirt` is how far the lid's skirt reaches
 *  down to the substrate. */
export function build(id: PartId, g: Group, m: Mats, skirt: number): number {
  const o: number[] = [];
  let h = 0;
  if (id === 'balls') {
    // A ball grid with its centre left open for the land-side capacitors.
    joints(
      g,
      m,
      lattice(0, 0, 3.3, 3.3, 14, 14, (u, v) => Math.abs(u) < 0.16 && Math.abs(v) < 0.16),
      0.07,
    );
    for (let i = 0; i < 6; i++)
      slab(g, m, 0.14, 0.06, 0.08, -0.25 + (i % 3) * 0.25, 0, -0.12 + Math.floor(i / 3) * 0.24);
    h = 0.14;
  } else if (id === 'substrate') {
    h = 0.16;
    slab(g, m, 3.6, h, 3.6);
    // Build-up layers seamed round the edge, a thicker core between them, plated vias
    // through the core on the front face, the solder mask's keep-out where the lid lands,
    // two fiducials, and fan-out from the bump field to the rim.
    for (const y of [0.025, 0.05, 0.065, 0.095, 0.11, 0.135]) rect(o, -1.801, -1.801, 1.801, 1.801, y);
    for (let x = -1.7; x <= 1.71; x += 0.1) o.push(x, 0.065, 1.802, x, 0.095, 1.802);
    for (let z = -1.7; z <= 1.71; z += 0.1) o.push(1.802, 0.065, z, 1.802, 0.095, z);
    rect(o, -1.68, -1.68, 1.68, 1.68, h + 0.001);
    rect(o, -1.52, -1.52, 1.52, 1.52, h + 0.001);
    circle(o, 1.6, -1.6, 0.04, h + 0.001);
    circle(o, -1.6, 1.6, 0.04, h + 0.001);
    for (let k = 0; k < 48; k++) {
      const a = (k / 48) * Math.PI * 2;
      const [c, s] = [Math.cos(a), Math.sin(a)];
      const f = Math.min(1.3 / Math.max(1e-3, Math.abs(c)), 0.9 / Math.max(1e-3, Math.abs(s)));
      const e = Math.min(1.45 / Math.max(1e-3, Math.abs(c)), 1.45 / Math.max(1e-3, Math.abs(s)));
      o.push(c * f, h + 0.001, s * f, c * e, h + 0.001, s * e);
    }
  } else if (id === 'caps') {
    // Decoupling capacitors in rows round the bump field, close to where power enters,
    // each with its two metal end caps.
    h = 0.06;
    const cap = (x: number, z: number, along: boolean): void => {
      const [w, d] = along ? [0.1, 0.06] : [0.06, 0.1];
      slab(g, m, w, h, d, x, 0, z);
      const e = 0.025;
      if (along)
        for (const s of [-1, 1])
          o.push(x + s * (0.05 - e), h + 0.001, z - 0.03, x + s * (0.05 - e), h + 0.001, z + 0.03);
      else
        for (const s of [-1, 1])
          o.push(x - 0.03, h + 0.001, z + s * (0.05 - e), x + 0.03, h + 0.001, z + s * (0.05 - e));
    };
    for (let x = -1.35; x <= 1.36; x += 0.18) for (const z of [-1.3, 1.3]) cap(x, z, true);
    for (let z = -1.0; z <= 1.01; z += 0.2) for (const x of [-1.5, 1.5]) cap(x, z, false);
  } else if (id === 'c4') {
    joints(g, m, lattice(0, 0, 2.5, 1.7, 16, 11), 0.045);
    h = 0.09;
  } else if (id === 'interposer') {
    h = 0.07;
    slab(g, m, 2.7, h, 1.9);
    const y = h + 0.001;
    // Seal ring and the probe pads along every edge; a bundle of wires from the die's PHY to
    // each stack's; a field of through-silicon vias where nothing sits above.
    rect(o, -1.31, -0.91, 1.31, 0.91, y);
    padRows(o, -1.31, -0.91, 1.31, 0.91, y, 0.045, 0.05);
    for (const [x, z] of HBM.at) {
      const s = Math.sign(x);
      for (let i = 0; i < 12; i++) {
        const zz = z - 0.24 + i * 0.044;
        o.push(s * (DIE - 0.1), y, zz, s * (Math.abs(x) - HBM.hw + 0.08), y, zz);
      }
    }
    const busy = (u: number, v: number): boolean =>
      under(0.05).some(([a, b, c, d]) => u * 2.5 > a && u * 2.5 < c && v * 1.7 > b && v * 1.7 < d);
    for (const [x, z] of lattice(0, 0, 2.5, 1.7, 30, 20, busy)) rect(o, x - 0.01, z - 0.01, x + 0.01, z + 0.01, y);
  } else if (id === 'ubumps') {
    joints(
      g,
      m,
      [...lattice(0, 0, 1.1, 1.1, 20, 20), ...HBM.at.flatMap(([x, z]) => lattice(x, z, 0.44, 0.6, 8, 11))],
      0.018,
    );
    h = 0.036;
  } else if (id === 'underfill') {
    // Epoxy round each set of microbumps, fillets flaring out from the die's edge.
    h = 0.036;
    for (const [x0, z0, x1, z1] of under(0)) {
      rect(o, x0, z0, x1, z1, h);
      rect(o, x0 - 0.06, z0 - 0.06, x1 + 0.06, z1 + 0.06, 0);
      for (const [x, z, dx, dz] of [
        [x0, z0, -1, -1],
        [x1, z0, 1, -1],
        [x1, z1, 1, 1],
        [x0, z1, -1, 1],
      ] as const)
        o.push(x, h, z, x + dx * 0.06, 0, z + dz * 0.06);
    }
  } else if (id === 'die') {
    h = 0.14;
    slab(g, m, DIE * 2, h, DIE * 2);
    // Its floorplan on top: seal ring, sixteen cores in two banks either side of a band of
    // shared cache, and PHY lanes down both edges, each facing a pair of memory stacks.
    const [a, y] = [DIE, h + 0.002];
    rect(o, -a + 0.03, -a + 0.03, a - 0.03, a - 0.03, y);
    for (const s of [-1, 1]) {
      rect(o, s * (a - 0.05), -a + 0.07, s * (a - 0.17), a - 0.07, y);
      for (let z = -a + 0.1; z < a - 0.08; z += 0.035) o.push(s * (a - 0.06), y, z, s * (a - 0.16), y, z);
    }
    const [cx0, cw] = [-a + 0.22, 0.19];
    for (let i = 0; i < 4; i++)
      for (const z0 of [-a + 0.07, -a + 0.27, 0.13, 0.33]) {
        const x0 = cx0 + i * cw;
        rect(o, x0, z0, x0 + cw - 0.025, z0 + 0.17, y);
        rect(o, x0 + 0.03, z0 + 0.03, x0 + 0.08, z0 + 0.08, y);
      }
    rect(o, cx0, -0.09, cx0 + 4 * cw - 0.025, 0.09, y);
    for (let x = cx0 + 0.03; x < cx0 + 4 * cw - 0.03; x += 0.03) o.push(x, y, -0.09, x, y, 0.09);
  } else if (id === 'hbm') {
    // Each stack: eight DRAM dies on a slightly larger base die, a thin cap die on top, and
    // through-silicon vias in columns down the middle.
    h = 0.3;
    for (const [x, z] of HBM.at) {
      slab(g, m, HBM.hw * 2 + 0.03, 0.03, HBM.hd * 2 + 0.03, x, 0, z);
      for (let k = 0; k < 8; k++) slab(g, m, HBM.hw * 2, 0.024, HBM.hd * 2, x, 0.03 + k * 0.03, z);
      slab(g, m, HBM.hw * 2, 0.03, HBM.hd * 2, x, 0.27, z);
      rect(o, x - HBM.hw + 0.04, z - HBM.hd + 0.04, x + HBM.hw - 0.04, z + HBM.hd - 0.04, h + 0.001);
      for (const [vx, vz] of lattice(x, z, 0.2, 0.5, 3, 5)) o.push(vx, 0, vz, vx, h, vz);
    }
  } else if (id === 'tim') {
    h = 0.03;
    slab(g, m, 2.6, h, 1.75);
    for (let k = -18; k <= 18; k++) {
      const u = k * 0.07;
      o.push(u - 0.8, h + 0.001, -0.8, u + 0.8, h + 0.001, 0.8);
    }
  } else {
    // The lid: a plate with its chamfer, pin-one corner and mark, on a skirt bonded to the
    // substrate by a bead of adhesive.
    h = 0.1;
    slab(g, m, 3.2, h, 3.2);
    for (const [w, d, x, z] of [
      [3.2, 0.1, 0, 1.55],
      [3.2, 0.1, 0, -1.55],
      [0.1, 3.2, 1.55, 0],
      [0.1, 3.2, -1.55, 0],
    ] as const)
      slab(g, m, w, skirt, d, x, -skirt, z);
    const y = h + 0.002;
    rect(o, -1.5, -1.5, 1.5, 1.5, y);
    rect(o, -1.42, -1.42, 1.42, 1.42, y);
    o.push(-1.42, y, -1.18, -1.18, y, -1.42);
    rect(o, -1.0, 0.6, 0.2, 1.1, y);
    for (const x of [-0.9, -0.6, -0.3]) o.push(x, y, 0.75, x + 0.2, y, 0.75);
    o.push(-0.9, y, 0.95, -0.2, y, 0.95);
    circle(o, 1.2, 1.2, 0.08, y);
    circle(o, 1.2, 1.2, 0.03, y);
    circle(o, -1.2, -1.2, 0.08, y);
    rect(o, -1.62, -1.62, 1.62, 1.62, -skirt);
  }
  if (o.length) fine(g, m, o);
  return h;
}
