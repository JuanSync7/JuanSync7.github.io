import { D, W, bars, front, marks, middle, side, substrate, transistors, type Lit } from './die-front';
import { fine, rect, slab, type Paint } from './iso2d';
import type { Camera } from './camera';

/** One logic die, cut open as a block a few gates wide, for `die-section`: the silicon, the
 *  transistors and their contacts (`kit/die-front.ts`), then the wiring stacked over them,
 *  each level of copper turned a right angle to the one below and joined to it by vias, the
 *  pitch widening as it climbs; a capacitor in the upper levels, the aluminium pad and the
 *  passivation that seals it. Heights are not to scale: the transistors are about a hundred
 *  nanometres tall, the wiring over them some ten micrometres. */

export const DIE_PARTS = [
  'passivation',
  'pad',
  'mim',
  'global',
  'intermediate',
  'local',
  'vias',
  'contacts',
  'transistors',
  'substrate',
] as const;
export type DiePart = (typeof DIE_PARTS)[number];

export interface Assembly {
  id: string;
  /** The part a pointer at this height picks, and every part painted in it. */
  pick: DiePart;
  parts: readonly DiePart[];
  /** y0, y1 assembled; every assembly spans the block's full width and depth. */
  y: readonly [number, number];
  lift: number;
  paint: (at: Lit) => void;
}

/** One level of wiring: lines along x or z at pitch `p`, half as wide as their pitch; vias
 *  `v` tall under them, then the copper `h` tall, then its cap. */
interface Level {
  dir: 'x' | 'z';
  p: number;
  v: number;
  h: number;
}
const CAP = 0.006;
const tall = (l: Level): number => l.v + l.h + CAP;
const height = (ls: Level[]): number => ls.reduce((n, l) => n + tall(l), 0);

/** Track centres: a z line sits on the front cut, an x line on the side cut, so both are halved. */
const tracks = (l: Level): number[] => {
  const [lo, hi] = l.dir === 'z' ? [-W, W] : [-D, 0];
  const out: number[] = [];
  for (let a = hi; a > lo + l.p / 4; a -= l.p) out.push(a);
  return out;
};
/** Where a via lands: a fixed scatter, about two in five crossings. */
const via = (i: number, k: number): boolean => (i * 7 + k * 3) % 5 < 2;

/** One level, from y. On the cut across its lines: one trapezoid per line, each over the via
 *  that feeds it, if it has one. On the cut along them: one long line, broken where the
 *  pattern cuts it, over the vias down to the crossing lines below. Then the cap. */
function level(at: Lit, part: DiePart, l: Level, under: Level | undefined, y: number, k: number, top: boolean): void {
  const p = at(part);
  const vp = at('vias');
  const [f, s] = [front(p), side(p)];
  const [across, along] = l.dir === 'z' ? [f, s] : [s, f];
  const [vAcross, vAlong] = l.dir === 'z' ? [front(vp), side(vp)] : [side(vp), front(vp)];
  const [lo, hi] = l.dir === 'z' ? [-W, W] : [-D, 0];
  const [y0, y1] = [y + l.v, y + l.v + l.h];
  const w = l.p / 4;
  const cut = (a: number): number => Math.max(lo, Math.min(hi, a));
  const ts = tracks(l);
  const lines = ts.flatMap((a) => [cut(a - w), y0, cut(a + w), y1]);
  bars(p, across, lines, true, l.p * 0.03);
  // The cut along the lines runs down the one centred on it, broken twice where the pattern cuts it.
  const [llo, lhi] = l.dir === 'z' ? [-D, 0] : [-W, W];
  const [e0, e1] = [llo + (lhi - llo) * (0.3 + 0.13 * k), llo + (lhi - llo) * (0.78 - 0.07 * k)];
  bars(p, along, [llo, y0, e0 - 0.02, y1, e0 + 0.02, y0, e1 - 0.02, y1, e1 + 0.02, y0, lhi, y1]);
  if (l.v > 0) {
    const down = ts.flatMap((a, i) => (via(i, k) ? [cut(a - w * 0.8), y, cut(a + w * 0.8), y0] : []));
    bars(vp, vAcross, down);
    const below = under ? tracks(under) : [];
    const uw = (under?.p ?? l.p) / 4;
    const onto = below.flatMap((a, i) => (via(i, k + 1) ? [a - uw * 0.8, y, a + uw * 0.8, y0] : []));
    bars(vp, vAlong, onto);
  }
  marks(p, f, [-W, y1 + CAP, W, y1 + CAP], 0.18);
  marks(p, s, [-D, y1 + CAP, 0, y1 + CAP], 0.18);
  if (!top) return;
  // On top, seen through the dielectric: the level's lines.
  const o: number[] = [];
  const yt = y1 + CAP + 0.001;
  for (const a of ts)
    for (const e of l.p < 0.1 ? [0] : [-w, w])
      if (l.dir === 'z') o.push(cut(a + e), yt, -D, cut(a + e), yt, 0);
      else o.push(-W, yt, cut(a + e), W, yt, cut(a + e));
  fine(p, o, l.p < 0.1 ? 0.1 : 0.16);
}

/** Levels of one stack of wiring, from y: slab first, then each level over the one under it. */
function wiring(at: Lit, part: DiePart, ls: Level[], y: number, under: Level | undefined): void {
  slab(at(part), -W, -D, W, 0, y, y + height(ls));
  let [yy, prev] = [y, under];
  ls.forEach((l, k) => {
    level(at, part, l, prev, yy, k, k === ls.length - 1);
    [yy, prev] = [yy + tall(l), l];
  });
}

/** M0 to M3, at the tightest pitch the lithography allows: M0 sits right on the contacts. */
const LOCAL: Level[] = [
  { dir: 'x', p: 0.06, v: 0, h: 0.04 },
  { dir: 'z', p: 0.08, v: 0.02, h: 0.04 },
  { dir: 'x', p: 0.06, v: 0.02, h: 0.04 },
  { dir: 'z', p: 0.08, v: 0.02, h: 0.04 },
];
const INTERMEDIATE: Level[] = [
  { dir: 'x', p: 0.12, v: 0.03, h: 0.075 },
  { dir: 'z', p: 0.12, v: 0.03, h: 0.075 },
  { dir: 'x', p: 0.12, v: 0.03, h: 0.075 },
];
const GLOBAL: Level[] = [
  { dir: 'z', p: 0.32, v: 0.05, h: 0.13 },
  { dir: 'x', p: 0.32, v: 0.05, h: 0.13 },
];
const Y_LOCAL = 0.637;
const Y_MID = Y_LOCAL + height(LOCAL);
const Y_GLOBAL = Y_MID + height(INTERMEDIATE);
const Y_MIM = Y_GLOBAL + height(GLOBAL);
const Y_PAD = Y_MIM + 0.07;
const Y_PASS = Y_PAD + 0.12;
const Y_TOP = Y_PASS + 0.08;

/** A metal-insulator-metal capacitor: three plates, alternate ones joined, so two capacitors
 *  stand in parallel on the power grid under the pad. */
function mim(at: Lit): void {
  const p = at('mim');
  slab(p, -W, -D, W, 0, Y_MIM, Y_PAD);
  const q: number[] = [];
  [0.015, 0.033, 0.051].forEach((d, i) =>
    q.push(i % 2 ? -0.9 : -0.95, Y_MIM + d, i % 2 ? 0.15 : 0.1, Y_MIM + d + 0.008),
  );
  bars(p, front(p), q);
  const o: number[] = [];
  rect(o, -0.95, -D + 0.1, 0.15, 0, Y_PAD + 0.001);
  rect(o, -0.9, -D + 0.14, 0.1, -0.04, Y_PAD + 0.001);
  fine(p, o, 0.22);
}

/** The aluminium layer: the pad a bump lands on, over two vias to the top copper, and the
 *  straps that take the capacitor's plates to the grid. */
function pad(at: Lit): void {
  const p = at('pad');
  slab(p, -W, -D, W, 0, Y_PAD, Y_PASS);
  // The pad, and the straps to the capacitor's two terminals; under them, their vias.
  const [y0, y1] = [Y_PAD + 0.04, Y_PAD + 0.075];
  bars(p, front(p), [
    0.35,
    y0,
    0.95,
    Y_PASS - 0.01,
    ...[-1.06, -0.8, -0.04, 0.24].flatMap((x, i) => (i % 2 ? [x, y1] : [x, y0])),
  ]);
  const v = at('vias');
  const xs = [0.48, 0.58, 0.72, 0.82, -0.94, -0.91, 0.11, 0.14];
  bars(
    v,
    front(v),
    xs.flatMap((x, i) => (i % 2 ? [x, y0] : [x, Y_PAD])),
  );
  const o: number[] = [];
  rect(o, 0.35, -0.75, 0.95, 0, Y_PASS + 0.001);
  fine(p, o, 0.2);
}

/** Silicon nitride over oxide, then polyimide, opened over the pad where the bump will go. */
function passivation(at: Lit): void {
  const p = at('passivation');
  const [x0, x1, z0] = [0.45, 0.85, -0.6];
  for (const [a, b, c, d] of [
    [x0, -D, x1, z0],
    [-W, -D, x0, 0],
    [x1, -D, W, 0],
  ] as const)
    slab(p, a, b, c, d, Y_PASS, Y_TOP);
  const f = front(p);
  const q: number[] = [];
  for (const y of [Y_PASS + 0.02, Y_PASS + 0.04]) q.push(-W, y, x0, y, x1, y, W, y);
  marks(p, f, q, 0.24);
  marks(p, side(p), [-D, Y_PASS + 0.02, 0, Y_PASS + 0.02, -D, Y_PASS + 0.04, 0, Y_PASS + 0.04], 0.24);
  const o: number[] = [];
  rect(o, x0 + 0.03, z0 + 0.03, x1 - 0.03, 0, Y_TOP + 0.001);
  fine(p, o, 0.3);
}

const GAP = 0.2;
const ASSEMBLY: Omit<Assembly, 'lift'>[] = [
  { id: 'substrate', pick: 'substrate', parts: ['substrate'], y: [0, 0.2], paint: substrate },
  { id: 'feol', pick: 'transistors', parts: ['transistors', 'contacts'], y: [0.2, 0.504], paint: transistors },
  { id: 'mol', pick: 'contacts', parts: ['contacts'], y: [0.504, Y_LOCAL], paint: middle },
  {
    id: 'local',
    pick: 'local',
    parts: ['local', 'vias'],
    y: [Y_LOCAL, Y_MID],
    paint: (at) => wiring(at, 'local', LOCAL, Y_LOCAL, undefined),
  },
  {
    id: 'intermediate',
    pick: 'intermediate',
    parts: ['intermediate', 'vias'],
    y: [Y_MID, Y_GLOBAL],
    paint: (at) => wiring(at, 'intermediate', INTERMEDIATE, Y_MID, LOCAL[3]),
  },
  {
    id: 'global',
    pick: 'global',
    parts: ['global', 'vias'],
    y: [Y_GLOBAL, Y_MIM],
    paint: (at) => wiring(at, 'global', GLOBAL, Y_GLOBAL, INTERMEDIATE[2]),
  },
  { id: 'mim', pick: 'mim', parts: ['mim'], y: [Y_MIM, Y_PAD], paint: mim },
  { id: 'pad', pick: 'pad', parts: ['pad', 'vias'], y: [Y_PAD, Y_PASS], paint: pad },
  { id: 'passivation', pick: 'passivation', parts: ['passivation'], y: [Y_PASS, Y_TOP], paint: passivation },
];

/** Every assembly, bottom up: the order they are painted in. */
export const ASSEMBLIES: readonly Assembly[] = ASSEMBLY.map((a, i) => ({ ...a, lift: i * GAP }));
export const BLOCK = { W, D } as const;

/** Paint one assembly where it sits closed, with `lit` (if any) in the signal. */
export function paint(a: Assembly, ctx: Paint['ctx'], cam: Camera, lit: string): void {
  a.paint((part) => ({ ctx, cam, lit: part === lit }));
}
