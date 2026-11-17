// One source: JuanSync7/frontend-kit, bricks/src (@juansync7/bricks). A project's copy is synced from it, never edited.
import type { Pose } from './legopose.ts';

/** A piece's colour, by name. A project names its colours by merging into `Tones` from a file of
 *  its own (`declare module './legoset.ts' { interface Tones extends Record<MyColour, true> {} }`);
 *  until one does, a colour is any string. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Tones {}
export type Tone = [keyof Tones] extends [never] ? string : Extract<keyof Tones, string>;

/** The LEGO parts catalogue as data: what each piece kind fills, where its studs are. Pure: no
 *  three, so the checks run it in node with no build. The checks are in `legocheck.ts`.
 *
 *  Units: x and z in studs, y in plates (a brick is 3 plates; a plate is 0.4 of a stud). A cell
 *  is one stud by one stud by one plate. Every piece names a catalogue kind, its corner on the
 *  grid, its size in its own frame (w along its x, d along its z, h in plates) and a quarter turn.
 *  Ramp pieces fall from their high end at local x = 0 toward local +x. Round, rolling parts
 *  (wheels, axles) lie along z and are placed by their axis instead. */

export type Kind =
  | 'brick' // studs on top
  | 'plate' // a third of a brick, studs on top
  | 'tile' // a smooth plate
  | 'grille' // a tile with slots: intakes, vents
  | 'technic' // a brick with axle holes across it, between its studs
  | 'slope45' // 2 deep, 1 stud row then a 45 degree face, 3 plates tall
  | 'cheese' // 1 x 1 slope, 2 plates tall
  | 'curve2' // curved slope, 2 long, 2 plates tall
  | 'curve4' // curved slope, 4 long, 3 plates tall
  | 'wedge' // a tapered plate, cut on one side (hand R or L)
  | 'round' // round plate or brick, 1 x 1 or 2 x 2
  | 'dome' // a smooth dome: 4 x 4 for a roof (86500); 2 x 2 a round half with one stud on its crown (30367): a spire, a helmet
  | 'wheel' // rim and tyre on an axle along z
  | 'axle' // a cross axle along z
  | 'slope33' // 3 deep, 1 stud row then a 33 degree face, 3 plates tall
  | 'inv45' // inverted 45 degree slope, 2 deep: flat studded top, the underside rising away
  | 'curve3' // curved slope, 3 long, a brick tall (50950)
  | 'quarter' // 1 x 1 quarter-round tile: a rounded corner
  | 'roundtile' // round tile, 1 x 1 or 2 x 2: lights, wheel caps, a camera lens
  | 'cone' // 1 x 1 cone, 3 plates, an open stud on top
  | 'bar' // a bar 3.2 mm across standing in a hollow stud, h plates long (Bar 4L, 10 plates): antennas, stalks
  | 'bracket' // a plate w x d, every cell studded, a flange `flange` studs tall just outside its front edge (local v = 0), studs out: see legopose
  | 'hinge' // a click hinge plate 2 x 1, its knuckle along its far side (local v = 1), one finger or two: see legopose
  | 'jumper'; // a 1 x 2 plate with one stud in its centre: what sits on it moves half a stud

export const KINDS: Kind[] = ['brick', 'plate', 'tile', 'grille', 'technic', 'slope45', 'slope33', 'inv45', 'cheese', 'curve2', 'curve3', 'curve4', 'wedge', 'quarter', 'round', 'roundtile', 'cone', 'dome', 'bar', 'wheel', 'axle', 'bracket', 'hinge', 'jumper']; // prettier-ignore

export interface Piece {
  kind: Kind;
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  rot: 0 | 1 | 2 | 3;
  tone: Tone;
  /** Wedges: which side is cut. */
  hand?: 'L' | 'R';
  /** Wheels and axles: the axis height in plates and the radius in studs. */
  cy?: number;
  r?: number;
  /** The piece every other piece must connect back to. */
  root?: boolean;
  /** Build order, 0..1, set by the model. */
  order?: number;
  /** Brackets: how many studs tall the flange stands (1 when not given). */
  flange?: number;
  /** Hinges: the half with two fingers (60471, the default) or one (44567), which turns on it. */
  fingers?: 1 | 2;
  /** A piece of a sub-assembly: its name, and where its grid sits in the model's. */
  sub?: string;
  pose?: Pose;
}

/** Plates per stud of height, and the height of a technic hole above the brick's bottom. */
export const PLATE = 0.4;
export const HOLE_Y = 1.75;
const WEDGE_TIP = 1; // as the real wing plates (41769, 41770): one stud wide at the tip
// A jumper's one stud is off the grid (between its cells): it is a joint of its own (legojoint).
const SMOOTH: Kind[] = ['jumper', 'tile', 'grille', 'cheese', 'curve2', 'curve3', 'curve4', 'dome', 'wheel', 'axle', 'quarter', 'roundtile', 'bar']; // prettier-ignore
/** Ramps whose top carries studs only on their first row. */
const STUD_ROW: Kind[] = ['slope45', 'slope33'];

/** A local point (u, v) of a piece's footprint on the grid, after its quarter turn. */
export function turn(p: Piece, u: number, v: number): [number, number] {
  if (p.rot === 1) return [p.x + p.d - v, p.z + u];
  if (p.rot === 2) return [p.x + p.w - u, p.z + p.d - v];
  if (p.rot === 3) return [p.x + v, p.z + p.w - u];
  return [p.x + u, p.z + v];
}

/** A wedge's width at its wide end: the real 2 x 2 wings (24299, 24307) stop 0.07 short. */
const wideOf = (p: Piece): number => (p.w === 2 && p.d === 2 ? 1.93 : p.d);
/** A wedge's outline in its own frame: its wide end at u = 0, a one-stud tip at u = w. */
export function wedgeOutline(p: Piece): [number, number][] {
  const [w, d, e] = [p.w, p.d, wideOf(p)];
  return p.hand === 'L'
    ? [[0, d - e], [w, d - WEDGE_TIP], [w, d], [0, d]]
    : [[0, 0], [w, 0], [w, WEDGE_TIP], [0, e]]; // prettier-ignore
}

/** The width of a wedge at u, measured from its straight side. */
const wedgeWidth = (p: Piece, u: number): number => wideOf(p) - ((wideOf(p) - WEDGE_TIP) * u) / p.w;

/** Footprint cells (local i, j) a piece fills, and those that carry a stud. */
export function footprint(p: Piece): { fill: [number, number][]; studs: [number, number][] } {
  const fill: [number, number][] = [];
  const studs: [number, number][] = [];
  for (let i = 0; i < p.w; i++) {
    for (let j = 0; j < p.d; j++) {
      let inside = true;
      let touched = true;
      if (p.kind === 'wedge') {
        // Distance of the cell from the straight side, against the width there.
        const near = p.hand === 'L' ? p.d - (j + 1) : j;
        const far = near + 1;
        touched = near < wedgeWidth(p, i);
        inside = far <= wedgeWidth(p, i + 1);
      }
      if (!touched) continue;
      fill.push([i, j]);
      const studded = !SMOOTH.includes(p.kind) && (!STUD_ROW.includes(p.kind) || i === 0);
      if (studded && inside) studs.push([i, j]);
    }
  }
  return { fill, studs };
}

export const key = (x: number, y: number, z: number): string => `${x},${y},${z}`;
export const cellOf = (p: Piece, i: number, j: number): [number, number] => {
  const [a, b] = turn(p, i + 0.5, j + 0.5);
  return [Math.floor(a), Math.floor(b)];
};

/** Every cell a piece takes up. Wheels take every cell their cylinder reaches; axles none (their
 *  path is checked on its own). */
export function cellsOf(p: Piece): string[] {
  if (p.kind === 'axle') return [];
  if (p.kind === 'wheel') {
    const r = p.r ?? 1;
    const cy = (p.cy ?? 0) * PLATE;
    const out: string[] = [];
    for (let x = Math.floor(p.x - r); x < Math.ceil(p.x + r); x++) {
      for (let y = Math.floor((cy - r) / PLATE); y < Math.ceil((cy + r) / PLATE); y++) {
        const dx = Math.max(x - p.x, 0, p.x - (x + 1));
        const dy = Math.max(y * PLATE - cy, 0, cy - (y + 1) * PLATE);
        if (dx * dx + dy * dy < r * r) for (let z = Math.floor(p.z); z < p.z + p.d; z++) out.push(key(x, y, z));
      }
    }
    return out;
  }
  const out: string[] = [];
  for (const [i, j] of footprint(p).fill) {
    const [x, z] = cellOf(p, i, j);
    for (let y = p.y; y < p.y + p.h; y++) out.push(key(x, y, z));
  }
  // A bracket's flange, with its side studs, takes the row of cells in front of the base, from
  // the base's bottom up the flange's f studs (2.5 f plates).
  if (p.kind === 'bracket')
    for (let i = 0; i < p.w; i++) {
      const [x, z] = cellOf(p, i, -1);
      for (let y = p.y; y < p.y + Math.ceil((p.flange ?? 1) / PLATE); y++) out.push(key(x, y, z));
    }
  // A hinge's knuckle takes the row behind its plate, two plates up (it rises half a plate over
  // the plate's top); the turned-round partner's knuckle shares it.
  if (p.kind === 'hinge')
    for (let i = 0; i < p.w; i++) {
      const [x, z] = cellOf(p, i, p.d);
      out.push(key(x, p.y, z), key(x, p.y + 1, z));
    }
  return out;
}

/** Grid positions of the studs on a piece's top (x, z) and the height they stand on. */
export function studsOf(p: Piece): { at: [number, number][]; top: number } {
  return { at: footprint(p).studs.map(([i, j]) => cellOf(p, i, j)), top: p.y + p.h };
}

/** Where a piece takes studs from below: every bottom cell, but only the stud row of an inverted
 *  slope (the rest of its underside slants) and none on rolling parts. */
export const socketsOf = (p: Piece): string[] =>
  p.kind === 'wheel' || p.kind === 'axle'
    ? []
    : footprint(p)
        .fill.filter(([i]) => p.kind !== 'inv45' || i === 0)
        .map(([i, j]) => {
          const [x, z] = cellOf(p, i, j);
          return key(x, p.y, z);
        });

/** A catalogue shape's name in the parts lists and parts/ldraw-parts.json: kind, short x
 *  long side, plates high, and what tells real parts apart (a wedge's hand, a bracket's flange, a
 *  hinge's fingers); a wheel by radius and width, an axle by length. */
export function partKey(p: Piece): string {
  if (p.kind === 'wheel' || p.kind === 'axle') return p.kind === 'wheel' ? `wheel r${p.r ?? 1} x${p.d}` : `axle ${p.d}`;
  const [a, b] = [p.w, p.d].sort((m, n) => m - n);
  const more = p.kind === 'wedge' ? ` ${p.hand}` : p.kind === 'bracket' ? ` flange${p.flange ?? 1}` : p.kind === 'hinge' ? ` fingers${p.fingers ?? 2}` : ''; // prettier-ignore
  return `${p.kind} ${a}x${b} h${p.h}${more}`;
}
