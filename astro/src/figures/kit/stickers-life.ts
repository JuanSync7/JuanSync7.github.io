import type { Pt } from './brush';
import { ink } from './ink';
import { ell, hatch, line, wash, type Pen } from './stickers-pen';

/** Piano and travelling stickers (see `stickers.ts`). */

export function piano(p: Pen): void {
  const k0: Pt = [0.08, 0.56];
  const dx: Pt = [0.105, -0.02];
  const dy: Pt = [0.07, 0.17];
  const at = (i: number, j: number): Pt => [k0[0] + dx[0] * i + dy[0] * j, k0[1] + dx[1] * i + dy[1] * j];
  wash(p, [at(0, 1), at(8, 1), [at(8, 1)[0], at(8, 1)[1] + 0.06], [at(0, 1)[0], at(0, 1)[1] + 0.06]], ink.line(0.3));
  line(p, [at(0, 0), at(8, 0), at(8, 1), at(0, 1), at(0, 0)], 2.6, 0.9, 1);
  for (let i = 1; i < 8; i++) line(p, [at(i, 0), at(i, 1)], 1.3, 0.6, 2 + i);
  wash(p, [at(4, 0), at(5, 0), at(5, 1), at(4, 1)], ink.signal(0.8));
  for (const i of [1, 2, 4, 5, 6]) {
    const b = [at(i - 0.3, 0), at(i + 0.3, 0), at(i + 0.3, 0.6), at(i - 0.3, 0.6)];
    wash(p, b, ink.line(0.85));
  }
  line(p, [at(0, 1), [at(0, 1)[0], at(0, 1)[1] + 0.06], [at(8, 1)[0], at(8, 1)[1] + 0.06], at(8, 1)], 2, 0.8, 20);
  const head = ell(0.62, 0.34, 0.05, 0.035, -0.4);
  wash(p, head, ink.line(0.85));
  line(
    p,
    [
      [0.665, 0.33],
      [0.665, 0.12],
    ],
    1.8,
    0.9,
    21,
  );
  line(
    p,
    [
      [0.665, 0.12],
      [0.72, 0.17],
      [0.74, 0.24],
    ],
    1.8,
    0.85,
    22,
  );
  const head2 = ell(0.36, 0.3, 0.045, 0.032, -0.4);
  wash(p, head2, ink.line(0.85));
  line(
    p,
    [
      [0.4, 0.29],
      [0.4, 0.1],
      [0.66, 0.08],
    ],
    1.6,
    0.8,
    23,
  );
}

export function travelling(p: Pen): void {
  const body: Pt[] = [
    [0.18, 0.36],
    [0.62, 0.36],
    [0.62, 0.86],
    [0.18, 0.86],
  ];
  wash(p, body, ink.line(0.08));
  hatch(
    p,
    [
      [0.5, 0.36],
      [0.62, 0.36],
      [0.62, 0.86],
      [0.5, 0.86],
    ],
    0.03,
    0.35,
  );
  line(p, [...body, body[0] ?? [0, 0]], 2.8, 0.9, 1);
  for (const x of [0.3, 0.4])
    line(
      p,
      [
        [x, 0.38],
        [x, 0.84],
      ],
      1.3,
      0.55,
      x * 50,
    );
  line(
    p,
    [
      [0.32, 0.36],
      [0.32, 0.26],
      [0.48, 0.26],
      [0.48, 0.36],
    ],
    2.2,
    0.85,
    3,
  );
  for (const x of [0.24, 0.56]) line(p, ell(x, 0.9, 0.03, 0.03), 1.8, 0.85, x * 70);
  const tag: Pt[] = [
    [0.66, 0.5],
    [0.76, 0.46],
    [0.8, 0.56],
    [0.7, 0.6],
  ];
  wash(p, tag, ink.signal(0.85));
  line(p, [...tag, tag[0] ?? [0, 0]], 1.4, 0.8, 4);
  line(
    p,
    [
      [0.6, 0.42],
      [0.66, 0.5],
    ],
    1,
    0.7,
    5,
  );
  const plane: Pt[] = [
    [0.7, 0.12],
    [0.94, 0.06],
    [0.78, 0.24],
  ];
  wash(p, plane, ink.ground(0.0));
  line(p, [...plane, plane[0] ?? [0, 0]], 1.8, 0.85, 6);
  line(
    p,
    [
      [0.94, 0.06],
      [0.76, 0.17],
    ],
    1,
    0.6,
    7,
  );
  for (let k = 0; k < 5; k++) {
    const u = k / 5;
    line(
      p,
      ell(0.56, 0.24, 0.16, 0.1, 0, Math.PI * (0.9 + u * 0.9), Math.PI * (0.9 + u * 0.9 + 0.1), 4),
      1.1,
      0.45,
      60 + k,
    );
  }
}
