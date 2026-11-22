import { reveal } from './drawing/monodraw';
import type { Sketch } from './drawing/monoline';
import { cable } from './drawing/cable';
import { ease, floor, FRAME, legs, padlock, PX } from './expbase';
import type { Small } from './hiddenshared';

/** Claude Code, company-wide (`experience-icon`, adoption): IT's cabinet holds the managed policy
 *  behind a padlocked door, and floor trunking runs from it to a row of three engineers' desks,
 *  each with a monitor, keyboard, mouse and chair. The screens fill with terminal lines one desk
 *  after another while the lock stays shut: everyone works, under a policy nobody at a desk can
 *  open. */

const DESKS = [0.3, 1.08, 1.86];
const W = 0.74;
const TOP = 0.74;
/** The screen's face, where its lines sit a hair proud. */
const FACE = 1.381;
/** One beat: how long a screen takes to fill. */
const BEAT = 2.4;
const CYCLE = DESKS.length * BEAT + 2.6;
/** Seconds into the cycle the page opens on: every screen full, a moment before they clear and
 *  the first starts again (so 0.8 s and 2.6 s differ by three screens of lines, R-FIG-30). */
const OPEN = CYCLE - 1.8;

function cabinet(k: Sketch): void {
  k.object('it-cabinet', () => {
    k.box(0.12, 0, 0.18, 0.82, 0.07, 0.86);
    k.box(0.14, 0.07, 0.2, 0.8, 1.84, 0.84);
    // The door on the face toward the desks, its vents, the hinge side and the handle with its lock.
    k.rect('x', 0.801, 0.12, 0.24, 1.78, 0.8);
    for (let i = 0; i < 9; i++)
      k.line(
        [
          [0.802, 1.66 - i * 0.045, 0.32],
          [0.802, 1.66 - i * 0.045, 0.62],
        ],
        'faint',
      );
    for (let i = 0; i < 5; i++)
      k.line(
        [
          [0.802, 0.62 - i * 0.07, 0.32],
          [0.802, 0.62 - i * 0.07, 0.62],
        ],
        'faint',
      );
    for (const y of [0.3, 1.6]) k.box(0.8, y, 0.25, 0.815, y + 0.1, 0.28);
    k.box(0.8, 1.46, 0.7, 0.83, 1.7, 0.74);
    padlock(k, [0.83, 1.46, 0.72], 0, 1.35, 'hot');
    // The side's vent panel and the cable gland on top.
    k.rect('z', 0.841, 0.24, 0.3, 0.72, 1.7, 'faint');
    k.rect('y', 1.841, 0.3, 0.4, 0.64, 0.6, 'soft');
  });
}

function trunking(k: Sketch): void {
  k.object('trunking', () => {
    k.box(0.82, 0, 0.46, 1.52, 0.035, 0.56, { tier: 'soft' });
    k.box(1.42, 0, 0.56, 1.52, 0.035, 2.5, { tier: 'soft' });
  });
}

/** A lead up out of the trunking to each desk's grommet, hanging straight between the two. */
function risers(k: Sketch): void {
  DESKS.forEach((z, i) => cable(k, { name: `riser-${i}`, pts: [[1.47, 0.038, z + 0.3], [1.47, TOP - 0.033, z + 0.3]], r: 0.003, px: PX, tier: 'faint', plugs: [false, false] })); // prettier-ignore
}

function desk(k: Sketch, i: number, z: number): void {
  const c = z + W / 2;
  k.object(`desk-${i}`, () => {
    k.box(1.2, TOP - 0.03, z, 1.82, TOP, z + W);
    legs(k, 1.22, z + 0.02, 1.8, z + W - 0.02, TOP - 0.03);
    // The monitor: base, neck and screen, the screen's glass inset from its bezel.
    k.box(1.27, TOP, c - 0.1, 1.43, TOP + 0.015, c + 0.1);
    k.box(1.31, TOP + 0.015, c - 0.025, 1.34, 0.96, c + 0.025);
    k.box(1.34, 0.86, c - 0.3, 1.38, 1.26, c + 0.3);
    k.rect('x', FACE, 0.88, c - 0.28, 1.24, c + 0.28, 'soft');
    // The keyboard and its rows of keys, and the mouse.
    k.box(1.5, TOP, c - 0.23, 1.66, TOP + 0.025, c + 0.23);
    for (let r = 0; r < 4; r++) k.line([[1.52 + r * 0.035, TOP + 0.026, c - 0.21], [1.52 + r * 0.035, TOP + 0.026, c + 0.21]], 'faint'); // prettier-ignore
    k.box(1.54, TOP, c + 0.27, 1.62, TOP + 0.03, c + 0.32);
  });
  chair(k, i, c);
}

function chair(k: Sketch, i: number, c: number): void {
  const x = 2.16;
  k.object(`chair-${i}`, () => {
    k.box(1.95, 0.44, c - 0.22, 2.36, 0.5, c + 0.22);
    k.box(2.33, 0.56, c - 0.2, 2.39, 0.98, c + 0.2);
    k.box(2.34, 0.5, c - 0.03, 2.37, 0.56, c + 0.03);
    k.cyl(x, 0.12, c, 0.025, 0.32);
    k.cyl(x, 0.06, c, 0.05, 0.06);
    for (let a = 0; a < 5; a++) {
      const t = (a * Math.PI * 2) / 5 + 0.3;
      k.at([x, 0.06, c], t, () => k.box(0.05, 0, -0.018, 0.25, 0.035, 0.018));
      k.ball(x + Math.cos(t) * 0.24, 0.026, c - Math.sin(t) * 0.24, 0.025);
    }
  });
}

/** A screen's terminal: a prompt and a line of output per row, in the order they are typed. */
function terminal(k: Sketch, i: number, c: number): void {
  const lens = [0.4, 0.22, 0.44, 0.3, 0.16, 0.42, 0.26, 0.36];
  k.moving(`screen-${i}`, [0, 0, 0], () => {
    lens.forEach((l, r) => {
      const y = 1.205 - r * 0.04;
      const z0 = c - 0.25;
      if (r % 2 === 0)
        k.line(
          [
            [FACE, y + 0.011, z0],
            [FACE, y, z0 + 0.013],
            [FACE, y - 0.011, z0],
          ],
          'edge',
        );
      k.line(
        [
          [FACE, y, z0 + 0.035],
          [FACE, y, z0 + 0.035 + l * (r % 2 === 0 ? 1 : (1 + ((i + r) % 3)) / 3)],
        ],
        'edge',
      );
    });
  });
}

export const adoptionScene: Small = {
  frame: FRAME,
  build(k) {
    floor(k);
    cabinet(k);
    trunking(k);
    risers(k);
    DESKS.forEach((z, i) => {
      desk(k, i, z);
      terminal(k, i, z + W / 2);
    });
  },
  move(d, t) {
    const u = (t + OPEN) % CYCLE;
    const clear = 1 - ease(CYCLE - 0.8, CYCLE - 0.3, u);
    DESKS.forEach((_, i) => {
      const g = d.moving.get(`screen-${i}`);
      if (g) reveal(g, ease(i * BEAT, i * BEAT + BEAT * 0.9, u) * clear);
    });
  },
};
