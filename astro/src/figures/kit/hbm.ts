import { BASE, DEPTH, HALF, TSV_X, VIAS, die, type Lit } from './hbm-die';
import { fine, grid, rect, slab, spheres, type Paint } from './iso2d';
import type { Camera } from './camera';

/** One HBM stack, cut open along its via band, for `hbm-stack`: a slice of the silicon
 *  interposer with its wiring and deep-trench capacitors, the bumps that join the base die to
 *  it, the base (logic) die, seven core DRAM dies and a thick top die, each joined to the one
 *  below by a layer of microbumps, all held in a mould. Heights are drawn about twenty times
 *  true so the section reads; one unit is about 5 mm across. */

export const HBM_PARTS = ['mould', 'top', 'dram', 'tsv', 'ubumps', 'base', 'bumps', 'interposer', 'caps'] as const;
export type HbmPart = (typeof HBM_PARTS)[number];

export interface Assembly {
  id: string;
  /** The part a pointer at this height picks, and every part painted in it. */
  pick: HbmPart | undefined;
  parts: readonly HbmPart[];
  /** x0, z0, x1, z1, y0, y1 assembled. */
  box: readonly [number, number, number, number, number, number];
  lift: number;
  paint: (at: Lit) => void;
}

const GAP = 0.12;
const IX = [-1.35, 1.9] as const;
const IZ = -1.35;
const PERIOD = 0.14;
const BUMP = 0.04;

/** A bump cut in half on the section face: its copper pillar hanging from the die above, and
 *  the line where the solder cap meets the pad below. */
function pillar(o: number[], x: number, hw: number, top: number, cap: number): void {
  o.push(x - hw, top, 0, x - hw, cap, 0, x + hw, top, 0, x + hw, cap, 0, x - hw, cap, 0, x + hw, cap, 0);
}

/** Microbumps between two dies: a copper pillar and solder cap under every via, dummy bumps
 *  across the arrays to carry heat, the bonding film's edge, and the cut row in section. */
function microbumps(at: Lit, y0: number): void {
  const p = at('ubumps');
  const dummy = grid(0, -0.58, 1.8, 0.7, 12, 4);
  spheres(
    p,
    [...VIAS, ...dummy].sort((a, b) => a[0] + a[1] - (b[0] + b[1])),
    y0 + BUMP / 2,
    0.013,
  );
  const o: number[] = [];
  rect(o, -HALF, -DEPTH, HALF, 0, y0 + BUMP);
  for (const x of TSV_X) {
    pillar(o, x, 0.008, y0 + BUMP, y0 + 0.016);
    o.push(x - 0.011, y0, 0, x + 0.011, y0, 0);
  }
  fine(p, o, 0.3);
}

/** The base die's bumps on the interposer: power and ground across the die, a dense field
 *  under the PHY, the underfill flaring out round the edge, and the cut row in section. */
function bumps(at: Lit): void {
  const p = at('bumps');
  const field = grid(-0.1, -0.56, 1.7, 0.95, 14, 8);
  const phy = grid(0.9, -0.6, 0.2, 0.76, 4, 14);
  spheres(
    p,
    [...field, ...phy].sort((a, b) => a[0] + a[1] - (b[0] + b[1])),
    0.225,
    0.02,
  );
  const o: number[] = [];
  rect(o, -BASE, -BASE, BASE, 0, 0.25);
  rect(o, -BASE - 0.06, -BASE - 0.06, BASE + 0.06, 0, 0.2);
  o.push(BASE, 0.25, 0, BASE + 0.06, 0.2, 0, -BASE, 0.25, 0, -BASE - 0.06, 0.2, 0);
  o.push(BASE, 0.25, -BASE, BASE + 0.06, 0.2, -BASE - 0.06);
  for (let x = -0.9; x < 1.0; x += 0.12) pillar(o, x, 0.014, 0.25, 0.215);
  fine(p, o, 0.3);
}

/** The interposer slice: its section shows the wiring layers on top, the deep-trench
 *  capacitors etched just under them, and wide vias through to the C4 side; on top, one wire
 *  per lane runs from under the PHY to the pads where the compute die's PHY lands. */
function interposer(at: Lit): void {
  const p = at('interposer');
  slab(p, IX[0], IZ, IX[1], 0, 0, 0.2);
  const [o, y] = [[] as number[], 0.201];
  for (const ry of [0.172, 0.181, 0.19]) o.push(IX[0], ry, 0, IX[1], ry, 0);
  for (const x of [-1.15, -0.45, 0.25, 1.05, 1.6])
    o.push(x - 0.02, 0, 0, x - 0.02, 0.17, 0, x + 0.02, 0, 0, x + 0.02, 0.17, 0);
  rect(o, -BASE, -BASE, BASE, 0, y);
  for (let z = -0.97; z < -0.22; z += 0.05) {
    o.push(0.9, y, z, 1.66, y, z);
    rect(o, 1.66, z - 0.012, 1.72, z + 0.012, y);
  }
  rect(o, 1.62, -1.05, 1.78, -0.15, y);
  fine(p, o, 0.24);
  // The capacitors: clusters of narrow trenches lined with an insulator, under the stack's
  // power bumps, and their footprints on top.
  const c = at('caps');
  const t: number[] = [];
  for (const x0 of [-0.95, -0.25, 0.45]) for (let x = x0; x < x0 + 0.3; x += 0.016) t.push(x, 0.165, 0, x, 0.105, 0);
  for (const x0 of [-0.95, -0.25, 0.45]) rect(t, x0 - 0.02, -0.9, x0 + 0.32, -0.25, y);
  fine(c, t, 0.34);
}

/** The mould: the walls round the dies, ground flush with the top die. The back and left
 *  walls sit behind the dies; the right one in front. In section, a hatch for its filler. */
function mould(at: Lit, walls: readonly (readonly number[])[]): void {
  const p = at('mould');
  const o: number[] = [];
  for (const [x0 = 0, z0 = 0, x1 = 0, z1 = 0] of walls) {
    slab(p, x0, z0, x1, z1, 0.39, 1.61);
    if (z1 === 0) for (let y = 0.42; y < 1.56; y += 0.06) o.push(x0 + 0.015, y, 0, x1 - 0.015, y + 0.04, 0);
  }
  fine(p, o, 0.14);
}

/** The ghost of the mould once the dies have lifted out of it: its outline only. */
export function ghost(p: Paint): void {
  const o: number[] = [];
  for (const y of [0.39, 1.61]) {
    rect(o, -BASE, -BASE, BASE, 0, y);
    rect(o, -HALF, -DEPTH, HALF, 0, y);
  }
  o.push(BASE, 0.39, 0, BASE, 1.61, 0, -BASE, 0.39, 0, -BASE, 1.61, 0);
  fine(p, o, 0.5);
}

const BACK = [
  [-BASE, -BASE, BASE, -DEPTH],
  [-BASE, -DEPTH, -HALF, 0],
] as const;
const FRONT = [[HALF, -DEPTH, BASE, 0]] as const;

function build(): Assembly[] {
  const box = (y0: number, y1: number, s = BASE) => [-s, -s, s, 0, y0, y1] as const;
  const out: Assembly[] = [
    {
      id: 'interposer',
      pick: 'interposer',
      parts: ['interposer', 'caps'],
      box: [IX[0], IZ, IX[1], 0, 0, 0.2],
      lift: 0,
      paint: interposer,
    },
    { id: 'bumps', pick: 'bumps', parts: ['bumps'], box: box(0.2, 0.25, BASE + 0.06), lift: GAP, paint: bumps },
    {
      id: 'mould-back',
      pick: undefined,
      parts: ['mould'],
      box: box(0.39, 1.61),
      lift: 0,
      paint: (at) => mould(at, BACK),
    },
    {
      id: 'base',
      pick: 'base',
      parts: ['base', 'tsv'],
      box: box(0.25, 0.39),
      lift: 2 * GAP,
      paint: (at) => die(at, 'base', 0.25, 0.39),
    },
  ];
  for (let k = 0; k < 8; k++) {
    const y0 = 0.39 + k * PERIOD;
    const y1 = k === 7 ? 1.61 : y0 + PERIOD;
    out.push({
      id: `ubumps-${k}`,
      pick: 'ubumps',
      parts: ['ubumps'],
      box: box(y0, y0 + BUMP, HALF),
      lift: (3 + 2 * k) * GAP,
      paint: (at) => microbumps(at, y0),
    });
    const kind = k === 7 ? 'top' : 'core';
    out.push({
      id: `die-${k}`,
      pick: k === 7 ? 'top' : 'dram',
      parts: k === 7 ? ['top'] : ['dram', 'tsv'],
      box: box(y0 + BUMP, y1, HALF),
      lift: (4 + 2 * k) * GAP,
      paint: (at) => die(at, kind, y0 + BUMP, y1),
    });
  }
  out.push({
    id: 'mould-front',
    pick: undefined,
    parts: ['mould'],
    box: box(0.39, 1.61),
    lift: 0,
    paint: (at) => mould(at, FRONT),
  });
  return out;
}

/** Every assembly, bottom up: the order they are painted in. */
export const ASSEMBLIES: readonly Assembly[] = build();

/** Paint one assembly raised by `lift`, with `lit` (if any) in the signal. */
export function paint(a: Assembly, ctx: Paint['ctx'], cam: Camera, lit: string, lift: number, ghosted = false): void {
  const at: Lit = (part) => ({ ctx, cam, lit: part === lit, lift });
  if (ghosted) ghost(at('mould'));
  else a.paint(at);
}
