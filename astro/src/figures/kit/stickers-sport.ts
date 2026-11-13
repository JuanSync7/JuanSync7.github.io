import type { Pt } from './brush';
import { ink } from './ink';
import { ell, hatch, line, wash, type Pen } from './stickers-pen';

/** Frisbee, badminton and swimming stickers (see `stickers.ts`). */

export function frisbee(p: Pen): void {
  const rim = ell(0.54, 0.55, 0.33, 0.15, -0.22, 0, Math.PI, 30).concat(
    ell(0.54, 0.49, 0.33, 0.15, -0.22, Math.PI, 0, 30),
  );
  wash(p, rim, ink.line(0.1));
  hatch(p, ell(0.54, 0.55, 0.33, 0.15, -0.22, 0, Math.PI, 30), 0.028, 0.35);
  wash(p, ell(0.54, 0.49, 0.33, 0.15, -0.22), ink.ground(0.0));
  line(p, ell(0.54, 0.49, 0.33, 0.15, -0.22), 2.6, 0.9, 1);
  line(p, ell(0.54, 0.55, 0.33, 0.15, -0.22, 0.05, Math.PI - 0.05, 30), 2.2, 0.85, 2);
  line(p, ell(0.54, 0.49, 0.22, 0.095, -0.22), 1.4, 0.5, 3);
  wash(p, ell(0.54, 0.49, 0.11, 0.048, -0.22), ink.signal(0.85));
  line(p, ell(0.54, 0.49, 0.11, 0.048, -0.22), 1.2, 0.7, 4);
  for (let k = 0; k < 3; k++)
    line(
      p,
      [
        [0.06, 0.4 + k * 0.08],
        [0.14, 0.41 + k * 0.08],
        [0.2, 0.43 + k * 0.08],
      ],
      1.8,
      0.55,
      10 + k,
    );
  line(p, ell(0.6, 0.6, 0.42, 0.3, -0.22, -2.6, -1.8, 12), 1.3, 0.35, 20);
}

export function badminton(p: Pen): void {
  const head = ell(0.36, 0.34, 0.17, 0.24, -0.62);
  hatch(p, head, 0.035, 0.28);
  line(p, head, 2.8, 0.9, 1);
  line(p, ell(0.36, 0.34, 0.15, 0.22, -0.62), 1, 0.5, 2);
  line(
    p,
    [
      [0.5, 0.52],
      [0.56, 0.6],
      [0.62, 0.66],
    ],
    2.4,
    0.9,
    3,
  );
  line(
    p,
    [
      [0.45, 0.55],
      [0.56, 0.6],
    ],
    1.6,
    0.8,
    4,
  );
  wash(
    p,
    [
      [0.6, 0.64],
      [0.79, 0.86],
      [0.75, 0.9],
      [0.57, 0.68],
    ],
    ink.line(0.75),
  );
  for (let k = 0; k < 4; k++)
    line(
      p,
      [
        [0.63 + k * 0.035, 0.7 + k * 0.04],
        [0.6 + k * 0.035, 0.73 + k * 0.04],
      ],
      1,
      0.3,
      5 + k,
    );
  // The shuttle flies down-left: cork first, the feather cone opening behind it.
  const [dx, dy, nx, ny] = [0.707, -0.707, 0.707, 0.707];
  const c: Pt = [0.66, 0.38];
  const at = (u: number, v: number): Pt => [c[0] + dx * u + nx * v, c[1] + dy * u + ny * v];
  const cork = ell(c[0], c[1], 0.06, 0.06, Math.PI / 4 + Math.PI / 2, 0, Math.PI, 16);
  wash(p, cork, ink.signal(0.85));
  line(p, [...cork, cork[0] ?? c], 1.8, 0.85, 9);
  const skirt: Pt[] = [at(0.02, -0.055), at(0.25, -0.12), at(0.25, 0.12), at(0.02, 0.055)];
  hatch(p, skirt, 0.04, 0.22);
  for (let k = 0; k <= 6; k++) {
    const v = -1 + (2 * k) / 6;
    line(p, [at(0.02, v * 0.055), at(0.25, v * 0.12)], k % 6 ? 1 : 1.7, k % 6 ? 0.5 : 0.85, 30 + k);
  }
  const rim = Array.from({ length: 25 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return at(0.25 + Math.sin(a) * 0.035, Math.cos(a) * 0.12);
  });
  line(p, rim, 1.5, 0.8, 40);
  line(p, [at(0.1, -0.085), at(0.1, 0.085)], 1, 0.6, 41);
  for (let k = 0; k < 3; k++)
    line(p, [at(-0.1 - k * 0.04, 0.02 * k - 0.02), at(-0.14 - k * 0.04, 0.02 * k - 0.02)], 1, 0.4, 42 + k);
}

export function swimming(p: Pen): void {
  for (let k = 0; k < 3; k++) {
    const y = 0.66 + k * 0.1;
    const wave: Pt[] = Array.from({ length: 30 }, (_, i) => [0.06 + i * 0.03, y + Math.sin(i * 0.7 + k) * 0.025]);
    line(p, wave, 2.2 - k * 0.4, 0.85 - k * 0.2, 50 + k);
  }
  hatch(
    p,
    [
      [0.06, 0.7],
      [0.94, 0.7],
      [0.94, 0.92],
      [0.06, 0.92],
    ],
    0.045,
    0.22,
  );
  line(p, ell(0.5, 0.36, 0.42, 0.2, 0, Math.PI * 1.05, Math.PI * 1.95, 30), 2, 0.6, 1);
  for (const [cx, sig] of [
    [0.34, true],
    [0.66, false],
  ] as const) {
    const lens = ell(cx, 0.4, 0.13, 0.1, 0);
    wash(p, lens, sig ? ink.signal(0.8) : ink.line(0.18));
    hatch(p, ell(cx, 0.4, 0.11, 0.08, 0, 0, Math.PI, 16), 0.03, 0.4);
    line(p, lens, 2.8, 0.9, cx * 10);
    line(p, ell(cx - 0.04, 0.37, 0.04, 0.025, 0, Math.PI, Math.PI * 1.6, 8), 1.4, 0.8, cx * 20);
  }
  line(
    p,
    [
      [0.47, 0.38],
      [0.5, 0.35],
      [0.53, 0.38],
    ],
    2.2,
    0.9,
    7,
  );
  line(p, ell(0.5, 0.42, 0.44, 0.1, 0, -0.1, Math.PI * 0.08, 6), 1.6, 0.6, 8);
  for (const [x, y] of [
    [0.2, 0.58],
    [0.82, 0.56],
    [0.74, 0.6],
  ] as const)
    line(p, ell(x, y, 0.012, 0.016), 1.4, 0.7, x * 99);
}
