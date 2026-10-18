import { BOUND, inset, WX, type Box, type Sketch } from './sketch';

/** The outer half of the silicon chain of plans for a zoom dive (`kit/sketch.ts`), each the
 *  window into the next: a row of racks (one server) and a motherboard (the processor). The
 *  rest is `kit/dies.ts`. Every part is seeded, so no two dives draw the same rack. */

/** One unit on a rack's front: drive bays, vents, ports or fans, by kind. */
function unit(S: Sketch, b: Box, kind: number): void {
  const [x0, y0, x1, y1] = b;
  const h = y1 - y0;
  S.rect(b, kind === 4 ? 2 : 1);
  if (kind === 0) {
    const n = S.int(4, 8);
    for (let i = 0; i < n; i++) S.rect([x0 + 0.04 + i * 0.055, y0 + h * 0.2, x0 + 0.085 + i * 0.055, y1 - h * 0.2], 2);
    S.hatch([x0 + 0.08 + n * 0.055, y0 + h * 0.25, x1 - 0.14, y1 - h * 0.25], 0.014, 2, 'v');
    S.dot(x1 - 0.08, y0 + h / 2);
    S.dot(x1 - 0.06, y0 + h / 2);
  } else if (kind === 1) {
    const rows = Math.max(1, Math.round(h / 0.045));
    S.grid([x0 + 0.03, y0 + 0.008, x1 - 0.03, y1 - 0.008], 12, rows, 2);
  } else if (kind === 2) {
    const n = 24;
    const pw = (x1 - x0 - 0.2) / n;
    for (let r = 0; r < 2; r++)
      for (let i = 0; i < n; i++)
        S.rect([x0 + 0.1 + i * pw, y0 + 0.006 + r * h * 0.45, x0 + 0.1 + (i + 0.7) * pw, y0 + h * (0.4 + r * 0.45)], 2);
  } else if (kind === 3) {
    S.hatch(inset(b, 0.012), 0.012, 2);
    const n = S.int(3, 6);
    for (let i = 0; i < n; i++) S.circle(x0 + ((i + 0.5) * (x1 - x0)) / n, y0 + h / 2, Math.min(h * 0.38, 0.07), 2);
  }
  S.rect([x0 - 0.012, y0 + h * 0.3, x0, y1 - h * 0.3], 2);
  S.rect([x1, y0 + h * 0.3, x1 + 0.012, y1 - h * 0.3], 2);
}

/** A row of racks seen from the front; the window is one server in the middle one. */
export function rack(S: Sketch): void {
  const wx = S.w[0];
  const rw = WX * 2 + 0.16;
  const U = 0.044;
  for (let k = -3; k <= 3; k++) {
    const [x0, x1] = [wx - rw / 2 + k * (rw + 0.06), wx + rw / 2 + k * (rw + 0.06)];
    if (x1 < BOUND[0] + 0.16 || x0 > BOUND[2] - 0.16) continue;
    if (x0 < BOUND[0] || x1 > BOUND[2]) {
      // A part rack does not fit: an in-row cooler of what width is left.
      const c: Box = [Math.max(x0, BOUND[0]), BOUND[1], Math.min(x1, BOUND[2]), BOUND[3]];
      S.rect(c, 0);
      S.hatch(inset(c, 0.04), 0.03, 2);
      continue;
    }
    S.rect([x0, BOUND[1], x1, BOUND[3]], 0);
    S.rect([x0, BOUND[3] - 0.06, x1, BOUND[3]], 1);
    for (const x of [x0 + 0.035, x1 - 0.035]) {
      S.seg(x, BOUND[1] + 0.04, x, BOUND[3] - 0.08, 2);
      for (let y = BOUND[1] + 0.06; y < BOUND[3] - 0.08; y += U) S.dot(x, y);
    }
    let y = BOUND[1] + 0.05;
    while (y < BOUND[3] - 0.1) {
      if (k === 0 && y + U > S.win[1] && y < S.win[3]) {
        y = S.win[3] + 0.006;
        continue;
      }
      const top = k === 0 && y < S.win[1] ? S.win[1] - 0.006 : BOUND[3] - 0.08;
      const kind = S.int(0, 4);
      const units = Math.min([1, 2, 1, 4, 1][kind] ?? 1, Math.floor((top - y) / U));
      if (units < 1) {
        y = top + 0.006;
        continue;
      }
      unit(S, [x0 + 0.06, y, x1 - 0.06, y + units * U - 0.006], kind);
      y += units * U;
    }
  }
}

/** A small part on a board: a QFP with legs, or a BGA with balls, with pin 1 marked. */
function part(S: Sketch, b: Box): void {
  S.rect(b, 1);
  const [x0, y0, x1, y1] = b;
  S.dot(x0 + 0.02, y0 + 0.02);
  if (S.chance(0.5))
    for (let u = 0.15; u < 0.9; u += 0.12) {
      S.seg(x0 + (x1 - x0) * u, y0, x0 + (x1 - x0) * u, y0 - 0.015, 2);
      S.seg(x0 + (x1 - x0) * u, y1, x0 + (x1 - x0) * u, y1 + 0.015, 2);
    }
  else S.rect(inset(b, 0.02), 2);
}

/** A motherboard: the processor socket is the window, memory slots on its roomy side, power
 *  stages above or below it, expansion slots, rear I/O and smaller parts placed clear of each
 *  other, with buses running into the socket. */
export function board(S: Sketch): void {
  const [x0, y0, x1, y1] = BOUND;
  const c = 0.08;
  S.poly(
    [
      [x0 + c, y0],
      [x1 - c, y0],
      [x1, y0 + c],
      [x1, y1 - c],
      [x1 - c, y1],
      [x0 + c, y1],
      [x0, y1 - c],
      [x0, y0 + c],
    ],
    0,
    true,
  );
  for (const [x, y] of [
    [x0 + 0.1, y0 + 0.1],
    [x1 - 0.1, y0 + 0.1],
    [x0 + 0.1, y1 - 0.1],
    [x1 - 0.1, y1 - 0.1],
  ] as const)
    S.circle(x, y, 0.03, 1);
  const sock = inset(S.win, -0.05);
  S.rect(sock, 1);
  S.taken[0] = inset(sock, -0.03);
  for (const [x, y] of [
    [sock[0], sock[1]],
    [sock[2], sock[1]],
    [sock[0], sock[3]],
    [sock[2], sock[3]],
  ] as const)
    S.circle(x, y, 0.02, 2);
  // Memory: slots on whichever side has more room, a bus from the socket to them.
  const right = S.w[0] < 0;
  const n = S.int(4, 8);
  const yA = Math.max(y0 + 0.06, S.w[1] - 0.45);
  const yB = Math.min(y1 - 0.06, S.w[1] + 0.45);
  for (let i = 0; i < n; i++) {
    const x = right ? sock[2] + 0.2 + i * 0.07 : sock[0] - 0.2 - i * 0.07;
    S.rect([x - 0.016, yA, x + 0.016, yB], 1);
    S.seg(x - 0.016, yA + (yB - yA) * 0.4, x + 0.016, yA + (yB - yA) * 0.4, 2);
    S.taken.push([x - 0.03, yA, x + 0.03, yB]);
  }
  for (let i = 0; i < 8; i++) {
    const y = S.w[1] - 0.14 + i * 0.04;
    S.seg(right ? sock[2] : sock[0], y, right ? sock[2] + 0.184 : sock[0] - 0.184, y, 2);
  }
  // Power stages: chokes and capacitors in a row along the socket.
  const up = S.win[1] - 0.24 > y0;
  const vy = up ? sock[1] - 0.12 : sock[3] + 0.06;
  for (let x = sock[0]; x < sock[2] - 0.06; x += 0.09) {
    S.rect([x, vy, x + 0.06, vy + 0.06], 1);
    S.circle(x + 0.03, vy + 0.03, 0.018, 2);
    S.circle(x + 0.03, up ? vy - 0.04 : vy + 0.1, 0.016, 2);
  }
  S.taken.push([sock[0], up ? vy - 0.06 : vy, sock[2], up ? vy + 0.06 : vy + 0.12]);
  for (let i = 0; i < 3; i++) {
    const b = S.place(S.r(0.8, 1.2), 0.04);
    if (!b) continue;
    S.rect(b, 1);
    S.seg(b[0] + (b[2] - b[0]) * 0.3, b[1], b[0] + (b[2] - b[0]) * 0.3, b[3], 2);
  }
  for (let i = 0; i < S.int(5, 10); i++) {
    const s = S.r(0.08, 0.24);
    const b = S.place(s, s * S.r(0.7, 1.3));
    if (!b) continue;
    part(S, b);
    // Its bus: along x towards the socket, then down or up into it.
    const [cx, cy] = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
    for (let k = -1; k <= 1; k++) {
      const [ex, ey] = [cx + k * 0.016, cy + k * 0.016];
      const tx = S.w[0] + (ex - S.w[0]) * 0.2;
      S.poly(
        [
          [cx < S.w[0] ? b[2] : b[0], ey],
          [tx, ey],
          [tx, S.w[1]],
        ],
        2,
      );
    }
    S.dot(cx < S.w[0] ? b[2] + 0.02 : b[0] - 0.02, cy);
  }
  for (let i = 0; i < 40; i++) {
    const b = S.place(0.03, 0.016, BOUND, 0.01);
    if (b) S.rect(b, 2);
  }
}
