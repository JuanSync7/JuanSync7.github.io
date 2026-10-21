import type { BufferGeometry, Group, LineBasicMaterial, MeshBasicMaterial } from 'three';
import { circle, fine, frame, joints, lattice, posts, rect, slab } from './layers';
import { socDie } from './package-die';
import { dramDies, memCap, memSubstrate, popBalls, wireBonds } from './package-memory';
import { DIE, INNER, PKG, TIV } from './package-plan';

/** The parts of a phone processor's package for Chip package anatomy, TSMC InFO-PoP as in
 *  Apple's A-series (plan in `kit/package-plan.ts`): a memory package (epoxy cap, stacked
 *  DRAM dies, wire bonds, coreless substrate) on a ring of balls, on the processor's own
 *  package: a mould round the die with copper vias through it, the die, fan-out wiring built
 *  straight onto both in place of a substrate, silicon capacitors under it, and a ball grid.
 *  Each part is built in its own frame (ground at y = 0) into a group the figure lifts: solids
 *  filled with the ground under their edges, fine detail in a fainter line set, and joints
 *  (balls) as instanced spheres. */

export const PART_IDS = [
  'mcap',
  'dram',
  'wires',
  'msub',
  'pop',
  'mould',
  'die',
  'tivs',
  'rdl',
  'ipd',
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

/** Parts drawn as joints (instanced balls). */
export const JOINTS: readonly PartId[] = ['pop', 'balls'];

/** What each part stands on when assembled ('ground' is the board). */
export const ON: Record<PartId, PartId | 'ground'> = {
  balls: 'ground',
  ipd: 'ground',
  rdl: 'balls',
  tivs: 'rdl',
  die: 'rdl',
  mould: 'rdl',
  pop: 'mould',
  msub: 'pop',
  dram: 'msub',
  wires: 'msub',
  mcap: 'msub',
};
/** How far up each part moves when the package opens, in steps. Parts that are one piece in
 *  life move together: the vias stay standing on the wiring they are plated on, and the dies,
 *  wires and substrate of the memory never part, so no wire is left ending in the air. */
export const LEVEL: Record<PartId, number> = {
  balls: 0,
  ipd: 0,
  rdl: 1,
  tivs: 1,
  die: 2,
  mould: 3,
  pop: 4,
  msub: 5,
  dram: 5,
  wires: 5,
  mcap: 6,
};

/** Where each part's marker sits on its top face (x, z): toward the viewer's right, and
 *  chosen so the markers fall down the screen in the order of the list, so no two leaders
 *  cross on their way out to their names. */
export const ANCHOR: Record<PartId, readonly [number, number]> = {
  mcap: [1.3, 0.4],
  dram: [0.9, -0.2],
  wires: [1.1, 1.2],
  msub: [1.45, 1.37],
  pop: [1.43, 0.4],
  mould: [1.45, 1.0],
  die: [0.9, 0.5],
  tivs: [1.31, -0.6],
  rdl: [1.5, -0.7],
  ipd: [0.2, 0.1],
  balls: [1.4, 1.3],
};

/** The fan-out wiring: three copper layers in polymer, built onto the die and mould. On top,
 *  the die's pad field, a landing pad for every via, and a trace from the die's edge out to
 *  each via of the inner row: the memory bus, on its way up. */
function rdl(g: Group, m: Mats): number {
  const h = 0.06;
  slab(g, m, PKG.a * 2, h, PKG.b * 2);
  const [o, y, { a, b }] = [[] as number[], h + 0.001, PKG];
  for (const s of [0.02, 0.04]) o.push(-a, s, b, a, s, b, a, s, b, a, s, -b);
  rect(o, -a + 0.04, -b + 0.04, a - 0.04, b - 0.04, y);
  for (const [x, z] of lattice(0, 0, DIE.a * 2 - 0.08, DIE.b * 2 - 0.08, 30, 27))
    rect(o, x - 0.009, z - 0.009, x + 0.009, z + 0.009, y);
  for (const [x, z] of TIV) circle(o, x, z, 0.036, y, 10);
  for (const [x, z] of INNER) {
    const [ex, ez] = [Math.max(-DIE.a, Math.min(DIE.a, x)), Math.max(-DIE.b, Math.min(DIE.b, z))];
    const [dx, dz] = [x - ex, z - ez];
    const d = Math.hypot(dx, dz) || 1;
    o.push(ex, y, ez, x - (dx / d) * 0.036, y, z - (dz / d) * 0.036);
  }
  fine(g, m, o);
  return h;
}

/** Silicon capacitors flip-chip bonded under the package, in the gap the ball grid leaves
 *  under the die, each on its own little field of bumps. */
function ipd(g: Group, m: Mats): number {
  const h = 0.05;
  const o: number[] = [];
  for (const [x, z] of lattice(0, 0, 0.42, 0.38, 2, 2)) {
    slab(g, m, 0.3, h, 0.22, x, 0, z);
    for (const [bx, bz] of lattice(x, z, 0.22, 0.14, 4, 3)) circle(o, bx, bz, 0.012, h + 0.001, 8);
  }
  fine(g, m, o);
  return h;
}

/** Build part `id` into g; returns its height. */
export function build(id: PartId, g: Group, m: Mats): number {
  switch (id) {
    case 'balls':
      // About thirteen hundred balls at 0.4 mm in life; the centre is left open for the capacitors.
      joints(
        g,
        m,
        lattice(0, 0, PKG.a * 2 - 0.1, PKG.b * 2 - 0.1, 33, 31, (u, v) => Math.abs(u) < 0.16 && Math.abs(v) < 0.16),
        0.033,
      );
      return 0.066;
    case 'ipd':
      return ipd(g, m);
    case 'rdl':
      return rdl(g, m);
    case 'tivs':
      posts(g, m, TIV, 0.024, DIE.h);
      return DIE.h;
    case 'die':
      return socDie(g, m);
    case 'mould': {
      frame(g, m, PKG.a, PKG.b, DIE.a, DIE.b, DIE.h);
      // Ground flat after moulding, so the tops of the vias show through it.
      const o: number[] = [];
      for (const [x, z] of TIV) circle(o, x, z, 0.024, DIE.h + 0.002, 10);
      fine(g, m, o);
      return DIE.h;
    }
    case 'pop':
      return popBalls(g, m);
    case 'msub':
      return memSubstrate(g, m);
    case 'dram':
      return dramDies(g, m);
    case 'wires':
      return wireBonds(g, m);
    case 'mcap':
      return memCap(g, m);
  }
}
