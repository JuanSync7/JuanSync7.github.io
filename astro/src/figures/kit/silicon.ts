import { buildBoard } from './chip-board-plan';
import { chipPart, chipPlan, type ChipPlan } from './chip-plan';
import { BOUND, inset, WX, type Box, type Sketch } from './sketch';

/** The outer half of the silicon chain of plans for a zoom dive (`kit/sketch.ts`), each the
 *  window into the next: a row of racks (one server) and a motherboard (the processor). The
 *  rest is `kit/dies.ts`. Every part is seeded, so no two dives draw the same rack. */

/** One unit on a rack's front: drive bays, vents, ports or fans, by kind. */
function unit(S: Sketch, b: Box, kind: number, plan: ChipPlan, id: string): void {
  chipPart(plan, id, ['drive-bays', 'vent', 'switch', 'fans', 'blank-panel'][kind] ?? 'server', b);
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
  S.select([0, 0.05], 'board');
  const plan = chipPlan(S, 'rack');
  chipPart(plan, 'server', 'server', S.win, true);
  const wx = S.w[0];
  const rw = WX * 2 + 0.16;
  const U = 0.05;
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
      unit(S, [x0 + 0.06, y, x1 - 0.06, y + units * U - 0.006], kind, plan, `rack${k}-unit${Math.round(y * 1000)}`);
      y += units * U;
    }
  }
}

/** The PCB has its own footprint and connected power-stage grammar. */
export function board(S: Sketch): void {
  buildBoard(S);
}
