import { box, dot, face, materials, seg, type Iso, type Swatch } from './swatch';

/** The study's parts for the `swatch-room` figure, each drawn back to front so its fills hide
 *  what is behind: the shell (floor, walls, window, poster, rug), the wall shelf, the bookcase,
 *  the desk and what is on it, the chair and a plant. */

export const SPAN = 10;
export const HEIGHT = 7;

export function shell(c: Iso, s: Swatch, t: number): void {
  const m = materials(s);
  box(c, 0, -0.3, 0, SPAN, 0.3, SPAN, m.paper);
  box(c, 0, 0, 0, SPAN, HEIGHT, 0.3, m.paper);
  box(c, 0, 0, 0, 0.3, HEIGHT, SPAN, m.paper);
  // Floorboards and the skirting line: the ink's quiet share.
  for (let z = 1.5; z < SPAN; z += 1.5) seg(c, [0.3, 0.005, z], [SPAN, 0.005, z], s.line);
  // The sun crosses the window slowly, and its patch of light walks across the floor.
  const sun = (t * 0.15) % 1;
  const z0 = 2.6 + sun * 3.2;
  face(
    c,
    [
      [0.4, 0.008, z0],
      [3.4, 0.008, z0 + 1.4],
      [3.4, 0.008, z0 + 4.4],
      [0.4, 0.008, z0 + 3],
    ],
    s['accent-soft'],
    0,
  );
  // The window on the left wall, with a sun in it.
  face(
    c,
    [
      [0.31, 2.8, 3],
      [0.31, 2.8, 6.4],
      [0.31, 5.6, 6.4],
      [0.31, 5.6, 3],
    ],
    s['ground-sunk'],
  );
  dot(c, [0.31, 3.6 + Math.sin(sun * Math.PI) * 1.6, 3.4 + sun * 2.6], 0.32, s.accent);
  seg(c, [0.31, 2.8, 4.7], [0.31, 5.6, 4.7], s.ink, 1.4);
  seg(c, [0.31, 4.2, 3], [0.31, 4.2, 6.4], s.ink, 1.4);
  // A poster on the back wall: the accent's softer shade with one full-strength mark.
  face(
    c,
    [
      [6.4, 3.4, 0.31],
      [8.8, 3.4, 0.31],
      [8.8, 5.9, 0.31],
      [6.4, 5.9, 0.31],
    ],
    s['accent-soft'],
  );
  dot(c, [7.6, 4.9, 0.31], 0.5, s.accent);
  seg(c, [6.8, 3.9, 0.31], [8.4, 3.9, 0.31], s.ink, 1.2);
  // The rug, in the secondary accent.
  face(
    c,
    [
      [4.6, 0.01, 4.8],
      [8.8, 0.01, 4.8],
      [8.8, 0.01, 8.8],
      [4.6, 0.01, 8.8],
    ],
    s['accent2-soft'],
  );
  seg(c, [4.9, 0.02, 5.2], [8.5, 0.02, 5.2], s.accent2, 1.6);
  seg(c, [4.9, 0.02, 8.4], [8.5, 0.02, 8.4], s.accent2, 1.6);
}

export function shelf(c: Iso, s: Swatch): void {
  const m = materials(s);
  box(c, 1.4, 5.0, 0.3, 3.6, 0.16, 0.9, m.paper);
  const books: [number, number, keyof ReturnType<typeof materials>][] = [
    [0.3, 0.9, 'ink'],
    [0.25, 0.75, 'paper'],
    [0.3, 1.0, 'accent'],
    [0.22, 0.8, 'ink'],
    [0.3, 0.7, 'paper'],
    [0.26, 0.95, 'accent2'],
  ];
  let x = 1.6;
  for (const [w, h, k] of books) {
    box(c, x, 5.16, 0.4, w, h, 0.65, m[k]);
    x += w + 0.06;
  }
}

export function bookcase(c: Iso, s: Swatch): void {
  const m = materials(s);
  box(c, 0.3, 0, 6.6, 1.2, 4.6, 3.0, m.paper);
  for (const y of [1.15, 2.3, 3.45]) seg(c, [1.5, y, 6.6], [1.5, y, 9.6], s.ink, 1.2);
  const fills = [s.ink, s['ink-muted'], s.ink, s.accent2, s['ink-muted'], s.ink];
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < 6; i++) {
      const z = 6.8 + i * 0.42 + (row % 2) * 0.1;
      const top = row * 1.15 + 0.85 - ((i * 7 + row) % 3) * 0.12;
      const fill = fills[(i + row * 2) % fills.length] ?? s.ink;
      face(
        c,
        [
          [1.5, row * 1.15 + 0.05, z],
          [1.5, row * 1.15 + 0.05, z + 0.32],
          [1.5, top, z + 0.32],
          [1.5, top, z],
        ],
        fill,
      );
    }
}

export function desk(c: Iso, s: Swatch, t: number): void {
  const m = materials(s);
  for (const [x, z] of [
    [1.3, 0.5],
    [5.6, 0.5],
    [1.3, 2.4],
    [5.6, 2.4],
  ] as const)
    box(c, x, 0, z, 0.2, 2.6, 0.2, m.ink);
  box(c, 1.2, 2.6, 0.3, 4.8, 0.25, 2.5, m.paper);
  // The lamp's pool of light on the desk, then everything on it, back to front.
  face(
    c,
    [
      [4.8, 2.86, 1.3],
      [5.9, 2.86, 1.3],
      [5.9, 2.86, 2.7],
      [4.8, 2.86, 2.7],
    ],
    s['accent-soft'],
    0,
  );
  box(c, 3.3, 2.85, 0.8, 0.3, 0.55, 0.3, m.ink);
  box(c, 2.0, 3.3, 0.7, 2.8, 1.8, 0.16, m.ink);
  const scr = 0.87;
  face(
    c,
    [
      [2.15, 3.45, scr],
      [4.65, 3.45, scr],
      [4.65, 4.95, scr],
      [2.15, 4.95, scr],
    ],
    s['ground-sunk'],
    0,
  );
  // Code scrolls up the screen, one line in four in the accent, and a cursor blinks.
  const LENS = [1.6, 2.2, 1.3, 1.9, 0.9, 2.1, 1.5];
  const scroll = Math.floor(t * 1.5);
  for (let i = 0; i < 5; i++) {
    const n = scroll + i;
    const len = LENS[n % LENS.length] ?? 1;
    const col = n % 4 === 0 ? s.accent : s['ink-muted'];
    seg(c, [2.4, 4.75 - i * 0.25, scr], [2.4 + len, 4.75 - i * 0.25, scr], col, 2);
  }
  if (Math.floor(t * 2) % 2 === 0) seg(c, [2.45, 3.5, scr], [2.45, 3.65, scr], s.accent, 2);
  box(c, 2.3, 2.85, 1.9, 2.0, 0.1, 0.6, m.paper);
  box(c, 1.5, 2.85, 1.7, 0.35, 0.45, 0.35, m.accent2);
  box(c, 5.3, 2.85, 0.5, 0.5, 0.12, 0.5, m.ink);
  seg(c, [5.55, 2.97, 0.75], [5.55, 4.7, 0.8], s.ink, 1.6);
  seg(c, [5.55, 4.7, 0.8], [5.5, 4.45, 1.5], s.ink, 1.6);
  box(c, 5.2, 4.0, 1.3, 0.6, 0.45, 0.6, m.accent);
}

export function chair(c: Iso, s: Swatch): void {
  const m = materials(s);
  box(c, 3.2, 0, 4.0, 0.25, 1.6, 0.25, m.ink);
  box(c, 2.6, 0, 3.5, 1.5, 0.12, 1.4, m.ink);
  box(c, 2.6, 1.6, 3.4, 1.5, 0.25, 1.5, m.ink);
  box(c, 2.6, 1.85, 4.7, 1.5, 2.1, 0.22, m.ink);
}

export function plant(c: Iso, s: Swatch, t: number): void {
  const m = materials(s);
  box(c, 8.0, 0, 1.4, 0.9, 1.0, 0.9, m.paper);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + Math.sin(t * 0.6) * 0.04;
    const r = 0.5 + (i % 3) * 0.15;
    const x = 8.45 + Math.cos(a) * r;
    const z = 1.85 + Math.sin(a) * r;
    const y = 1.9 + (i % 2) * 0.5;
    face(
      c,
      [
        [8.45, 1.0, 1.85],
        [x, y, z],
        [x + 0.2, y + 0.35, z + 0.2],
      ],
      s['ink-muted'],
    );
  }
}
