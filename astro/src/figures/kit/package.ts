import type { BufferGeometry, Group, LineBasicMaterial, MeshBasicMaterial } from 'three';
import { circle, fine, joints, lattice, rect, slab } from './layers';

/** The parts of a 2.5D chip package for Chip package anatomy, each built in its own frame
 *  (ground at y = 0) into a group the figure lifts: solids filled with the ground under
 *  their edges, fine detail (floorplans, wiring, layer seams, through-silicon vias) in a
 *  second, fainter line set, and joints (bumps, balls) as instanced spheres. Sizes are in
 *  one unit ≈ 10 mm. */

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

/** The compute die's footprint (x centre, half width), and the memory stacks' (x, z
 *  centres, half sizes): shared by every layer that lines up under them. */
const DIE = { x: -0.45, s: 0.65 };
const HBM = { x: 0.75, z: [-0.45, 0.45], hw: 0.275, hd: 0.35 };

const under = (pad: number): [number, number, number, number][] => [
  [DIE.x - DIE.s - pad, -DIE.s - pad, DIE.x + DIE.s + pad, DIE.s + pad],
  ...HBM.z.map((z): [number, number, number, number] => [
    HBM.x - HBM.hw - pad,
    z - HBM.hd - pad,
    HBM.x + HBM.hw + pad,
    z + HBM.hd + pad,
  ]),
];

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
    // through the core on the front face, and fan-out from the bump field to the rim.
    for (const y of [0.025, 0.05, 0.065, 0.095, 0.11, 0.135]) rect(o, -1.801, -1.801, 1.801, 1.801, y);
    for (let x = -1.7; x <= 1.71; x += 0.1) o.push(x, 0.065, 1.802, x, 0.095, 1.802);
    for (let k = 0; k < 40; k++) {
      const a = (k / 40) * Math.PI * 2;
      const [c, s] = [Math.cos(a), Math.sin(a)];
      const f = Math.min(1.15 / Math.max(1e-3, Math.abs(c)), 0.85 / Math.max(1e-3, Math.abs(s)));
      const e = Math.min(1.7 / Math.max(1e-3, Math.abs(c)), 1.7 / Math.max(1e-3, Math.abs(s)));
      o.push(c * f, h + 0.001, s * f, c * e, h + 0.001, s * e);
    }
  } else if (id === 'caps') {
    // Decoupling capacitors in rows round the bump field, close to where power enters.
    h = 0.06;
    for (let x = -1.45; x <= 1.46; x += 0.18) for (const z of [-1.25, 1.25]) slab(g, m, 0.1, h, 0.06, x, 0, z);
    for (let z = -0.95; z <= 0.96; z += 0.19) for (const x of [-1.45, 1.45]) slab(g, m, 0.06, h, 0.1, x, 0, z);
  } else if (id === 'c4') {
    joints(g, m, lattice(0, 0, 2.3, 1.7, 14, 10), 0.045);
    h = 0.09;
  } else if (id === 'interposer') {
    h = 0.07;
    slab(g, m, 2.5, h, 1.9);
    // Wiring: a bundle from the die's edge to each memory stack, and a field of through-
    // silicon vias where nothing sits above.
    for (const z of HBM.z)
      for (let i = 0; i < 14; i++)
        o.push(
          DIE.x + DIE.s - 0.05,
          h + 0.001,
          z - 0.26 + i * 0.04,
          HBM.x - HBM.hw + 0.05,
          h + 0.001,
          z - 0.26 + i * 0.04,
        );
    const free = (u: number, v: number): boolean =>
      under(0.04).some(([a, b, c, d]) => u * 2.3 > a && u * 2.3 < c && v * 1.7 > b && v * 1.7 < d);
    for (const [x, z] of lattice(0, 0, 2.3, 1.7, 24, 18, free))
      rect(o, x - 0.012, z - 0.012, x + 0.012, z + 0.012, h + 0.001);
  } else if (id === 'ubumps') {
    joints(
      g,
      m,
      [...lattice(DIE.x, 0, 1.2, 1.2, 20, 20), ...HBM.z.flatMap((z) => lattice(HBM.x, z, 0.5, 0.6, 9, 11))],
      0.018,
    );
    h = 0.036;
  } else if (id === 'underfill') {
    // Epoxy round each set of microbumps, fillets flaring out from the die's edge.
    h = 0.036;
    for (const [x0, z0, x1, z1] of under(0)) {
      rect(o, x0, z0, x1, z1, h);
      rect(o, x0 - 0.07, z0 - 0.07, x1 + 0.07, z1 + 0.07, 0);
      for (const [x, z, dx, dz] of [
        [x0, z0, -1, -1],
        [x1, z0, 1, -1],
        [x1, z1, 1, 1],
        [x0, z1, -1, 1],
      ] as const)
        o.push(x, h, z, x + dx * 0.07, 0, z + dz * 0.07);
    }
  } else if (id === 'die') {
    h = 0.14;
    slab(g, m, DIE.s * 2, h, DIE.s * 2, DIE.x);
    // Its floorplan on top: seal ring, eight cores, a band of cache, and the PHY lanes
    // along the edge that faces the memory.
    const [x0, z0, y] = [DIE.x - DIE.s, -DIE.s, h + 0.002];
    rect(o, x0 + 0.04, z0 + 0.04, x0 + 1.26, z0 + 1.26, y);
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 2; j++)
        rect(o, x0 + 0.08 + i * 0.24, z0 + 0.08 + j * 0.42, x0 + 0.29 + i * 0.24, z0 + 0.46 + j * 0.42, y);
    rect(o, x0 + 0.08, z0 + 0.94, x0 + 1.03, z0 + 1.2, y);
    for (let x = x0 + 0.12; x < x0 + 1.02; x += 0.04) o.push(x, y, z0 + 0.94, x, y, z0 + 1.2);
    for (let z = z0 + 0.1; z < z0 + 1.2; z += 0.035) o.push(x0 + 1.08, y, z, x0 + 1.22, y, z);
  } else if (id === 'hbm') {
    // Each stack: eight DRAM dies on a slightly larger base die, through-silicon vias in
    // columns down the middle.
    h = 0.27;
    for (const z of HBM.z) {
      slab(g, m, HBM.hw * 2 + 0.03, 0.03, HBM.hd * 2 + 0.03, HBM.x, 0, z);
      for (let k = 0; k < 8; k++) slab(g, m, HBM.hw * 2, 0.024, HBM.hd * 2, HBM.x, 0.03 + k * 0.03, z);
      for (const [x, zz] of lattice(HBM.x, z, 0.2, 0.5, 3, 5)) o.push(x, 0, zz, x, h, zz);
    }
  } else if (id === 'tim') {
    h = 0.03;
    slab(g, m, 2.1, h, 1.6, 0.05);
    for (let k = -14; k <= 14; k++) {
      const u = k * 0.07;
      o.push(0.05 + u - 0.8, h + 0.001, -0.8, 0.05 + u + 0.8, h + 0.001, 0.8);
    }
  } else {
    // The lid: a plate with its chamfer and mark, on a skirt bonded to the substrate by a
    // bead of adhesive.
    h = 0.1;
    slab(g, m, 3.2, h, 3.2);
    for (const [w, d, x, z] of [
      [3.2, 0.1, 0, 1.55],
      [3.2, 0.1, 0, -1.55],
      [0.1, 3.2, 1.55, 0],
      [0.1, 3.2, -1.55, 0],
    ] as const)
      slab(g, m, w, skirt, d, x, -skirt, z);
    rect(o, -1.5, -1.5, 1.5, 1.5, h + 0.002);
    rect(o, -1.0, 0.6, 0.2, 1.1, h + 0.002);
    for (const x of [-0.9, -0.6, -0.3]) o.push(x, h + 0.002, 0.75, x + 0.2, h + 0.002, 0.75);
    circle(o, 1.2, 1.2, 0.08, h + 0.002);
    circle(o, -1.2, -1.2, 0.08, h + 0.002);
    rect(o, -1.62, -1.62, 1.62, 1.62, -skirt);
  }
  if (o.length) fine(g, m, o);
  return h;
}
