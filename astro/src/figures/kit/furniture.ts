import { Layout } from './layout';
import { Piece } from './piece';
import type { Box, Sketch } from './sketch';

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

/** Lay out room r for what it is for, M plan units to a metre, keeping every piece clear
 *  of the boxes in `keepOut` (the door's swing) and of each other (`kit/layout.ts`).
 *  Returns the layout, so a test can check what it placed. */
export function furnish(S: Sketch, r: Box, room: Room, M = METRE, keepOut: readonly Box[] = []): Layout {
  const [x0, y0, x1, y1] = r;
  const [w, h] = [(x1 - x0) / M, (y1 - y0) / M];
  const [cx, cy] = [(x0 + x1) / 2, (y0 + y1) / 2];
  const L = new Layout(S, r, keepOut);
  /** Place a piece at (x, y), turned, drawn by `draw`. */
  const put = (x: number, y: number, turn: number, draw: (p: Piece) => void, solid = true): void => {
    L.put((B) => draw(new Piece(B, x, y, turn, M)), solid);
  };
  const fits = (mw: number, mh: number): boolean => w >= mw && h >= mh;
  if (room === 'bedroom') {
    put(cx, y0 + 1.1 * M, 0, (p) => PIECES.bed(p, fits(4, 3.4)));
    if (fits(5, 4)) put(x1 - 0.35 * M, cy, 1, (p) => PIECES.wardrobe(p, Math.min(2.4, h - 1)));
    put(x0 + 0.4 * M, y1 - 0.4 * M, 0, PIECES.plant);
  } else if (room === 'living') {
    put(cx, cy, 0, (p) => PIECES.rug(p, Math.min(3, w - 1.5), Math.min(2.2, h - 1.8)), false);
    put(cx, y1 - 0.55 * M, 2, (p) => PIECES.sofa(p, Math.min(2.6, w - 1.2)));
    put(cx, cy, 0, (p) => PIECES.table(p, 0));
    if (fits(5, 4)) put(x0 + 0.6 * M, cy, 3, PIECES.armchair);
    L.put((B) => B.rect([cx - 0.8 * M, y0 + 0.05 * M, cx + 0.8 * M, y0 + 0.4 * M], 1));
    put(x1 - 0.4 * M, y0 + 0.4 * M, 0, PIECES.plant);
  } else if (room === 'kitchen' || room === 'dining') {
    if (room === 'kitchen') put(cx, y0 + 0.35 * M, 0, (p) => PIECES.kitchen(p, Math.min(w - 0.4, 4)));
    const round = !fits(4.5, 3.5);
    const seats = round ? 4 : Math.min(8, Math.floor((w - 1) / 0.64) * 2);
    put(cx, room === 'kitchen' ? cy + 0.5 * M : cy, 0, (p) => PIECES.table(p, seats, round));
  } else if (room === 'bath' || room === 'wc') {
    if (room === 'bath' && fits(2, 1.6)) put(cx, y0 + 0.45 * M, 0, PIECES.bath);
    const n = room === 'wc' ? Math.max(1, Math.floor(w / 0.9)) : 1;
    for (let i = 0; i < n; i++) {
      const x = x0 + (i + 0.5) * (w / n) * M;
      put(x, y1 - 0.4 * M, 2, PIECES.toilet);
      if (room === 'wc' && i < n - 1)
        L.put((B) => B.seg(x + (w / n / 2) * M, y1, x + (w / n / 2) * M, y1 - 1.2 * M, 2));
    }
    put(x0 + 0.4 * M, cy, 3, PIECES.basin);
  } else if (room === 'study' || room === 'office') {
    const cols = room === 'study' ? 1 : Math.max(1, Math.floor((w - 0.6) / 1.6));
    const rows = room === 'study' ? 1 : Math.max(1, Math.floor((h - 0.6) / 1.6));
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) put(x0 + (0.9 + i * 1.6) * M, y0 + (0.6 + j * 1.6) * M, 0, PIECES.desk);
    if (room === 'study') L.put((B) => B.rect([x1 - 0.35 * M, y0 + 0.1 * M, x1 - 0.05 * M, y1 - 0.1 * M], 1));
  } else if (room === 'meeting') {
    const seats = Math.max(4, Math.min(10, Math.floor((w - 1.4) / 0.64) * 2));
    put(cx, cy, 0, (p) => PIECES.table(p, seats));
    L.put((B) => B.seg(cx - 0.9 * M, y0 + 0.08 * M, cx + 0.9 * M, y0 + 0.08 * M, 1));
  } else if (room === 'stair') {
    L.put((B) => {
      B.hatch([cx - 0.6 * M, y0 + 0.4 * M, cx + 0.6 * M, y1 - 0.4 * M], 0.28 * M, 2);
      B.seg(cx, y1 - 0.6 * M, cx, y0 + 0.6 * M, 1);
    });
  } else {
    for (let y = y0 + 0.2 * M; y < y1 - 0.5 * M; y += 0.9 * M)
      L.put((B) => B.rect([x0 + 0.2 * M, y, x1 - 0.2 * M, y + 0.45 * M], 2));
  }
  return L;
}
