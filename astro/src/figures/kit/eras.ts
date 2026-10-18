import { bjt, capacitor, fingers, guard, meander, pads, spiral, track } from './analog';
import { BOUND, inset, partition, type Box, type Pt, type Sketch } from './sketch';

/** Die floorplans for the silicon dive's older and sparser eras (the modern one is in
 *  `kit/dies.ts`), each after the simple layouts of its kind:
 *  - a test chip, like the RF and mixed-signal tape-outs in a university gallery: a few
 *    blocks on a mostly bare die, pads on two or three sides (RF ones as ground-signal-
 *    ground triplets), spiral inductors, capacitors and meanders, short wide tracks;
 *  - bipolar, like the 741 op-amp: transistors as nested rectangles, resistors as strips,
 *    one big capacitor, a ring of large pads, wide aluminium joining them;
 *  - 1970s NMOS, like the 4004 and 6502: a pad ring, a PLA and a ROM as dot arrays, a
 *    datapath of repeated bit slices, logic as cell rows or a dense hatch, buses between.
 *  The window is always the block the next level opens into. */

const centre = (b: Box): Pt => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
/** The pad nearest p. */
const nearest = (ps: readonly Pt[], p: Pt): Pt =>
  ps.reduce(
    (m, q) => (Math.hypot(q[0] - p[0], q[1] - p[1]) < Math.hypot(m[0] - p[0], m[1] - p[1]) ? q : m),
    ps[0] ?? p,
  );

function sealRing(S: Sketch): void {
  S.rect(BOUND, 0);
  S.rect(inset(BOUND, 0.02), 2);
}

export function testchip(S: Sketch): void {
  sealRing(S);
  const sides = [
    [0, 2],
    [0, 1, 2],
    [0, 2, 3],
    [1, 3],
  ][S.int(0, 3)] ?? [0, 2];
  const ps = [
    ...pads(
      S,
      sides.filter((s) => s % 2 === 0),
      0.11,
    ),
    ...pads(
      S,
      sides.filter((s) => s % 2 === 1),
      0.09,
      true,
    ),
  ];
  guard(S, S.win);
  const area = inset(BOUND, 0.28);
  const blocks: Box[] = [];
  for (let i = 0; i < S.int(2, 4); i++) {
    const r = S.r(0.16, 0.3);
    const b = S.place(r * 2, r * 2, area, 0.08);
    if (!b) continue;
    spiral(S, b[0] + r, b[1] + r, r, S.int(2, 5));
    blocks.push(b);
  }
  for (let i = 0; i < S.int(1, 3); i++) {
    const b = S.place(S.r(0.18, 0.4), S.r(0.14, 0.3), area, 0.06);
    if (!b) continue;
    capacitor(S, b);
    blocks.push(b);
  }
  for (let i = 0; i < S.int(1, 2); i++) {
    const b = S.place(S.r(0.2, 0.35), S.r(0.12, 0.2), area, 0.06);
    if (!b) continue;
    meander(S, b, S.int(4, 9));
    blocks.push(b);
  }
  const b = S.place(S.r(0.25, 0.4), S.r(0.12, 0.18), area, 0.08);
  if (b) {
    fingers(S, b, S.int(4, 8));
    guard(S, b);
    blocks.push(b);
  }
  // Every block wired to the core and to its nearest pad, short and straight.
  const core = centre(S.win);
  for (const k of blocks) {
    track(S, centre(k), nearest(ps, centre(k)), 0.025);
    track(S, centre(k), core, 0.016);
  }
}

export function bipolar(S: Sketch): void {
  sealRing(S);
  const ps = pads(S, [0, 1, 2, 3], 0.15, false, 5);
  S.rect(inset(S.win, -0.02), 1);
  const area = inset(BOUND, 0.3);
  const terms: Pt[] = [];
  for (let i = 0; i < S.int(22, 32); i++) {
    const s = S.r(0.05, 0.09);
    const b = S.place(s * 2.2, s * 1.4, area, 0.05);
    if (b) terms.push(...bjt(S, (b[0] + b[2]) / 2, (b[1] + b[3]) / 2, s));
  }
  for (let i = 0; i < S.int(10, 16); i++) {
    const tall = S.chance(0.5);
    const b = S.place(tall ? 0.05 : S.r(0.3, 0.6), tall ? S.r(0.3, 0.5) : 0.05, area, 0.05);
    if (!b) continue;
    S.rect(b, 1);
    terms.push(tall ? [(b[0] + b[2]) / 2, b[1]] : [b[0], (b[1] + b[3]) / 2]);
  }
  const cap = S.place(S.r(0.4, 0.6), S.r(0.3, 0.45), area, 0.06);
  if (cap) {
    capacitor(S, cap);
    terms.push(centre(cap));
  }
  // Aluminium: each terminal to the one after it, every third to a pad.
  terms.forEach((p, i) => {
    const q = terms[(i + 3) % terms.length];
    if (i % 2 === 0 && q) track(S, p, q, 0.018);
    if (i % 5 === 0) track(S, p, nearest(ps, p), 0.03);
  });
}

/** Rows of standard cells in a box: rails, then cells of random widths edge to edge. */
function rows(S: Sketch, b: Box, rh: number): void {
  for (let y = b[1]; y < b[3] - rh / 2; y += rh) {
    S.seg(b[0], y, b[2], y, 1);
    for (let x = b[0]; x < b[2] - 0.01; ) {
      const w = Math.min(b[2] - x, S.r(0.02, 0.07));
      S.rect([x + 0.004, y + rh * 0.18, x + w - 0.004, y + rh * 0.82], 2);
      if (w > 0.035) S.seg(x + w / 2, y + rh * 0.18, x + w / 2, y + rh * 0.82, 2);
      x += w;
    }
  }
}

export function nmos(S: Sketch): void {
  sealRing(S);
  pads(S, [0, 1, 2, 3], 0.08, false, 2.4);
  const area = inset(BOUND, 0.17);
  for (const b of partition(S, area, inset(S.win, -0.03), 0.7)) {
    const r = inset(b, 0.03);
    const [w, h] = [r[2] - r[0], r[3] - r[1]];
    if (w < 0.1 || h < 0.1) continue;
    const kind = S.int(0, 4);
    if (kind === 0) {
      // A PLA or ROM: input lines one way, product lines the other, a dot where they meet.
      S.rect(r, 1);
      S.hatch(r, 0.04, 2, 'v');
      S.hatch(r, 0.04, 2, 'h');
      for (let x = r[0] + 0.04; x < r[2] - 0.01; x += 0.04)
        for (let y = r[1] + 0.04; y < r[3] - 0.01; y += 0.04) if (S.chance(0.45)) S.dot(x, y);
    } else if (kind === 1) {
      // A datapath: the same bit slice repeated across, a cell per row.
      S.rect(r, 1);
      const slices = Math.max(2, Math.floor(w / 0.07));
      for (let i = 0; i < slices; i++) {
        const x = r[0] + (w * i) / slices;
        S.seg(x, r[1], x, r[3], 2);
        for (let y = r[1] + 0.03; y < r[3] - 0.03; y += 0.07)
          S.rect([x + 0.012, y, x + w / slices - 0.012, y + 0.035], 2);
      }
    } else if (kind === 2) {
      S.rect(r, 1);
      rows(S, r, S.r(0.04, 0.06));
    } else {
      // Logic as a dense hatch, the way a plot shows a field of cells too fine to draw.
      S.rect(r, 1);
      S.hatch(r, S.r(0.008, 0.014), 2, S.chance(0.5) ? 'h' : 'v');
    }
  }
  // Buses: bundles of wide lines across the die between the blocks.
  for (let i = 0; i < S.int(1, 2); i++) {
    const y = S.r(area[1], area[3]);
    for (let k = 0; k < 4; k++) S.seg(area[0], y + k * 0.02, area[2], y + k * 0.02, 0);
  }
}

export const ERA_DIES = { testchip, bipolar, nmos } as const;
