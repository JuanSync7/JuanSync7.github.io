import { BOUND, inset, partition, WX, WY, type Box, type Sketch } from './sketch';

/** The inner half of the silicon chain of plans for a zoom dive (`kit/sketch.ts`): a package
 *  (the die), a die floorplan (one core), a core's blocks (one block), rows of standard
 *  cells. The outer half is `kit/silicon.ts`. */

/** A package from above: the die is the window, memory stacks either side on an interposer,
 *  capacitors round it, a stiffener ring, fiducials and the pin-1 corner. */
export function pkg(S: Sketch): void {
  S.rect(BOUND, 0);
  S.rect(inset(BOUND, 0.07), 1);
  S.poly(
    [
      [BOUND[0] + 0.1, BOUND[1] + 0.1],
      [BOUND[0] + 0.2, BOUND[1] + 0.1],
      [BOUND[0] + 0.1, BOUND[1] + 0.2],
    ],
    1,
    true,
  );
  S.circle(BOUND[2] - 0.14, BOUND[1] + 0.14, 0.025, 2);
  S.circle(BOUND[0] + 0.14, BOUND[3] - 0.14, 0.025, 2);
  const [wx0, wy0, wx1, wy1] = S.win;
  S.rect(inset(S.win, -0.025), 2);
  const stacks = [2, 4, 4, 6][S.int(0, 3)] ?? 2;
  const per = stacks / 2;
  const hw = S.r(0.24, 0.34);
  let core: Box = inset(S.win, -0.03);
  for (let i = 0; i < stacks; i++) {
    const left = i % 2 === 0;
    const sh = (wy1 - wy0 - (per - 1) * 0.02) / per;
    const y = wy0 + (i >> 1) * (sh + 0.02);
    const b: Box = left ? [wx0 - 0.04 - hw, y, wx0 - 0.04, y + sh] : [wx1 + 0.04, y, wx1 + 0.04 + hw, y + sh];
    S.rect(b, 1);
    // Seen from above, a stack is its top die, with the base die's edge just showing.
    S.rect(inset(b, 0.012), 2);
    S.hatch(inset(b, 0.03), 0.02, 2, 'v');
    core = [Math.min(core[0], b[0]), core[1], Math.max(core[2], b[2]), core[3]];
  }
  const inter = inset(core, -0.06);
  S.rect(inter, 1);
  S.rect(inset(inter, 0.015), 2);
  S.taken[0] = inset(inter, -0.04);
  for (let i = 0; i < S.int(0, 2); i++) {
    const b = S.place(S.r(0.25, 0.4), S.r(0.18, 0.26), inset(BOUND, 0.2));
    if (b) {
      S.rect(b, 1);
      S.grid(inset(b, 0.02), 3, 2, 2);
    }
  }
  // Capacitors in a ring of rows round the interposer, and a band of them inside the ring.
  for (const b of [inset(BOUND, 0.14), inset(BOUND, 0.2)]) {
    for (let x = b[0]; x < b[2]; x += 0.08) for (const y of [b[1], b[3]]) S.rect([x, y - 0.01, x + 0.03, y + 0.01], 2);
    for (let y = b[1] + 0.08; y < b[3] - 0.04; y += 0.08)
      for (const x of [b[0], b[2]]) S.rect([x - 0.01, y, x + 0.01, y + 0.03], 2);
  }
  for (let r = 0; r < S.int(3, 5); r++) {
    const ring = inset(inter, -0.12 - r * 0.07);
    for (let x = ring[0]; x < ring[2]; x += 0.06)
      for (const y of [ring[1], ring[3]])
        if (y > BOUND[1] + 0.12 && y < BOUND[3] - 0.12) S.rect([x, y - 0.012, x + 0.035, y + 0.012], 2);
    for (let y = ring[1] + 0.06; y < ring[3]; y += 0.06)
      for (const x of [ring[0], ring[2]])
        if (x > BOUND[0] + 0.12 && x < BOUND[2] - 0.12) S.rect([x - 0.012, y, x + 0.012, y + 0.035], 2);
  }
}

/** A die's floorplan: the window is one core in a cluster of identical cores; caches, PHYs
 *  along the edges, analog blocks and logic fill the rest, inside the pad ring. */
export function die(S: Sketch): void {
  S.rect(BOUND, 0);
  S.rect(inset(BOUND, 0.018), 2);
  const pads = inset(BOUND, 0.05);
  for (let x = pads[0]; x < pads[2] - 0.02; x += 0.05)
    for (const y of [pads[1], pads[3] - 0.025]) S.rect([x, y, x + 0.025, y + 0.025], 2);
  for (let y = pads[1] + 0.05; y < pads[3] - 0.05; y += 0.05)
    for (const x of [pads[0], pads[2] - 0.025]) S.rect([x, y, x + 0.025, y + 0.025], 2);
  const area = inset(BOUND, 0.11);
  const [tw, th] = [WX * 2 + 0.04, WY * 2 + 0.04];
  const [ci, cj] = [S.int(-2, 2), S.int(-1, 1)];
  let cluster: Box = S.win;
  for (let i = ci - 1; i <= ci + 1; i++)
    for (let j = cj - 1; j <= cj + 1; j++) {
      const b: Box = [S.win[0] + i * tw, S.win[1] + j * th, S.win[2] + i * tw, S.win[3] + j * th];
      if ((i === 0 && j === 0) || b[0] < area[0] || b[2] > area[2] || b[1] < area[1] || b[3] > area[3]) continue;
      cluster = [
        Math.min(cluster[0], b[0]),
        Math.min(cluster[1], b[1]),
        Math.max(cluster[2], b[2]),
        Math.max(cluster[3], b[3]),
      ];
      S.rect(b, 1);
      const cut = b[0] + (b[2] - b[0]) * 0.35;
      S.grid([b[0] + 0.02, b[1] + 0.02, cut, b[3] - 0.02], 3, 4, 2);
      S.hatch([cut + 0.02, b[1] + 0.02, b[2] - 0.02, b[3] - 0.02], 0.03, 2);
    }
  for (const b of partition(S, area, inset(cluster, -0.02), 0.55)) {
    const r = inset(b, 0.02);
    const [w, h] = [r[2] - r[0], r[3] - r[1]];
    if (w < 0.06 || h < 0.06) continue;
    S.rect(r, 1);
    const edge = r[0] <= area[0] + 0.03 || r[2] >= area[2] - 0.03 || r[1] <= area[1] + 0.03 || r[3] >= area[3] - 0.03;
    const kind = edge && Math.min(w, h) < 0.3 ? 0 : S.int(1, 3);
    if (kind === 0) S.hatch(r, 0.04, 2, w > h ? 'v' : 'h');
    else if (kind === 1)
      S.grid(inset(r, 0.02), Math.max(1, Math.round(w / 0.16)), Math.max(1, Math.round(h / 0.12)), 2);
    else if (kind === 2) S.hatch(r, 0.02, 2);
    else for (let d = 0.02; d < Math.min(w, h) / 2; d += 0.025) S.rect(inset(r, d), 2);
  }
}

/** A core's blocks: caches as arrays, a register file, datapaths in bit slices and control
 *  logic in cell rows, one block the window. */
export function core(S: Sketch): void {
  S.rect(BOUND, 0);
  for (const b of partition(S, inset(BOUND, 0.04), inset(S.win, -0.02), 0.5)) {
    const r = inset(b, 0.018);
    const [w, h] = [r[2] - r[0], r[3] - r[1]];
    if (w < 0.05 || h < 0.05) continue;
    S.rect(r, 1);
    const kind = S.int(0, 3);
    if (kind === 0) {
      const [c, n] = [Math.max(1, Math.round(w / 0.3)), Math.max(1, Math.round(h / 0.22))];
      S.grid(r, c, n, 1);
      for (let i = 0; i < c; i++)
        for (let j = 0; j < n; j++) {
          const cell: Box = [
            r[0] + (w * i) / c,
            r[1] + (h * j) / n,
            r[0] + (w * (i + 1)) / c,
            r[1] + (h * (j + 1)) / n,
          ];
          S.hatch(inset(cell, 0.015), 0.012, 2);
        }
    } else if (kind === 1) S.grid(inset(r, 0.015), Math.round(w / 0.04), Math.round(h / 0.04), 2);
    else if (kind === 2) S.hatch(r, 0.03, 2, 'v');
    else S.hatch(r, 0.022, 2);
  }
}

/** Rows of standard cells between power rails: diffusion, poly gates, contacts and metal;
 *  the window is a stretch of one row. */
export function cell(S: Sketch): void {
  const rh = WY * 2;
  let first = S.win[1];
  while (first - rh >= BOUND[1]) first -= rh;
  for (let y = first; y + rh <= BOUND[3] + 1e-6; y += rh) {
    S.rect([BOUND[0], y - 0.02, BOUND[2], y + 0.02], 1);
    for (let x = BOUND[0] + 0.04; x < BOUND[2]; x += 0.1) S.dot(x, y);
    const inRow = Math.abs(y - S.win[1]) < 1e-6;
    let x = BOUND[0];
    while (x < BOUND[2] - 0.1) {
      if (inRow && x + 0.12 > S.win[0] && x < S.win[2]) {
        x = S.win[2];
        continue;
      }
      const g = S.int(2, 7);
      const x1 = Math.min(BOUND[2], inRow && x < S.win[0] ? S.win[0] : BOUND[2], x + g * 0.06 + 0.04);
      S.seg(x1, y + 0.02, x1, y + rh - 0.02, 2);
      S.rect([x + 0.02, y + 0.06, x1 - 0.02, y + 0.19], 1);
      S.rect([x + 0.02, y + 0.31, x1 - 0.02, y + 0.44], 1);
      const gates: number[] = [];
      for (let gx = x + 0.05; gx < x1 - 0.03; gx += 0.06) {
        S.seg(gx, y + 0.04, gx, y + 0.46, 1);
        gates.push(gx);
        S.rect([gx + 0.022, y + 0.11, gx + 0.038, y + 0.13], 2);
        S.rect([gx + 0.022, y + 0.37, gx + 0.038, y + 0.39], 2);
      }
      const mx = (gates[S.int(0, Math.max(0, gates.length - 1))] ?? x) + 0.03;
      S.poly(
        [
          [mx, y + 0.12],
          [mx, y + 0.38],
          [Math.min(x1 - 0.02, mx + 0.06), y + 0.38],
        ],
        0,
      );
      x = x1;
    }
  }
}
