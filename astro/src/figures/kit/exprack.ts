import { reveal } from './drawing/monodraw';
import type { Sketch, V3 } from './drawing/monoline';
import { cable, FLOOR } from './cable';
import { ease, floor, FRAME, PX, shift } from './expbase';
import type { Small } from './hiddenshared';

/** Licence analytics (`experience-icon`, visibility): the compute cluster's rack of blade servers,
 *  and beside it on a trolley a chart recorder wired to it. The recorder's pen plots licence use
 *  across the paper, then carries on as a dashed forecast that stays under the licence cap: the
 *  cluster's jobs, read back to say how many licences will be needed. */

const DECK = 0.86;
const [PX0, PX1, PZ0, PZ1] = [1.62, 2.38, 0.2, 0.92];
/** The plot: time runs along x, use rises toward the back (−z). */
const at = (x: number, v: number): V3 => [PX0 + 0.06 + x * (PX1 - PX0 - 0.1), DECK + 0.002, PZ1 - 0.05 - v * 0.6];
const CAP = 0.82;
const USE = [0.18, 0.3, 0.26, 0.42, 0.38, 0.5, 0.47, 0.56, 0.53, 0.62];
const SPLIT = 0.6;
const CYCLE = 9;
const GANTRY: V3 = [PX0 + 0.06, 0, 0];
const HEAD: V3 = [PX0 + 0.06, 0, PZ1];

function rack(k: Sketch): void {
  k.object('cluster', () => {
    k.box(0.22, 0, 0.24, 1.08, 1.86, 0.86);
    k.box(0.2, 1.86, 0.22, 1.1, 1.9, 0.88);
    k.rect('x', 1.081, 0.06, 0.3, 1.8, 0.8, 'soft');
    for (let i = 0; i < 8; i++) {
      const y = 0.12 + i * 0.205;
      k.rect('x', 1.082, y, 0.33, y + 0.17, 0.77, 'soft');
      for (let j = 0; j < 9; j++)
        k.line(
          [
            [1.083, y + 0.03, 0.38 + j * 0.035],
            [1.083, y + 0.14, 0.38 + j * 0.035],
          ],
          'faint',
        );
      k.circle([1.083, y + 0.12, 0.72], 0.012, 'x', 'soft', 10);
      k.circle([1.083, y + 0.06, 0.72], 0.012, 'x', 'faint', 10);
    }
    for (let i = 0; i < 14; i++)
      k.line(
        [
          [0.3, 0.2 + i * 0.11, 0.861],
          [1.0, 0.2 + i * 0.11, 0.861],
        ],
        'faint',
      );
  });
}

function trolley(k: Sketch): void {
  k.object('trolley', () => {
    for (const y of [0.22, DECK - 0.2]) k.box(1.45, y, 0.06, 2.53, y + 0.03, 1.06);
    for (const x of [1.46, 2.49])
      for (const z of [0.07, 1.02]) {
        k.box(x, 0.06, z, x + 0.03, DECK - 0.17, z + 0.03);
        k.ball(x + 0.015, 0.03, z + 0.015, 0.03);
      }
  });
}

/** The lead from the rack's foot to the recorder: along the floor, up the trolley's front leg,
 *  across the shelf and into the recorder's side. */
function lead(k: Sketch): void {
  cable(k, { name: 'rack-lead', r: 0.003, px: PX, pts: [[1.08, 0.014, 0.7], [1.16, FLOOR, 0.7], [1.16, FLOOR, 1.068], [1.475, FLOOR, 1.068], [1.475, 0.7, 1.068], [1.475, 0.7, 1.045], [1.65, 0.7, 1.045], [1.65, 0.7, 1.0]] }); // prettier-ignore
}

function recorder(k: Sketch): void {
  k.object('recorder', () => {
    k.box(1.52, DECK - 0.17, 0.12, 2.46, DECK, 1.0);
    k.rect('y', DECK + 0.001, PX0, PZ0, PX1, PZ1, 'soft');
    // The chart's grid: a time rule every few centimetres, use rules across.
    for (let i = 1; i < 14; i++)
      k.line(
        [
          [PX0 + i * 0.054, DECK + 0.001, PZ0],
          [PX0 + i * 0.05, DECK + 0.001, PZ1],
        ],
        'faint',
      );
    for (let i = 1; i < 6; i++)
      k.line(
        [
          [PX0, DECK + 0.001, PZ0 + i * 0.12],
          [PX1, DECK + 0.001, PZ0 + i * 0.12],
        ],
        'faint',
      );
    // The licence cap, dashed in the detail tone.
    for (let x = 0; x < 1; x += 0.08) k.line([at(x, CAP), at(Math.min(1, x + 0.045), CAP)], 'soft');
    // The paper roll at the back, the front panel's dial and switches.
    k.at([1.565, DECK + 0.045, 0.56], 0, () => k.cyl(0, -0.38, 0, 0.045, 0.76), Math.PI / 2);
    k.rect('x', 2.461, DECK - 0.14, 0.2, DECK - 0.03, 0.92, 'soft');
    for (const z of [0.28, 0.36]) k.circle([2.462, DECK - 0.085, z], 0.022, 'x', 'soft', 12);
  });
}

/** The pen's trace, solid while it records and dashed once it forecasts. */
function trace(k: Sketch): void {
  k.moving('trace', [0, 0, 0], () => {
    const n = USE.length - 1;
    const pts = USE.map((v, i) => at((i / n) * SPLIT, v));
    k.line(pts, 'hot');
    const last = USE[n] ?? 0;
    for (let i = 0; i < 6; i++) {
      const a = SPLIT + (i / 6) * (1 - SPLIT);
      const b = a + (0.55 / 6) * (1 - SPLIT);
      const v = (x: number): number => last + (CAP - 0.06 - last) * (1 - Math.exp(-3 * ((x - SPLIT) / (1 - SPLIT))));
      k.line([at(a, v(a)), at(b, v(b))], 'hot');
    }
  });
  k.moving('gantry', GANTRY, () => k.box(-0.02, DECK + 0.03, PZ0 - 0.02, 0.02, DECK + 0.06, PZ1 + 0.02));
  k.moving('pen', HEAD, () => k.box(-0.035, DECK + 0.004, -0.03, 0.035, DECK + 0.03, 0.03, { tier: 'hot' }));
}

export const visibilityScene: Small = {
  frame: FRAME,
  build(k) {
    floor(k);
    rack(k);
    trolley(k);
    recorder(k);
    lead(k);
    trace(k);
  },
  move(d, t) {
    const u = (t + 1.4) % CYCLE;
    const p = ease(0, 6.5, u) * (1 - ease(8.3, 8.8, u));
    const g = d.moving.get('trace');
    // The pen moves along the plot; the trace is shown as far as the pen has gone.
    if (g) reveal(g, p);
    const n = USE.length - 1;
    const x = p;
    const i = Math.min(n - 1, Math.floor((x / SPLIT) * n));
    const f = (x / SPLIT) * n - i;
    const v = x < SPLIT ? (USE[i] ?? 0) + ((USE[i + 1] ?? 0) - (USE[i] ?? 0)) * f : CAP - 0.1;
    const [px, , pz] = at(x, v);
    shift(d, 'gantry', GANTRY, [px - GANTRY[0], 0, 0]);
    shift(d, 'pen', HEAD, [px - HEAD[0], 0, pz - PZ1]);
  },
};
