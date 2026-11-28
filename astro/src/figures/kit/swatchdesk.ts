import { at, box, dot, face, materials, seg, type Iso, type Swatch, type V3 } from './swatch';

/** The parts of the `swatch-desk` figure, a coder's desk beside a server rack, drawn back to
 *  front so fills hide what is behind: plinth, rack, desk with an ultrawide chat screen and a
 *  portrait code screen, keyboard, the PC tower with a glass side, the chair, the cables. */

export const SPAN = 10;
export const HEIGHT = 7.2;
export const DEPTH = 7.4;

export function plinth(c: Iso, s: Swatch): void {
  box(c, 0, -0.3, 0, SPAN, 0.3, DEPTH, materials(s).paper);
  for (let k = 2; k < SPAN; k += 2) seg(c, [k, 0.005, 0], [k, 0.005, DEPTH], s.line);
  for (let k = 2; k < DEPTH; k += 2) seg(c, [0, 0.005, k], [SPAN, 0.005, k], s.line);
}

/** A 42U rack: eight servers, each with two lights that blink in their own rhythm. */
export function rack(c: Iso, s: Swatch, t: number): void {
  const m = materials(s);
  box(c, 7.8, 0, 0.6, 1.7, 6.2, 1.7, m.ink);
  const zf = 2.31;
  for (let u = 0; u < 8; u++) {
    const y = 0.5 + u * 0.68;
    face(
      c,
      [
        [7.95, y, zf],
        [9.35, y, zf],
        [9.35, y + 0.52, zf],
        [7.95, y + 0.52, zf],
      ],
      s['ground-raised'],
      0.8,
    );
    seg(c, [8.1, y + 0.26, zf], [8.8, y + 0.26, zf], s.line, 1);
    const on = Math.sin(t * (2.2 + u * 0.7) + u * 1.3) > 0;
    dot(c, [9.05, y + 0.26, zf], 0.1, on ? s.accent : s['ink-faint']);
    dot(c, [9.22, y + 0.26, zf], 0.1, u % 3 === 0 ? s.accent2 : s['ink-faint']);
  }
}

export function desk(c: Iso, s: Swatch, t: number): void {
  const m = materials(s);
  box(c, 0.9, 0, 1.2, 0.2, 2.6, 2.6, m.ink);
  box(c, 6.3, 0, 1.2, 0.2, 2.6, 2.6, m.ink);
  box(c, 0.7, 2.6, 0.9, 6.0, 0.22, 3.2, m.paper);
  // The ultrawide, with a chat streaming in, and its screen bar.
  box(c, 3.2, 2.82, 1.5, 0.4, 0.5, 0.3, m.ink);
  box(c, 1.1, 3.3, 1.3, 4.4, 1.7, 0.16, m.ink);
  box(c, 2.2, 5.0, 1.25, 2.2, 0.12, 0.2, m.accent);
  const z = 1.47;
  face(
    c,
    [
      [1.25, 3.45, z],
      [5.35, 3.45, z],
      [5.35, 4.85, z],
      [1.25, 4.85, z],
    ],
    s['ground-sunk'],
    0,
  );
  const shown = Math.floor(t * 0.9) % 5;
  for (let i = 0; i < 4; i++) {
    const mine = i % 2 === 1;
    const y = 4.55 - i * 0.3;
    const len = [1.6, 1.1, 2.0, 0.9][i] ?? 1;
    const x0 = mine ? 5.15 - len : 1.45;
    if (i <= shown)
      face(
        c,
        [
          [x0, y, z],
          [x0 + len, y, z],
          [x0 + len, y + 0.24, z],
          [x0, y + 0.24, z],
        ],
        mine ? s.accent : s['ink-faint'],
        0,
      );
  }
  // The portrait screen of code.
  box(c, 5.75, 2.82, 1.6, 0.3, 0.4, 0.3, m.ink);
  box(c, 5.45, 3.2, 1.4, 1.0, 2.3, 0.16, m.ink);
  const zp = 1.57;
  face(
    c,
    [
      [5.55, 3.32, zp],
      [6.35, 3.32, zp],
      [6.35, 5.4, zp],
      [5.55, 5.4, zp],
    ],
    s['ground-sunk'],
    0,
  );
  for (let i = 0; i < 7; i++) {
    const len = 0.2 + ((i * 5 + Math.floor(t)) % 4) * 0.13;
    seg(c, [5.65, 5.2 - i * 0.26, zp], [5.65 + len, 5.2 - i * 0.26, zp], i === 2 ? s.accent : s['ink-muted'], 1.6);
  }
  // Keyboard, mouse and a mug.
  box(c, 2.0, 2.82, 2.7, 2.6, 0.1, 0.8, m.paper);
  for (let r = 1; r < 4; r++) seg(c, [2.1, 2.93, 2.7 + r * 0.2], [4.5, 2.93, 2.7 + r * 0.2], s.line);
  dot(c, [2.2, 2.93, 2.8], 0.06, s.accent);
  box(c, 5.0, 2.82, 2.9, 0.3, 0.1, 0.45, m.paper);
  box(c, 0.95, 2.82, 2.6, 0.35, 0.45, 0.35, m.accent2);
}

/** The tower: an ink case, a glass side with three fans whose rings turn. */
export function tower(c: Iso, s: Swatch, t: number): void {
  const m = materials(s);
  box(c, 7.0, 0, 3.0, 1.1, 2.5, 2.3, m.ink);
  const zg = 5.31;
  face(
    c,
    [
      [7.1, 0.15, zg],
      [8.0, 0.15, zg],
      [8.0, 2.35, zg],
      [7.1, 2.35, zg],
    ],
    s['ground-sunk'],
    0.8,
  );
  for (let f = 0; f < 3; f++) {
    const cy = 0.55 + f * 0.65;
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + t * 2.5;
      dot(c, [7.55 + Math.cos(a) * 0.22, cy + Math.sin(a) * 0.22, zg], 0.035, f === 1 ? s.accent : s.accent2);
    }
  }
}

export function chair(c: Iso, s: Swatch): void {
  const m = materials(s);
  box(c, 3.1, 0, 5.2, 1.8, 0.12, 1.6, m.ink);
  box(c, 3.85, 0.12, 5.85, 0.25, 1.45, 0.25, m.ink);
  box(c, 3.1, 1.55, 5.0, 1.8, 0.25, 1.7, m.ink);
  box(c, 3.1, 1.8, 6.5, 1.8, 2.4, 0.22, m.ink);
}

/** Cables from the rack to the tower along the floor: two in ink, one jumper in the accent with
 *  a packet travelling along it. */
export function cables(c: Iso, s: Swatch, t: number): void {
  const runs: [V3[], string][] = [
    [
      [
        [8.3, 0.4, 2.3],
        [8.3, 0.03, 2.6],
        [7.4, 0.03, 2.8],
        [7.4, 0.3, 3.0],
      ],
      s.ink,
    ],
    [
      [
        [8.6, 0.4, 2.3],
        [8.6, 0.03, 2.75],
        [7.7, 0.03, 2.95],
        [7.7, 0.4, 3.0],
      ],
      s['ink-muted'],
    ],
    [
      [
        [9.0, 1.2, 2.3],
        [9.3, 0.03, 2.9],
        [9.0, 0.03, 4.2],
        [8.1, 0.6, 4.2],
      ],
      s.accent,
    ],
  ];
  for (const [pts, col] of runs) for (let i = 1; i < pts.length; i++) seg(c, pts[i - 1] as V3, pts[i] as V3, col, 1.6);
  const jumper = runs[2]?.[0] ?? [];
  const k = (t * 0.4) % 1;
  const leg = Math.min(jumper.length - 2, Math.floor(k * (jumper.length - 1)));
  const a = jumper[leg];
  const b = jumper[leg + 1];
  if (!a || !b) return;
  const u = k * (jumper.length - 1) - leg;
  const p: V3 = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  const [x, y] = at(c, p);
  c.ctx.fillStyle = s.accent;
  c.ctx.beginPath();
  c.ctx.arc(x, y, Math.max(2, c.s * 0.1), 0, Math.PI * 2);
  c.ctx.fill();
}
