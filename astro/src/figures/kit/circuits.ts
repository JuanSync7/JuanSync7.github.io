import { bjt, capacitor, contact, fingers, guard, meander, spiral, track } from './analog';
import { gate, stick, width } from './gates';
import { BOUND, inset, partition, WY, type Box, type Pt, type Sketch } from './sketch';

/** The levels under the die for the silicon dive's older eras (`kit/eras.ts`): a circuit
 *  block (analog for a test chip or a bipolar die, a datapath for NMOS), the cell level
 *  (real gates as stick diagrams in rows, or bipolar devices up close), and the package a
 *  die of that era sits in: a dual in-line or quad flat package, its lead frame and the
 *  bond wires from the fingers to the die. */

const centre = (b: Box): Pt => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];

/** An analog block inside its guard ring: transistor fingers, meanders, capacitors, a
 *  small inductor on a test chip or arrays of bipolar transistors, wired to each other. */
export function analogBlock(S: Sketch): void {
  guard(S, inset(BOUND, 0.06));
  const leaves = partition(S, inset(BOUND, 0.12), inset(S.win, -0.04), 0.6).map((b) => inset(b, 0.04));
  const used: Box[] = [];
  for (const r of leaves) {
    const [w, h] = [r[2] - r[0], r[3] - r[1]];
    if (w < 0.12 || h < 0.1) continue;
    const kind = S.int(0, 3);
    if (kind === 0) {
      fingers(S, r, Math.max(2, Math.round(w / 0.05)));
      guard(S, r);
    } else if (kind === 1) meander(S, r, Math.max(2, Math.round(w / 0.035)));
    else if (kind === 2 && S.era === 'testchip' && Math.abs(w - h) < 0.4)
      spiral(S, ...centre(r), Math.min(w, h) / 2, S.int(2, 4));
    else if (S.era === 'bipolar' && kind === 2)
      for (let x = r[0] + 0.1; x < r[2] - 0.08; x += 0.2)
        for (let y = r[1] + 0.08; y < r[3] - 0.05; y += 0.15) bjt(S, x, y, 0.07);
    else capacitor(S, r);
    used.push(r);
  }
  used.forEach((r, i) => {
    const next = used[i + 1];
    if (next) track(S, centre(r), centre(next), 0.018);
  });
  if (used[0]) track(S, centre(used[0]), centre(S.win), 0.018);
}

/** A datapath block of the NMOS era: bit slices of register cells across, an ALU band,
 *  control logic and a carry chain. */
export function datapath(S: Sketch): void {
  S.rect(BOUND, 0);
  const slices = S.int(8, 16);
  const sw = (BOUND[2] - BOUND[0]) / slices;
  for (let i = 0; i <= slices; i++) S.seg(BOUND[0] + i * sw, BOUND[1], BOUND[0] + i * sw, BOUND[3], 2);
  const bands = S.int(4, 7);
  const bh = (BOUND[3] - BOUND[1]) / bands;
  for (let j = 0; j < bands; j++) {
    const y = BOUND[1] + j * bh;
    // A bus of three lines along each band's top, then the band's own cells per slice.
    for (let k = 0; k < 3; k++) S.seg(BOUND[0], y + 0.02 + k * 0.018, BOUND[2], y + 0.02 + k * 0.018, k ? 2 : 1);
    const kind = S.int(0, 2);
    const [t, b] = [y + 0.08, y + bh - 0.03];
    for (let i = 0; i < slices; i++) {
      const x = BOUND[0] + i * sw;
      if (kind === 0) {
        // A register bit: two transistors, poly across, contacts to the bus.
        S.rect([x + sw * 0.15, t, x + sw * 0.45, b], 2);
        S.rect([x + sw * 0.55, t, x + sw * 0.85, b], 2);
        S.seg(x + sw * 0.08, (t + b) / 2, x + sw * 0.92, (t + b) / 2, 1);
        contact(S, x + sw * 0.3, t + 0.02, 0.008);
      } else if (kind === 1) {
        for (let k = 1; k < 4; k++) S.seg(x + (sw * k) / 4, t, x + (sw * k) / 4, b, 2);
        S.seg(x + sw * 0.25, b, x + sw * 0.75, t, 1);
      } else {
        // The carry chain: one stage per slice, each handing on to the next.
        contact(S, x + sw / 2, (t + b) / 2, Math.min(sw, bh) * 0.08);
        S.seg(x + sw / 2, (t + b) / 2, Math.min(BOUND[2], x + sw * 1.5), (t + b) / 2, 0);
        S.rect([x + sw * 0.2, t, x + sw * 0.8, (t + b) / 2 - 0.02], 2);
      }
    }
  }
}

/** The cell level: rows of real gates as stick diagrams (rows flipped in turn so
 *  neighbours share their rails, the odd tap cell between gates); on a bipolar die, a few
 *  transistors and resistors up close instead. The window is a stretch of one row. */
export function cells(S: Sketch): void {
  if (S.era === 'bipolar') {
    const ps: Pt[] = [];
    for (let x = BOUND[0] + 0.45; x < BOUND[2] - 0.3; x += S.r(0.7, 1))
      ps.push(...bjt(S, x, S.r(-0.5, 0.5), S.r(0.2, 0.3)));
    for (let i = 0; i < S.int(3, 6); i++) {
      const b = S.place(S.r(0.6, 1.4), 0.07, BOUND, 0.08);
      if (b) S.rect(b, 1);
    }
    for (let i = 0; i + 2 < ps.length; i += 2) track(S, ps[i] ?? [0, 0], ps[i + 2] ?? [0, 0], 0.05);
    return;
  }
  const rh = WY * 2;
  let first = S.win[1];
  while (first - rh >= BOUND[1]) first -= rh;
  const pitch = 0.075;
  for (let y = first, row = 0; y + rh <= BOUND[3] + 1e-6; y += rh, row++) {
    const flip = row % 2 === 1;
    for (const ry of [y, y + rh]) S.rect([BOUND[0], ry - 0.012, BOUND[2], ry + 0.012], 0);
    S.dashed(BOUND[0], y + rh / 2, BOUND[2], y + rh / 2, 0.03, 0.03);
    const inRow = Math.abs(y - S.win[1]) < 1e-6;
    let x = BOUND[0] + 0.02;
    while (x < BOUND[2] - 0.2) {
      if (inRow && x + 0.15 > S.win[0] && x < S.win[2]) {
        x = S.win[2] + 0.02;
        continue;
      }
      if (S.chance(0.12)) {
        // A tap cell: contacts tying the well and the substrate to the rails.
        contact(S, x + 0.03, y + rh * 0.12, 0.01);
        contact(S, x + 0.03, y + rh * 0.88, 0.01);
        x += 0.07;
        continue;
      }
      const g = gate(S.rng);
      const gw = width(g, pitch);
      if (x + gw > BOUND[2] - 0.02 || (inRow && x < S.win[0] && x + gw > S.win[0])) {
        x = inRow && x < S.win[0] ? S.win[2] + 0.02 : BOUND[2];
        continue;
      }
      stick(S, g, x, y, rh, pitch, flip);
      S.seg(x + gw, y, x + gw, y + rh, 2);
      x += gw + 0.01;
    }
  }
}

/** The package of an older die: a dual in-line or a quad flat body, its leads, the lead
 *  frame's fingers reaching in toward the cavity, and a bond wire from each finger to the
 *  edge of the die. */
export function bonded(S: Sketch): void {
  const dip = S.chance(0.55);
  const body: Box = dip ? [-1.8, -0.74, 1.8, 0.74] : inset(BOUND, 0.12);
  S.rect(body, 0);
  if (dip) S.arc(body[0], 0, 0.1, -Math.PI / 2, Math.PI / 2, 1, 10);
  else S.circle(body[0] + 0.12, body[1] + 0.12, 0.03, 1);
  const cavity = inset(S.win, -0.08);
  S.rect(cavity, 1);
  S.rect(inset(S.win, -0.03), 2);
  // Leads round the body, a finger from each, and a bond wire from each finger's tip to the
  // nearest edge of the die.
  const n = dip ? S.int(7, 14) : S.int(8, 16);
  const m = dip ? 0 : Math.max(3, Math.round((n * (body[3] - body[1])) / (body[2] - body[0])));
  const leads: [Pt, Pt][] = [];
  for (let i = 0; i < n; i++) {
    const x = body[0] + ((body[2] - body[0]) * (i + 0.5)) / n;
    leads.push([
      [x, body[1]],
      [x, BOUND[1]],
    ]);
  }
  for (let i = 0; i < m; i++) {
    const y = body[1] + ((body[3] - body[1]) * (i + 0.5)) / m;
    leads.push([
      [body[2], y],
      [BOUND[2], y],
    ]);
  }
  for (let i = n - 1; i >= 0; i--) {
    const x = body[0] + ((body[2] - body[0]) * (i + 0.5)) / n;
    leads.push([
      [x, body[3]],
      [x, BOUND[3]],
    ]);
  }
  for (let i = m - 1; i >= 0; i--) {
    const y = body[1] + ((body[3] - body[1]) * (i + 0.5)) / m;
    leads.push([
      [body[0], y],
      [BOUND[0], y],
    ]);
  }
  const ring = inset(S.win, -0.2);
  const [cx, cy] = [(S.win[0] + S.win[2]) / 2, (S.win[1] + S.win[3]) / 2];
  // Each finger runs straight in toward the die's centre and stops at the ring round the
  // cavity, so the frame fans in without crossing whatever the body's shape.
  leads.forEach(([p, out]) => {
    const [dx, dy] = [p[0] - cx, p[1] - cy];
    const k = Math.min(
      dx ? ((dx > 0 ? ring[2] : ring[0]) - cx) / dx : Infinity,
      dy ? ((dy > 0 ? ring[3] : ring[1]) - cy) / dy : Infinity,
    );
    const tip: Pt = [cx + dx * k, cy + dy * k];
    S.seg(p[0], p[1], out[0], out[1], 1);
    S.seg(p[0], p[1], tip[0], tip[1], 2);
    S.rect([tip[0] - 0.012, tip[1] - 0.012, tip[0] + 0.012, tip[1] + 0.012], 2);
    const die: Pt = [Math.min(S.win[2], Math.max(S.win[0], tip[0])), Math.min(S.win[3], Math.max(S.win[1], tip[1]))];
    S.seg(tip[0], tip[1], die[0], die[1], 2);
  });
}
