import type { Part, PartKind } from './city';
import type { Sketch, Tier, V3 } from './drawing/monoline';
import { tall } from './landmarks';

/** The faces of a district's buildings as line detail on their solids (`kit/districtsketch.ts`),
 *  what makes a solid read as a particular building at a card's size, drawn as an architect's
 *  elevation would draw it:
 *
 *  - a tower is a curtain wall: a floor band every storey and a mullion every bay, up to where its
 *    crown begins (`crowned`, at 0.8 of its height), over a double-height glazed lobby;
 *  - an office or a block of flats has punched windows, a storey apart, a door on its front;
 *  - a library storey has tall windows; a house a door, windows and one in its gable;
 *  - a works shed, warehouse, factory or powerhouse has roller doors and a strip of high windows;
 *  - a data hall its louvres; a flat roof its parapet line; a tank its bands; a dome its ribs;
 *    a solar array its cells.
 *
 *  Everything is in the part's own frame, `proud` off the surface it lies on, so the surface hides
 *  it from behind and never from the front. A classical front (the exchange, the portico, the
 *  clock tower) carries its detail in its solid and gets none here. */

/** A storey, in board units, and the bay windows and mullions are spaced at. */
const [STOREY, BAY] = [0.03, 0.028];
/** A punched window's share of its bay across and of its storey up. */
const [GLAZE_W, GLAZE_H] = [0.46, 0.5];
const MAX_BAYS = 16;

const OFFICE: readonly PartKind[] = ['block', 'apartment'];
const WORKS: readonly PartKind[] = ['warehouse', 'factory', 'shed', 'turbinehall', 'powerhouse'];
/** Flat roofs that read better with their parapet drawn. */
const FLAT: readonly PartKind[] = [
  ...(['storey', 'apartment', 'datahall', 'louvred', 'powerhouse', 'factory', 'turbinehall'] as const),
  ...(['battery', 'fuelcell', 'rack', 'cell'] as const),
];
const ROUND: readonly PartKind[] = ['tank', 'silo', 'column', 'pll'];

type Axis = 'x' | 'z';
/** One wall: its axis, the side it stands on (±), and the wall's length. */
const walls = (w: number, d: number): [Axis, number, number][] => [
  ['x', w / 2, d],
  ['x', -w / 2, d],
  ['z', d / 2, w],
  ['z', -d / 2, w],
];

/** A point on a wall: `u` along it from its middle, `y` up, `proud` off it. */
const onWall = (axis: Axis, at: number, u: number, y: number, proud: number): V3 => {
  const off = at + Math.sign(at) * proud;
  return axis === 'x' ? [off, y, u] : [u, y, off];
};

function seg(
  k: Sketch,
  axis: Axis,
  at: number,
  u0: number,
  y0: number,
  u1: number,
  y1: number,
  p: number,
  t: Tier,
): void {
  k.line([onWall(axis, at, u0, y0, p), onWall(axis, at, u1, y1, p)], t);
}

function pane(k: Sketch, axis: Axis, at: number, u0: number, y0: number, u1: number, y1: number, p: number): void {
  k.line(
    [
      onWall(axis, at, u0, y0, p),
      onWall(axis, at, u1, y0, p),
      onWall(axis, at, u1, y1, p),
      onWall(axis, at, u0, y1, p),
      onWall(axis, at, u0, y0, p),
    ],
    'soft',
  );
}

/** How many bays a wall of length `span` takes. */
const bays = (span: number): number => Math.max(1, Math.min(MAX_BAYS, Math.round(span / BAY)));

/** A curtain wall from y0 to y1 on every wall: floor bands and mullions, a lobby under it. */
function curtain(k: Sketch, { w, d }: Part, y0: number, y1: number, p: number): void {
  for (const [axis, at, span] of walls(w, d)) {
    const n = bays(span);
    for (let y = y0; y <= y1 + 1e-9; y += STOREY) seg(k, axis, at, -span / 2, y, span / 2, y, p, 'soft');
    for (let i = 1; i < n; i++) {
      const u = -span / 2 + (span * i) / n;
      seg(k, axis, at, u, y0, u, y1, p, 'faint');
      // The lobby: tall glazing between the ground and the first band, every other bay.
      if (i % 2 === 0) seg(k, axis, at, u, 0, u, y0, p, 'faint');
    }
  }
}

/** Punched windows from y0 to y1, a door in the middle of the front (+z) at the ground. */
function punched(k: Sketch, { w, d }: Part, y0: number, y1: number, p: number, tallness = GLAZE_H): void {
  const rows = Math.max(1, Math.floor((y1 - y0) / STOREY));
  for (const [axis, at, span] of walls(w, d)) {
    const n = bays(span);
    const [cw, hw, hh] = [span / n, (span / n) * GLAZE_W * 0.5, STOREY * tallness * 0.5];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < n; c++) {
        const [u, y] = [-span / 2 + cw * (c + 0.5), y0 + STOREY * (r + 0.55)];
        pane(k, axis, at, u - hw, y - hh, u + hw, y + hh, p);
      }
    if (axis === 'z' && at > 0)
      pane(k, axis, at, -Math.min(0.009, span * 0.1), 0, Math.min(0.009, span * 0.1), Math.min(y0, 0.02), p);
  }
}

/** The parapet's inner edge on a flat roof at height h. */
function parapet(k: Sketch, { w, d }: Part, h: number, p: number): void {
  const i = Math.min(0.004, w * 0.08, d * 0.08);
  k.rect('y', h + p, -w / 2 + i, -d / 2 + i, w / 2 - i, d / 2 - i, 'faint');
}

/** The line detail of part `p`'s faces, in its own frame. */
export function facade(k: Sketch, p: Part, proud: number): void {
  const { kind, w, d, h } = p;
  if (tall(p)) {
    if (kind === 'block') return curtain(k, p, STOREY * 1.6, h * 0.8, proud);
    // A round, six- or three-sided tower: a floor ring every storey on the shaft.
    const sides = kind === 'tower' ? 48 : kind === 'hex' ? 6 : 3;
    const r = Math.min(w, d) / 2;
    for (let y = STOREY * 1.6, n = 0; y < h * 0.8; y += STOREY, n++)
      k.circle([0, y, 0], r + proud, 'y', n % 2 ? 'faint' : 'soft', sides);
    return;
  }
  if (OFFICE.includes(kind)) {
    punched(k, p, STOREY * 0.8, h - STOREY * 0.3, proud);
    if (FLAT.includes(kind) || w >= 0.045) parapet(k, p, h, proud);
    return;
  }
  if (kind === 'storey') {
    // A library's storey: tall windows, close set, under its cornice.
    punched(k, p, h * 0.12, h * 0.86, proud, 0.75);
    return parapet(k, p, h, proud);
  }
  if (kind === 'house') return house(k, p, proud);
  if (kind === 'clocktower') return clock(k, p, proud);
  if (WORKS.includes(kind)) return works(k, p, proud);
  if (kind === 'datahall' || kind === 'louvred') {
    for (const [axis, at, span] of walls(w, d))
      for (let y = h * 0.2; y < h * 0.85; y += 0.008)
        seg(k, axis, at, -span / 2 + 0.006, y, span / 2 - 0.006, y, proud, 'faint');
    return parapet(k, p, h, proud);
  }
  if (FLAT.includes(kind)) return parapet(k, p, h, proud);
  if (ROUND.includes(kind)) {
    // A tank's welded courses.
    const r = Math.min(w, d) / 2 + proud;
    for (const f of [0.25, 0.5, 0.75]) k.circle([0, h * f, 0], r, 'y', 'faint', 48);
    return;
  }
  if (kind === 'dome') return ribs(k, p, proud);
  if (kind === 'solar') return cells(k, p, proud);
  if (kind === 'reservoir') ripples(k, p, proud);
}

/** A clock face on each side of the clock stage, its hands at ten past ten. */
function clock(k: Sketch, { w, d, h }: Part, p: number): void {
  const [y, r] = [h * 0.625, Math.min(w, d) * 0.32];
  for (const [axis, at] of walls(w * 1.08, d * 1.08)) {
    const c = onWall(axis, at, 0, y, p);
    k.circle(c, r, axis, 'soft', 24);
    const hand = (a: number, l: number): V3 => onWall(axis, at, Math.cos(a) * r * l, y + Math.sin(a) * r * l, p);
    k.line([hand(0, 0), hand(Math.PI * 0.83, 0.55), hand(0, 0), hand(Math.PI * 0.17, 0.8)], 'soft');
  }
}

function house(k: Sketch, { w, d, h }: Part, p: number): void {
  const [long, span, at] = w >= d ? (['z', w, d / 2] as const) : (['x', d, w / 2] as const);
  for (const s of [-1, 1]) {
    // The door in the middle; a window either side, each with its glazing bar.
    pane(k, long, s * at, -0.006, 0, 0.006, h * 0.7, p);
    for (const u of [-span * 0.3, span * 0.3]) {
      pane(k, long, s * at, u - 0.008, h * 0.35, u + 0.008, h * 0.72, p);
      seg(k, long, s * at, u, h * 0.35, u, h * 0.72, p, 'faint');
    }
  }
}

function works(k: Sketch, { w, d, h }: Part, p: number): void {
  const [long, span, at] = w >= d ? (['z', w, d / 2] as const) : (['x', d, w / 2] as const);
  const n = Math.max(1, Math.round(span / 0.18));
  for (const s of [-1, 1])
    for (let i = 0; i < n; i++) {
      // A roller door: its frame and its slats.
      const u = -span / 2 + (span * (i + 0.5)) / n;
      const [half, top] = [Math.min(span / n / 3, 0.02), Math.min(h * 0.6, 0.045)];
      pane(k, long, s * at, u - half, 0, u + half, top, p);
      for (let y = top / 4; y < top; y += top / 4) seg(k, long, s * at, u - half, y, u + half, y, p, 'faint');
    }
  // A strip of high windows under the eaves, its mullions every bay.
  for (const [axis, side, len] of walls(w, d)) {
    pane(k, axis, side, -len / 2 + 0.01, h * 0.72, len / 2 - 0.01, h * 0.86, p);
    const m = bays(len);
    for (let i = 1; i < m; i++) {
      const u = -len / 2 + 0.01 + ((len - 0.02) * i) / m;
      seg(k, axis, side, u, h * 0.72, u, h * 0.86, p, 'faint');
    }
  }
}

/** A dome's ribs from its base to its crown, and a ring at its haunch. */
function ribs(k: Sketch, { w, d, h }: Part, p: number): void {
  const at = (a: number, t: number): V3 => [
    Math.cos(a) * Math.cos(t) * (w / 2 + p),
    Math.sin(t) * (h + p),
    Math.sin(a) * Math.cos(t) * (d / 2 + p),
  ];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    k.line(
      Array.from({ length: 9 }, (_, j) => at(a, (j / 8) * Math.PI * 0.46)),
      'faint',
    );
  }
  k.line(
    Array.from({ length: 49 }, (_, j) => at((j / 48) * Math.PI * 2, 0.5)),
    'soft',
  );
}

/** A solar array's cells: rows along it and a joint every module across its tilted face. */
function cells(k: Sketch, { w, d, h }: Part, p: number): void {
  const lo = h * 0.35;
  const on = (x: number, f: number): V3 => [x, lo + (h - lo) * f + p * 2, d / 2 - d * f];
  for (const f of [1 / 3, 2 / 3]) k.line([on(-w / 2, f), on(w / 2, f)], 'faint');
  const n = Math.max(2, Math.round(w / 0.03));
  for (let i = 1; i < n; i++) {
    const x = -w / 2 + (w * i) / n;
    k.line([on(x, 0), on(x, 1)], 'faint');
  }
}

function ripples(k: Sketch, { w, d, h }: Part, p: number): void {
  for (let i = 0; i < 9; i++) {
    const [x, z] = [-w * 0.45 + ((i * 0.37) % 1) * w * 0.8, (((i * 0.61) % 1) - 0.5) * d * 0.8];
    k.line(
      [
        [x, h + p, z],
        [x + w * 0.06, h + p, z],
      ],
      'faint',
    );
  }
}
