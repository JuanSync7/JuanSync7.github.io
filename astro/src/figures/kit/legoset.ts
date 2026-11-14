import type { NightKey } from '../../styles/tokens/palette.ts';

/** The LEGO parts catalogue as data: what each piece kind fills, where its studs are. Pure: no
 *  three, so `scripts/lego/check.mjs` runs it in node. The checks are in `legocheck.ts`.
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
  | 'dome' // 2 x 2 dome: a helmet, a light
  | 'uplate' // a U-shaped plate: a ring with two legs (the F1 halo)
  | 'wheel' // rim and tyre on an axle along z
  | 'axle'; // a cross axle along z

export const KINDS: Kind[] = ['brick', 'plate', 'tile', 'grille', 'technic', 'slope45', 'cheese', 'curve2', 'curve4', 'wedge', 'round', 'dome', 'uplate', 'wheel', 'axle']; // prettier-ignore

export interface Piece {
  kind: Kind;
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  rot: 0 | 1 | 2 | 3;
  tone: NightKey;
  /** Wedges: which side is cut. */
  hand?: 'L' | 'R';
  /** Wheels and axles: the axis height in plates and the radius in studs. */
  cy?: number;
  r?: number;
  /** The piece every other piece must connect back to. */
  root?: boolean;
  /** Build order, 0..1, set by the model. */
  order?: number;
}

/** Plates per stud of height, and the height of a technic hole above the brick's bottom. */
export const PLATE = 0.4;
export const HOLE_Y = 1.75;
const WEDGE_TIP = 0.5;
const SMOOTH: Kind[] = ['tile', 'grille', 'cheese', 'curve2', 'curve4', 'dome', 'uplate', 'wheel', 'axle'];

/** A local point (u, v) of a piece's footprint on the grid, after its quarter turn. */
export function turn(p: Piece, u: number, v: number): [number, number] {
  if (p.rot === 1) return [p.x + p.d - v, p.z + u];
  if (p.rot === 2) return [p.x + p.w - u, p.z + p.d - v];
  if (p.rot === 3) return [p.x + v, p.z + p.w - u];
  return [p.x + u, p.z + v];
}

/** A wedge's outline in its own frame: full width at u = 0, a half-stud tip at u = w. */
export function wedgeOutline(p: Piece): [number, number][] {
  const { w, d } = p;
  return p.hand === 'L'
    ? [[0, 0], [w, d - WEDGE_TIP], [w, d], [0, d]]
    : [[0, 0], [w, 0], [w, WEDGE_TIP], [0, d]]; // prettier-ignore
}

/** The width of a wedge at u, measured from its straight side. */
const wedgeWidth = (p: Piece, u: number): number => p.d - ((p.d - WEDGE_TIP) * u) / p.w;

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
      if (p.kind === 'uplate') touched = j === 0 || j === p.d - 1 || i === p.w - 1;
      if (!touched) continue;
      fill.push([i, j]);
      const studded = !SMOOTH.includes(p.kind) && (p.kind !== 'slope45' || i === 0);
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
        if (dx * dx + dy * dy < r * r) for (let z = p.z; z < p.z + p.d; z++) out.push(key(x, y, z));
      }
    }
    return out;
  }
  const out: string[] = [];
  for (const [i, j] of footprint(p).fill) {
    const [x, z] = cellOf(p, i, j);
    for (let y = p.y; y < p.y + p.h; y++) out.push(key(x, y, z));
  }
  return out;
}

/** Grid positions of the studs on a piece's top (x, z) and the height they stand on. */
export function studsOf(p: Piece): { at: [number, number][]; top: number } {
  return { at: footprint(p).studs.map(([i, j]) => cellOf(p, i, j)), top: p.y + p.h };
}
