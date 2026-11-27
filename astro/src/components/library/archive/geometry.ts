import { anchor, anchors, plate } from '../../../figures/plates/registry';
import type { BinderBox, Flame, Prop } from './types';

/** The two baked figures the archive stands on. Where things are on them (the shelf boards, a
 *  shelf's standing room, the plaque, the desk top and the spot a binder lands on) comes from
 *  their manifests, written by the kernel from the constants it draws with. */
export const WALL = plate('library-wall');
export const DESK = plate('library-desk');
const [runFrom, runTo] = anchors(WALL, 'run');
const [plaqueX, plaqueY, plaqueW, plaqueH] = anchors(WALL, 'plaque');
const [boardX, boardY, boardW, boardH] = anchors(WALL, 'board');

export const PLATE = {
  /** The bottom edge of each shelf, from the wall unit's top. */
  rows: anchors(WALL, 'rows'),
  /** The run of a shelf a binder may stand on, from the wall unit's left. */
  runFrom,
  runTo,
  plaque: { left: plaqueX, top: plaqueY, width: plaqueW, height: plaqueH },
  /** The directory board in the wall bay right of the shelf, from the wall unit's top-left. */
  directory: { left: boardX, top: boardY, width: boardW, height: boardH },
  /** Where a thing on the desk rests, and the free spot on it, from the desk plate's top-left. */
  deskTop: anchor(DESK, 'rest'),
  deskSpot: anchor(DESK, 'spot'),
  // The rest is the binder's own size and the paper's path, not facts about the drawings.
  /** How deep a binder is, front to back: what you see when it lies flat. */
  depth: 96,
  /** A cover board's thickness: the paper block starts this far inside the binder. */
  board: 5,
  /** The outline on the desk that waits for a binder: about one binder thick. */
  spotH: 36,
  /** The opened paper's top edge, from the desk plate's top. */
  sheetTop: 10,
  /** How far above the binder the paper hangs while it turns to face you. */
  sheetHover: 150,
  /** The paper's width while it is still in the binder. */
  sheetInBinder: 86,
} as const;

/** Spines are thick enough for two lines of title and tall enough to fill a shelf: about nine
 *  stand on a level, so a shelf holds about thirty-six, room for the twenty a kind will reach. A
 *  binder's height plus its hover lift stays inside the lowest shelf's clear height (144). */
const WIDTHS = [46, 50, 48, 52];
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
    const h = 134 - ((i * 5) % 3) * 3;
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

/** The shelf fillers: baked figures that are plainly not binders. Each stands with its foot on a
 *  board; `foot` is the part that takes shelf room, from the plate's left. */
const FILLERS = { box: plate('library-box'), bookend: plate('library-bookend'), books: plate('library-books') };
const ROOM = 12;

function prop(kind: keyof typeof FILLERS, footX: number, row: number): Prop {
  const p = FILLERS[kind];
  const [f0] = anchors(p, 'foot');
  return { id: p.id, x: footX - f0, y: PLATE.rows[row] - p.size[1], w: p.size[0], h: p.size[1] };
}

function footW(kind: keyof typeof FILLERS): number {
  const [a, b] = anchors(FILLERS[kind], 'foot');
  return b - a;
}

type Kind = keyof typeof FILLERS;

/** What stands on a level's free run, by pattern: at its left end and at its right end. A level
 *  with binders keeps its left for them, so only its right is furnished. */
const EMPTY: readonly [Kind | null, Kind | null][] = [
  ['books', 'box'],
  [null, 'box'],
  [null, 'books'],
  [null, null],
];
const AFTER: readonly (Kind | null)[] = ['box', 'books', null, 'box'];

/** Furnishes a shelf around its binders: a bookend after the last binder of a level, and on the
 *  free run a box or a stack of books, chosen by the level and the shelf so neighbouring shelves
 *  differ; some runs stay empty, room for the next piece. Nothing ever stands where a binder is. */
export function furnish(binders: readonly BinderBox[], shelf: number): Prop[] {
  const out: Prop[] = [];
  PLATE.rows.forEach((bottom, row) => {
    const mine = binders.filter((b) => b.y + b.h === bottom);
    const pattern = (row + shelf) % EMPTY.length;
    let from = PLATE.runFrom;
    let [left, right]: [Kind | null, Kind | null] = [...EMPTY[pattern]];
    if (mine.length) {
      from = Math.max(...mine.map((b) => b.x + b.w)) + 2;
      if (from + footW('bookend') <= PLATE.runTo) {
        out.push(prop('bookend', from, row));
        from += footW('bookend');
      }
      [left, right] = [null, AFTER[pattern]];
    }
    if (left && from + footW(left) <= PLATE.runTo) {
      out.push(prop(left, from, row));
      from += footW(left) + ROOM;
    }
    if (right && PLATE.runTo - footW(right) >= from + ROOM) out.push(prop(right, PLATE.runTo - footW(right), row));
  });
  return out;
}

function isFlame(v: unknown): v is { x: number; y: number; h: number } {
  if (typeof v !== 'object' || v === null) return false;
  return (
    'x' in v && 'y' in v && 'h' in v && typeof v.x === 'number' && typeof v.y === 'number' && typeof v.h === 'number'
  );
}

/** How big a live flame's square box is against the drawn flame's height, and where its wick
 *  stands in the box (candle-flame's wick point, 24 of its 30 units down). */
const FLAME_BOX = 2.0;
const FLAME_WICK = 24 / 30;

/** Where the candle flames stand on a plate, as the square boxes live flames are drawn in: the
 *  box's wick row on the drawn flame's base, and big enough that the live flame covers it. */
export function flames(p: typeof WALL): Flame[] {
  const raw = p.anchors.flames;
  if (!Array.isArray(raw)) return [];
  return raw.filter(isFlame).map((f, key) => {
    const size = f.h * FLAME_BOX;
    return { key, x: f.x - size / 2, y: f.y + f.h / 2 - size * FLAME_WICK, w: size, h: size };
  });
}

/** The sizes and times the archive moves by: the plates' sizes from their manifests, the rest
 *  read from the stylesheet once the archive is on the page, so the timeline and the CSS agree. */
export interface Metrics {
  /** A wall unit's width (the carousel's step) and the wall's height. */
  unit: number;
  wallH: number;
  band: number;
  deskW: number;
  viewMin: number;
  /** How wide the fade into the page is at each side of the view. */
  fade: number;
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
    unit: WALL.size[0],
    wallH: WALL.size[1],
    band: num(st, '--pp-lib-band-h'),
    deskW: DESK.size[0],
    viewMin: num(st, '--pp-lib-view-min'),
    fade: num(st, '--pp-lib-fade-w'),
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
