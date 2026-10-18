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

/** A datapath block of the NMOS era: bit slices across, and in each band one real gate
 *  repeated in every slice (that is what a bit-sliced datapath is), the bands flipped in
 *  turn to share their rails, buses running between them. */
export function datapath(S: Sketch): void {
  S.rect(BOUND, 0);
  const slices = S.int(8, 14);
  const sw = (BOUND[2] - BOUND[0]) / slices;
  const bands = S.int(4, 6);
  const gap = 0.05;
  const bh = (BOUND[3] - BOUND[1] - gap * bands) / bands;
  for (let j = 0; j < bands; j++) {
    const y = BOUND[1] + j * (bh + gap);
    for (let k = 0; k < 3; k++) S.seg(BOUND[0], y + 0.012 + k * 0.014, BOUND[2], y + 0.012 + k * 0.014, k ? 2 : 1);
    const g = gate(S.rng);
    const pitch = (sw * 0.9) / width(g, 1);
    for (let i = 0; i < slices; i++) {
      const x = BOUND[0] + i * sw;
      stick(S, g, x + sw * 0.05, y + gap, bh, pitch, j % 2 === 1);
      S.seg(x, y + gap, x, y + gap + bh, 2);
    }
  }
}

/** The cell level: rows of real gates as stick diagrams (rows flipped in turn so
 *  neighbours share their rails, the odd tap cell between gates); on a bipolar die, a few
 *  transistors and resistors up close instead. The window is a stretch of one row. */
export function cells(S: Sketch): void {
  if (S.era === 'bipolar') {
    // A transistor array, like an array chip seen close: a grid of transistors edge to edge,
    // the emitters of each row strapped together, a resistor strip between rows.
    const [cols, rws] = [S.int(5, 8), S.int(3, 4)];
    const [cw, ch] = [(BOUND[2] - BOUND[0]) / cols, (BOUND[3] - BOUND[1]) / rws];
    for (let j = 0; j < rws; j++) {
      const ts: Pt[] = [];
      for (let i = 0; i < cols; i++)
        ts.push(bjt(S, BOUND[0] + (i + 0.5) * cw, BOUND[1] + (j + 0.42) * ch, Math.min(cw * 0.38, ch * 0.5))[2]);
      const y = BOUND[1] + (j + 0.88) * ch;
      S.rect([BOUND[0] + 0.05, y - 0.012, BOUND[2] - 0.05, y + 0.012], 1);
      for (let i = 0; i + 1 < ts.length; i++) track(S, ts[i] ?? [0, 0], ts[i + 1] ?? [0, 0], 0.03);
    }
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

/** The package of an older die: a ceramic pin-grid array. Rows of pins fill the body up to
 *  the seal ring; inside it, a ring of bond fingers round the cavity, and a bond wire from
 *  every finger to the edge of the die. Every part repeats, so the whole body is filled. */
export function bonded(S: Sketch): void {
  const body = inset(BOUND, 0.03);
  S.rect(body, 0);
  S.rect(inset(body, 0.025), 2);
  S.poly(
    [
      [body[0] + 0.05, body[1] + 0.05],
      [body[0] + 0.14, body[1] + 0.05],
      [body[0] + 0.05, body[1] + 0.14],
    ],
    1,
    true,
  );
  const out = inset(S.win, -S.r(0.3, 0.42));
  const lim = inset(body, 0.1);
  const seal: Box = [
    Math.max(out[0], lim[0]),
    Math.max(out[1], lim[1]),
    Math.min(out[2], lim[2]),
    Math.min(out[3], lim[3]),
  ];
  S.rect(seal, 1);
  S.rect(inset(seal, 0.02), 1);
  // Pins on a grid, from the rim in to the seal ring: a square pad with its pin in it.
  const p = S.r(0.075, 0.1);
  for (let x = body[0] + 0.1; x < body[2] - 0.06; x += p)
    for (let y = body[1] + 0.1; y < body[3] - 0.06; y += p) {
      if (x > seal[0] - 0.05 && x < seal[2] + 0.05 && y > seal[1] - 0.05 && y < seal[3] + 0.05) continue;
      S.rect([x - p * 0.3, y - p * 0.3, x + p * 0.3, y + p * 0.3], 2);
      S.dot(x, y);
    }
  // The bond fingers: a dense ring of short bars pointing in at the cavity, each wired to
  // the die edge straight toward its centre.
  const ring = inset(S.win, -0.14);
  const cavity = inset(S.win, -0.05);
  S.rect(cavity, 1);
  const [cx, cy] = centre(S.win);
  const pitch = 0.035;
  const fingersOn = (a: Pt, b: Pt): void => {
    const n = Math.floor(Math.hypot(b[0] - a[0], b[1] - a[1]) / pitch);
    for (let i = 1; i < n; i++) {
      const [x, y] = [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n];
      const [dx, dy] = [cx - x, cy - y];
      const l = Math.hypot(dx, dy) || 1;
      S.seg(x, y, x + (dx / l) * 0.05, y + (dy / l) * 0.05, 1);
      // Where the wire meets the die: the ray enters the die's box when it has crossed the
      // last of its two slabs, so take the larger of the two entry distances.
      const k = Math.max(
        dx ? ((dx > 0 ? S.win[0] : S.win[2]) - x) / dx : -Infinity,
        dy ? ((dy > 0 ? S.win[1] : S.win[3]) - y) / dy : -Infinity,
      );
      S.seg(x + (dx / l) * 0.05, y + (dy / l) * 0.05, x + dx * k, y + dy * k, 2);
    }
  };
  const [x0, y0, x1, y1] = ring;
  fingersOn([x0, y0], [x1, y0]);
  fingersOn([x1, y0], [x1, y1]);
  fingersOn([x1, y1], [x0, y1]);
  fingersOn([x0, y1], [x0, y0]);
}
