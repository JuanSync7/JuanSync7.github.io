import type { Sketch, V3 } from './drawing/monoline';
import { ease, floor, FRAME, padlock, shift } from './expbase';
import type { Small } from './hiddenshared';

/** Company knowledge (`experience-icon`, knowledge): the company's archive, a tall four-drawer
 *  filing cabinet, beside two smaller cabinets, one per customer project, each shut by a locking
 *  bar and a padlock. One drawer of the archive slides out on its runners and a document lifts from
 *  its hanging folders, then goes back: one base the whole company draws from, and private ones
 *  nobody else opens. */

const [X0, X1, Z0, Z1, H] = [0.7, 1.4, 0.32, 0.92, 1.46];
/** The drawers' bands, top to bottom, and which one opens. */
const BANDS: [number, number][] = [
  [1.12, 1.43],
  [0.78, 1.1],
  [0.44, 0.76],
  [0.08, 0.42],
];
const OPEN = 2;
const OUT = 0.55;
const SHEET: V3 = [1.0, 0.47, 0.62];
const CYCLE = 8;

function front(k: Sketch, x: number, a: number, b: number, z0: number, z1: number): void {
  k.box(x - 0.03, a, z0, x, b, z1);
  const mid = (z0 + z1) / 2;
  k.box(x, b - 0.1, mid - 0.1, x + 0.025, b - 0.075, mid + 0.1);
  k.rect('x', x + 0.001, b - 0.06, mid - 0.06, b - 0.025, mid + 0.06, 'soft');
}

function archive(k: Sketch): void {
  k.object('archive', () => {
    k.box(X0, 0, Z0, X1, 0.06, Z1);
    k.box(X0, 0.06, Z0, X1 - 0.03, H, Z0 + 0.02);
    k.box(X0, 0.06, Z1 - 0.02, X1 - 0.03, H, Z1);
    k.box(X0, H - 0.03, Z0 + 0.02, X1 - 0.03, H, Z1 - 0.02);
    k.box(X0, 0.06, Z0 + 0.02, X0 + 0.02, H - 0.03, Z1 - 0.02);
    // Every band but the open one is filled; the open one is a cavity the drawer runs in.
    const [oa, ob] = BANDS[OPEN] ?? [0, 0];
    k.box(X0 + 0.02, 0.06, Z0 + 0.02, X1 - 0.03, oa - 0.02, Z1 - 0.02);
    k.box(X0 + 0.02, ob + 0.02, Z0 + 0.02, X1 - 0.03, H - 0.03, Z1 - 0.02);
    BANDS.forEach(([a, b], i) => i !== OPEN && front(k, X1, a, b, Z0 + 0.02, Z1 - 0.02));
    k.rect('y', H + 0.001, X0 + 0.08, Z0 + 0.08, X1 - 0.1, Z1 - 0.08, 'faint');
  });
}

function drawer(k: Sketch): void {
  const [a, b] = BANDS[OPEN] ?? [0, 0];
  const [z0, z1] = [Z0 + 0.03, Z1 - 0.03];
  k.moving('drawer', [0, 0, 0], () => {
    front(k, X1, a - 0.02, b + 0.02, Z0 + 0.02, Z1 - 0.02);
    k.box(X0 + 0.05, a - 0.01, z0, X1 - 0.03, a + 0.01, z1);
    k.box(X0 + 0.05, a + 0.01, z0, X1 - 0.03, b - 0.08, z0 + 0.015);
    k.box(X0 + 0.05, a + 0.01, z1 - 0.015, X1 - 0.03, b - 0.08, z1);
    k.box(X0 + 0.05, a + 0.01, z0 + 0.015, X0 + 0.07, b - 0.08, z1 - 0.015);
    // Hanging folders on their rails, each with a tab, leaving a gap where the document stands.
    for (const z of [z0 + 0.005, z1 - 0.02]) k.box(X0 + 0.07, b - 0.08, z, X1 - 0.03, b - 0.07, z + 0.015);
    [0.78, 0.84, 0.9, 0.95, 1.07, 1.13, 1.19, 1.25].forEach((x, i) => {
      k.box(x, a + 0.03, z0 + 0.03, x + 0.008, b - 0.09, z1 - 0.03, { tier: 'soft' });
      const tz = z0 + 0.06 + (i % 3) * 0.14;
      k.box(x, b - 0.09, tz, x + 0.008, b - 0.06, tz + 0.1, { tier: 'soft' });
    });
  });
  k.moving('sheet', SHEET, () => {
    k.box(-0.004, 0, -0.11, 0.004, 0.24, 0.11, { tier: 'hot' });
    for (let r = 0; r < 6; r++) {
      const y = 0.2 - r * 0.028;
      k.line(
        [
          [0.005, y, -0.085],
          [0.005, y, -0.085 + (r % 3 === 2 ? 0.09 : 0.17)],
        ],
        'hot',
      );
    }
  });
}

/** A customer project's cabinet: two drawers, a locking bar down their fronts and its padlock. */
function project(k: Sketch, name: string, z0: number): void {
  const [x0, x1, z1, h] = [0.78, 1.3, z0 + 0.5, 0.74];
  k.object(name, () => {
    k.box(x0, 0, z0, x1 - 0.03, h, z1);
    k.box(x0, 0, z0, x1, 0.05, z1);
    front(k, x1, 0.07, 0.4, z0 + 0.02, z1 - 0.02);
    front(k, x1, 0.41, h - 0.01, z0 + 0.02, z1 - 0.02);
    const m = z0 + 0.06;
    k.box(x1 + 0.025, 0.04, m - 0.02, x1 + 0.045, h + 0.02, m + 0.02);
    k.box(x1, h - 0.05, m - 0.03, x1 + 0.045, h - 0.01, m + 0.03);
    padlock(k, [x1 + 0.045, h - 0.06, m], 0, 0.9);
    k.rect('y', h + 0.001, x0 + 0.06, z0 + 0.1, x1 - 0.1, z1 - 0.1, 'faint');
  });
}

export const knowledgeScene: Small = {
  frame: FRAME,
  build(k) {
    floor(k);
    archive(k);
    drawer(k);
    project(k, 'project-a', 1.34);
    project(k, 'project-b', 1.98);
  },
  move(d, t) {
    const u = (t + 1.2) % CYCLE;
    const out = OUT * ease(0, 1.1, u) * (1 - ease(6.9, 7.8, u));
    const lift = 0.42 * ease(1.3, 2.4, u) * (1 - ease(5.6, 6.7, u));
    shift(d, 'drawer', [0, 0, 0], [out, 0, 0]);
    shift(d, 'sheet', SHEET, [out, lift, 0]);
  },
};
