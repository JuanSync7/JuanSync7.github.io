import type { Pt } from './brush';
import { ink } from './ink';
import { ell, line, wash, type Hobby, type Pen } from './stickers-pen';

/** Grass under the disc, a flight arc, a net strip, a lane rope, a music stand's ledger and
 *  the suitcase's travel patches: the second pass of detail on each sticker. */
function tufts(p: Pen, y: number, x0: number, x1: number): void {
  for (let x = x0; x < x1; x += 0.045) {
    const h = 0.03 + 0.03 * (0.5 + 0.5 * p.noise(x * 20, 1));
    line(
      p,
      [
        [x, y],
        [x + 0.008, y - h * 0.6],
        [x + 0.02, y - h],
      ],
      1,
      0.55,
      x * 40,
    );
  }
}

export const MORE: Record<Hobby, (p: Pen) => void> = {
  frisbee: (p) => {
    line(
      p,
      [
        [0.08, 0.86],
        [0.92, 0.84],
      ],
      1.6,
      0.6,
      70,
    );
    tufts(p, 0.86, 0.1, 0.9);
    for (let k = 0; k < 7; k++)
      line(
        p,
        ell(0.5, 0.95, 0.5, 0.62, 0, Math.PI * (1.06 + k * 0.06), Math.PI * (1.09 + k * 0.06), 3),
        1.1,
        0.4,
        80 + k,
      );
  },
  badminton: (p) => {
    line(
      p,
      [
        [0.05, 0.82],
        [0.95, 0.8],
      ],
      1.8,
      0.75,
      70,
    );
    line(
      p,
      [
        [0.05, 0.94],
        [0.95, 0.92],
      ],
      1.2,
      0.5,
      71,
    );
    for (let x = 0.08; x < 0.95; x += 0.06)
      line(
        p,
        [
          [x, 0.82],
          [x - 0.004, 0.935],
        ],
        0.8,
        0.35,
        x * 30,
      );
    for (let k = 0; k < 6; k++)
      line(
        p,
        ell(0.55, 0.48, 0.32, 0.26, 0, Math.PI * (1.55 + k * 0.05), Math.PI * (1.58 + k * 0.05), 3),
        1.1,
        0.4,
        90 + k,
      );
  },
  swimming: (p) => {
    line(
      p,
      [
        [0.04, 0.62],
        [0.96, 0.6],
      ],
      1,
      0.55,
      70,
    );
    for (let x = 0.08; x < 0.95; x += 0.08) {
      const f = ell(x, 0.615 - x * 0.02, 0.026, 0.018);
      p.ctx.fillStyle = ink.line(0.2);
      wash(p, f, ink.line(0.22));
      line(p, f, 1.2, 0.7, x * 50);
    }
  },
  piano: (p) => {
    line(
      p,
      [
        [0.2, 0.06],
        [0.82, 0.03],
      ],
      1,
      0.4,
      70,
    );
    line(
      p,
      [
        [0.2, 0.12],
        [0.82, 0.09],
      ],
      1,
      0.4,
      71,
    );
    line(
      p,
      [
        [0.2, 0.18],
        [0.82, 0.15],
      ],
      1,
      0.4,
      72,
    );
    for (let k = 0; k < 3; k++) line(p, ell(0.24 + k * 0.035, 0.42 - k * 0.04, 0.012, 0.012), 1.1, 0.5, 73 + k);
  },
  travelling: (p) => {
    wash(p, ell(0.25, 0.48, 0.035, 0.035), ink.line(0.55));
    line(p, ell(0.25, 0.48, 0.035, 0.035), 1.2, 0.8, 70);
    const patch: Pt[] = [
      [0.42, 0.66],
      [0.55, 0.64],
      [0.56, 0.72],
      [0.43, 0.74],
    ];
    wash(p, patch, ink.ground(0.0));
    line(p, [...patch, patch[0] ?? [0, 0]], 1.3, 0.75, 71);
    line(
      p,
      [
        [0.45, 0.68],
        [0.53, 0.67],
      ],
      0.8,
      0.5,
      72,
    );
    line(
      p,
      [
        [0.46, 0.71],
        [0.51, 0.7],
      ],
      0.8,
      0.5,
      73,
    );
    line(
      p,
      [
        [0.12, 0.95],
        [0.88, 0.95],
      ],
      1.4,
      0.5,
      74,
    );
  },
};
