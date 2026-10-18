import type { Box, Sketch, Tone } from './sketch';

/** Furniture seen from above for floor plans (`kit/rooms.ts`), the way an architect draws
 *  it: beds with pillows and nightstands, sofas, armchairs, coffee and dining tables with
 *  their chairs, kitchen runs with a sink and a hob, baths, toilets and basins, desks with
 *  a screen and a chair, wardrobes, rugs and plants. Each piece is drawn in its own frame,
 *  centred, its back toward -y, and turned in quarter turns to face into a room; `furnish`
 *  lays out a room by what it is for. Sizes are in metres; `M` is a metre on the plan. */

const METRE = 0.1;
export const ROOMS = [
  'bedroom',
  'living',
  'kitchen',
  'dining',
  'bath',
  'study',
  'office',
  'meeting',
  'wc',
  'stair',
  'store',
] as const;
export type Room = (typeof ROOMS)[number];

/** A pen in a piece's own frame: (x, y) in metres from its centre, turned by `turn`
 *  quarter turns, placed at (cx, cy). */
class Piece {
  constructor(
    private readonly S: Sketch,
    private readonly cx: number,
    private readonly cy: number,
    private readonly turn: number,
    private readonly m: number,
  ) {}
  private at(x: number, y: number): [number, number] {
    const [u, v] = [
      [x, y],
      [-y, x],
      [-x, -y],
      [y, -x],
    ][((this.turn % 4) + 4) % 4] ?? [x, y];
    return [this.cx + u * this.m, this.cy + v * this.m];
  }
  seg(x0: number, y0: number, x1: number, y1: number, t: Tone = 2): void {
    const [a, b] = [this.at(x0, y0), this.at(x1, y1)];
    this.S.seg(a[0], a[1], b[0], b[1], t);
  }
  rect(x0: number, y0: number, x1: number, y1: number, t: Tone = 2): void {
    this.seg(x0, y0, x1, y0, t);
    this.seg(x1, y0, x1, y1, t);
    this.seg(x1, y1, x0, y1, t);
    this.seg(x0, y1, x0, y0, t);
  }
  circle(x: number, y: number, r: number, t: Tone = 2, a0 = 0, a1 = Math.PI * 2): void {
    const n = r > 0.3 ? 16 : 10;
    for (let i = 0; i < n; i++) {
      const [a, b] = [a0 + ((a1 - a0) * i) / n, a0 + ((a1 - a0) * (i + 1)) / n];
      this.seg(x + Math.cos(a) * r, y + Math.sin(a) * r, x + Math.cos(b) * r, y + Math.sin(b) * r, t);
    }
  }
}

/** A chair at (x, y) facing +y: the seat and its back. */
const chair = (p: Piece, x: number, y: number, flip = false): void => {
  p.rect(x - 0.22, y - 0.2, x + 0.22, y + 0.2);
  p.seg(x - 0.22, y + (flip ? 0.2 : -0.2), x + 0.22, y + (flip ? 0.2 : -0.2), 1);
};

export const PIECES = {
  bed: (p: Piece, double = true): void => {
    const w = double ? 0.8 : 0.45;
    p.rect(-w, -1, w, 1, 1);
    for (const x of double ? [-0.4, 0.4] : [0]) p.rect(x - 0.32, -0.92, x + 0.32, -0.62);
    p.seg(-w, -0.3, w, -0.3);
    p.seg(-w, -0.3, -w + 0.4, -0.05);
    for (const x of [-w - 0.3, w + 0.3]) {
      p.rect(x - 0.22, -1, x + 0.22, -0.56);
      p.circle(x, -0.78, 0.1);
    }
  },
  sofa: (p: Piece, len = 2.2): void => {
    const h = len / 2;
    p.rect(-h, -0.45, h, 0.45, 1);
    p.rect(-h, -0.45, h, -0.2);
    p.rect(-h, -0.2, -h + 0.2, 0.45);
    p.rect(h - 0.2, -0.2, h, 0.45);
    for (let x = -h + 0.2; x < h - 0.3; x += (len - 0.4) / 3) p.seg(x, -0.2, x, 0.45);
  },
  armchair: (p: Piece): void => {
    p.rect(-0.45, -0.45, 0.45, 0.45, 1);
    p.rect(-0.45, -0.45, 0.45, -0.25);
    p.rect(-0.45, -0.25, -0.3, 0.45);
    p.rect(0.3, -0.25, 0.45, 0.45);
  },
  table: (p: Piece, seats: number, round = false): void => {
    if (round) {
      p.circle(0, 0, 0.5, 1);
      for (let i = 0; i < seats; i++) {
        const a = (i / seats) * Math.PI * 2;
        p.circle(Math.cos(a) * 0.78, Math.sin(a) * 0.78, 0.2);
      }
      return;
    }
    const half = Math.max(1, seats / 2) * 0.32;
    p.rect(-half, -0.45, half, 0.45, 1);
    for (let i = 0; i < seats / 2; i++) {
      const x = -half + 0.32 + i * 0.64;
      chair(p, x, -0.72);
      chair(p, x, 0.72, true);
    }
  },
  kitchen: (p: Piece, len: number): void => {
    const h = len / 2;
    p.rect(-h, -0.3, h, 0.3, 1);
    p.rect(-h + 0.3, -0.2, -h + 0.75, 0.18);
    p.rect(-h + 0.8, -0.2, -h + 1.25, 0.18);
    for (const [x, y] of [
      [0.25, -0.12],
      [0.55, -0.12],
      [0.25, 0.14],
      [0.55, 0.14],
    ] as const)
      p.circle(Math.min(h - 0.6, x + 0.3), y, 0.1);
    p.rect(h - 0.7, -0.35, h, 0.35, 1);
    p.seg(h - 0.7, -0.35, h, 0.35);
  },
  bath: (p: Piece): void => {
    p.rect(-0.85, -0.38, 0.85, 0.38, 1);
    p.rect(-0.75, -0.28, 0.75, 0.28);
    p.circle(0.6, 0, 0.05);
  },
  toilet: (p: Piece): void => {
    p.rect(-0.2, -0.35, 0.2, -0.15, 1);
    p.circle(0, 0.08, 0.2);
  },
  basin: (p: Piece): void => {
    p.rect(-0.3, -0.25, 0.3, 0.2, 1);
    p.circle(0, -0.02, 0.14);
  },
  desk: (p: Piece): void => {
    p.rect(-0.7, -0.35, 0.7, 0.35, 1);
    p.seg(-0.3, -0.2, 0.3, -0.2, 1);
    p.rect(-0.2, -0.15, 0.2, -0.05);
    p.circle(0, 0.6, 0.24);
    p.circle(0, 0.6, 0.3, 2, Math.PI * 0.15, Math.PI * 0.85);
  },
  wardrobe: (p: Piece, len: number): void => {
    p.rect(-len / 2, -0.3, len / 2, 0.3, 1);
    for (let x = -len / 2 + 0.5; x < len / 2 - 0.1; x += 0.5) p.seg(x, -0.3, x, 0.3);
    p.seg(-len / 2, 0, len / 2, 0);
  },
  plant: (p: Piece): void => {
    p.circle(0, 0, 0.22);
    for (let i = 0; i < 6; i++) p.seg(0, 0, Math.cos(i * 1.05) * 0.32, Math.sin(i * 1.05) * 0.32);
  },
  rug: (p: Piece, w: number, h: number): void => {
    p.rect(-w / 2, -h / 2, w / 2, h / 2);
    p.rect(-w / 2 + 0.1, -h / 2 + 0.1, w / 2 - 0.1, h / 2 - 0.1);
  },
};

/** Lay out room r (its door at the top-left corner) for what it is for, M plan units to a
 *  metre. */
export function furnish(S: Sketch, r: Box, room: Room, M = METRE): void {
  const [x0, y0, x1, y1] = r;
  const [w, h] = [(x1 - x0) / M, (y1 - y0) / M];
  const [cx, cy] = [(x0 + x1) / 2, (y0 + y1) / 2];
  const at = (x: number, y: number, turn = 0): Piece => new Piece(S, x, y, turn, M);
  const fits = (mw: number, mh: number): boolean => w >= mw && h >= mh;
  if (room === 'bedroom') {
    PIECES.bed(at(cx, y0 + 1.1 * M), fits(4, 3.4));
    if (fits(5, 4)) PIECES.wardrobe(at(x1 - 0.35 * M, cy, 1), Math.min(2.4, h - 1));
    PIECES.plant(at(x0 + 0.4 * M, y1 - 0.4 * M));
  } else if (room === 'living') {
    PIECES.rug(at(cx, cy), Math.min(3, w - 1.5), Math.min(2.2, h - 1.8));
    PIECES.sofa(at(cx, y1 - 0.55 * M, 2), Math.min(2.6, w - 1.2));
    PIECES.table(at(cx, cy), 0);
    if (fits(5, 4)) PIECES.armchair(at(x0 + 0.6 * M, cy, 3));
    S.rect([cx - 0.8 * M, y0 + 0.05 * M, cx + 0.8 * M, y0 + 0.4 * M], 1);
    PIECES.plant(at(x1 - 0.4 * M, y0 + 0.4 * M));
  } else if (room === 'kitchen' || room === 'dining') {
    if (room === 'kitchen') PIECES.kitchen(at(cx, y0 + 0.35 * M), Math.min(w - 0.4, 4));
    const round = !fits(4.5, 3.5);
    PIECES.table(
      at(cx, room === 'kitchen' ? cy + 0.5 * M : cy),
      round ? 4 : Math.min(8, Math.floor((w - 1) / 0.64) * 2),
      round,
    );
  } else if (room === 'bath' || room === 'wc') {
    if (room === 'bath' && fits(2, 1.6)) PIECES.bath(at(cx, y0 + 0.45 * M));
    const n = room === 'wc' ? Math.max(1, Math.floor(w / 0.9)) : 1;
    for (let i = 0; i < n; i++) {
      const x = x0 + (i + 0.5) * (w / n) * M;
      PIECES.toilet(at(x, y1 - 0.4 * M, 2));
      if (room === 'wc') S.seg(x + (w / n / 2) * M, y1, x + (w / n / 2) * M, y1 - 1.2 * M, 2);
    }
    PIECES.basin(at(x0 + 0.4 * M, cy, 3));
  } else if (room === 'study' || room === 'office') {
    const cols = room === 'study' ? 1 : Math.max(1, Math.floor((w - 0.6) / 1.6));
    const rows = room === 'study' ? 1 : Math.max(1, Math.floor((h - 0.6) / 1.6));
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) PIECES.desk(at(x0 + (0.9 + i * 1.6) * M, y0 + (0.6 + j * 1.6) * M));
    if (room === 'study') S.rect([x1 - 0.35 * M, y0 + 0.1 * M, x1 - 0.05 * M, y1 - 0.1 * M], 1);
  } else if (room === 'meeting') {
    PIECES.table(at(cx, cy), Math.max(4, Math.min(10, Math.floor((w - 1.4) / 0.64) * 2)));
    S.seg(cx - 0.9 * M, y0 + 0.08 * M, cx + 0.9 * M, y0 + 0.08 * M, 1);
  } else if (room === 'stair') {
    S.hatch([cx - 0.6 * M, y0 + 0.4 * M, cx + 0.6 * M, y1 - 0.4 * M], 0.28 * M, 2);
    S.seg(cx, y1 - 0.6 * M, cx, y0 + 0.6 * M, 1);
  } else {
    for (let y = y0 + 0.2 * M; y < y1 - 0.5 * M; y += 0.9 * M) S.rect([x0 + 0.2 * M, y, x1 - 0.2 * M, y + 0.45 * M], 2);
  }
}
