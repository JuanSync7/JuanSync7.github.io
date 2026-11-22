import type { BinderBox } from './types';

/** Where things are on the two plates, in design units. These are facts about the drawings
 *  (public/library/, made by the art playbooks' scenes kernel): change them only with the art. */
export const PLATE = {
  /** The bottom edge of each of the four shelves, from the wall unit's top. */
  rows: [214, 372, 530, 688],
  /** The run of a shelf a binder may stand on, from the wall unit's left. */
  runFrom: 152,
  runTo: 608,
  /** The top of the desk, from the desk plate's top, and the free spot on it. */
  deskTop: 456,
  deskSpot: 720,
  /** The outline on the desk that waits for a binder: about one binder thick. */
  spotH: 36,
  /** How deep a binder is, front to back: what you see when it lies flat. */
  depth: 96,
  /** A cover board's thickness: the paper block starts this far inside the binder. */
  board: 5,
  /** The opened paper's top edge, from the desk plate's top. */
  sheetTop: 10,
  /** How far above the binder the paper hangs while it turns to face you. */
  sheetHover: 150,
  /** The paper's width while it is still in the binder. */
  sheetInBinder: 86,
} as const;

const WIDTHS = [34, 38, 36, 40];
const FILLS = ['a', 'b', 'a', 'c'] as const;
const GAP = 2;

/** Stands a shelf's binders left to right, top shelf first, the way a person files them. A
 *  shelf holds what fits; the archive never lets a binder hang past the run. */
export function shelve(count: number): BinderBox[] {
  const out: BinderBox[] = [];
  let row = 0;
  let x = PLATE.runFrom;
  for (let i = 0; i < count; i++) {
    const w = WIDTHS[(i * 3) % WIDTHS.length];
    const h = 132 - ((i * 5) % 3) * 6;
    if (x + w > PLATE.runTo) {
      row += 1;
      x = PLATE.runFrom;
    }
    if (row >= PLATE.rows.length) break;
    out.push({ x, y: PLATE.rows[row] - h, w, h, fill: FILLS[i % FILLS.length] });
    x += w + GAP;
  }
  return out;
}

/** The sizes and times the stylesheet owns, read once the archive is on the page, so the
 *  timeline and the CSS never disagree. */
export interface Metrics {
  unit: number;
  band: number;
  deskW: number;
  viewMin: number;
  sheetW: number;
  dur: { slide: number; lift: number; fly: number; plop: number; open: number; sheet: number };
}

function num(st: CSSStyleDeclaration, name: string): number {
  const raw = st.getPropertyValue(name).trim();
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return 0;
  return raw.endsWith('ms') ? n : raw.endsWith('s') ? n * 1000 : n;
}

export function readMetrics(el: Element): Metrics {
  const st = getComputedStyle(el);
  const d = (k: string): number => num(st, `--pp-lib-dur-${k}`);
  return {
    unit: num(st, '--pp-lib-unit'),
    band: num(st, '--pp-lib-band-h'),
    deskW: num(st, '--pp-lib-desk-w'),
    viewMin: num(st, '--pp-lib-view-min'),
    sheetW: num(st, '--pp-lib-sheet-w'),
    dur: { slide: d('slide'), lift: d('lift'), fly: d('fly'), plop: d('plop'), open: d('open'), sheet: d('sheet') },
  };
}

/** The shelf at a track position: positions run over three copies of the shelves so the
 *  carousel can turn either way forever. */
export function shelfAt(pos: number, n: number): number {
  return ((pos % n) + n) % n;
}

/** The shortest turn from one shelf to another. */
export function turn(from: number, to: number, n: number): number {
  let d = (((to - from) % n) + n) % n;
  if (d > n / 2) d -= n;
  return d;
}
