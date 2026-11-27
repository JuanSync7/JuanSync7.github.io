import { isBox, type Part, type PartKind } from './city';
import type { Sketch } from './drawing/monoline';
import { tall } from './landmarks';

/** The faces of a district's buildings as line detail on their solids (`kit/districtsketch.ts`):
 *  what makes a block read as a building at a card's size. Offices and flats get a grid of
 *  windows a storey apart; a tall tower's grid stops where its crown begins (`crowned`, at 0.8 of
 *  its height), a round tower gets its floor rings; a house a door and two windows; a works shed,
 *  a warehouse or a factory loading doors and a strip of high windows; a data hall its louvres.
 *  Everything is drawn in the part's own frame, `proud` off the face it lies on, so the face
 *  hides it from behind and never from the front. */

/** A storey, in board units: the cell windows are laid out on. */
const STOREY = 0.032;
/** A window's share of its cell, across and up. */
const [GLAZE_W, GLAZE_H] = [0.5, 0.45];
/** Columns of windows: one per this much wall, never more than MAX_COLS a face. */
const [BAY, MAX_COLS] = [0.03, 14];

const OFFICE: readonly PartKind[] = ['block', 'storey', 'apartment', 'bourse', 'clocktower'];
const WORKS: readonly PartKind[] = ['warehouse', 'factory', 'shed', 'turbinehall', 'powerhouse'];

type Face = 'x' | 'z';
/** One face's four sides: its axis, which side, and the span of wall it holds. */
const faces = (w: number, d: number): [Face, number, number][] => [
  ['x', w / 2, d],
  ['x', -w / 2, d],
  ['z', d / 2, w],
  ['z', -d / 2, w],
];

/** A rectangle on a face: `u` across the face from its centre, `y` up from the ground. */
function pane(k: Sketch, axis: Face, at: number, u0: number, y0: number, u1: number, y1: number, proud: number): void {
  const off = at + Math.sign(at) * proud;
  if (axis === 'x') k.rect('x', off, y0, u0, y1, u1, 'soft');
  else k.rect('z', off, u0, y0, u1, y1, 'soft');
}

/** A grid of windows over every face from y0 to y1, leaving the ground floor's height clear. */
function grid(k: Sketch, p: Part, y0: number, y1: number, proud: number): void {
  const rows = Math.floor((y1 - y0) / STOREY);
  if (rows < 1) return;
  for (const [axis, at, span] of faces(p.w, p.d)) {
    const cols = Math.min(MAX_COLS, Math.floor(span / BAY));
    if (cols < 1) continue;
    const cw = span / cols;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const [u, y] = [-span / 2 + cw * (c + 0.5), y0 + STOREY * (r + 0.5)];
        const [hu, hy] = [(cw * GLAZE_W) / 2, (STOREY * GLAZE_H) / 2];
        pane(k, axis, at, u - hu, y - hy, u + hu, y + hy, proud);
      }
  }
}

/** Doors along the ground of the two long faces, `n` of them, `tall` of the wall high. */
function doors(k: Sketch, p: Part, n: number, high: number, proud: number): void {
  const long: Face = p.w >= p.d ? 'z' : 'x';
  const [span, at] = long === 'z' ? [p.w, p.d / 2] : [p.d, p.w / 2];
  for (const s of [-1, 1])
    for (let i = 0; i < n; i++) {
      const u = -span / 2 + (span * (i + 0.5)) / n;
      const half = Math.min(span / n / 3, 0.02);
      pane(k, long, s * at, u - half, 0, u + half, Math.min(p.h * high, 0.05), proud);
    }
}

/** The line detail of part `p`'s faces, in its own frame. */
export function facade(k: Sketch, p: Part, proud: number): void {
  const { kind, w, d, h } = p;
  if (tall(p)) {
    if (kind === 'block') return grid(k, p, STOREY * 0.6, h * 0.8, proud);
    // A round, six- or three-sided tower: its floors as rings on the shaft.
    const r = Math.min(w, d) / 2;
    for (let y = STOREY; y < h * 0.8; y += STOREY * 2)
      k.circle([0, y, 0], r + proud, 'y', 'faint', kind === 'tower' ? 32 : kind === 'hex' ? 6 : 3);
    return;
  }
  if (OFFICE.includes(kind) && isBox(kind)) return grid(k, p, STOREY * 0.6, h - STOREY * 0.2, proud);
  if (kind === 'house') {
    // A door in the middle of each long side, a window either side of it.
    doors(k, p, 1, 0.75, proud);
    const long: Face = w >= d ? 'z' : 'x';
    const [span, at] = long === 'z' ? [w, d / 2] : [d, w / 2];
    for (const s of [-1, 1])
      for (const u of [-span * 0.3, span * 0.3]) pane(k, long, s * at, u - 0.008, h * 0.4, u + 0.008, h * 0.75, proud);
    return;
  }
  if (WORKS.includes(kind)) {
    doors(k, p, Math.max(1, Math.round(Math.max(w, d) / 0.18)), 0.6, proud);
    // A strip of high windows under the eaves.
    for (const [axis, at, span] of faces(w, d))
      pane(k, axis, at, -span / 2 + 0.01, h * 0.72, span / 2 - 0.01, h * 0.86, proud);
    return;
  }
  if (kind === 'reservoir') {
    // A few ripples on the water, upstream of the dam.
    for (let i = 0; i < 9; i++) {
      const [x, z] = [-w * 0.45 + ((i * 0.37) % 1) * w * 0.8, (((i * 0.61) % 1) - 0.5) * d * 0.8];
      k.line(
        [
          [x, h + proud, z],
          [x + w * 0.06, h + proud, z],
        ],
        'faint',
      );
    }
    return;
  }
  if (kind === 'datahall' || kind === 'louvred')
    for (const [axis, at, span] of faces(w, d))
      for (let y = h * 0.2; y < h * 0.85; y += 0.008)
        k.line(
          axis === 'x'
            ? [
                [at + Math.sign(at) * proud, y, -span / 2 + 0.006],
                [at + Math.sign(at) * proud, y, span / 2 - 0.006],
              ]
            : [
                [-span / 2 + 0.006, y, at + Math.sign(at) * proud],
                [span / 2 - 0.006, y, at + Math.sign(at) * proud],
              ],
          'faint',
        );
}
