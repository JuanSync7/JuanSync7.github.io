// One source: JuanSync7/frontend-kit, bricks/src (@juansync7/bricks). A project's copy is synced from it, never edited.
import { partKey, type Kind, type Piece } from './legoset.ts';
import { sizesOf } from './legoswap.ts';

/** The catalogue: every shape a model can be swapped into, once each, at the origin. Each stands
 *  for one real LEGO part, named by `partKey` in `parts/ldraw-parts.json` and compared with it by
 *  `scripts/reference.mjs`; a project's models may use these shapes and no others. */
const one = (kind: Kind, w: number, d: number, h: number, more: Partial<Piece> = {}): Piece => ({ kind, x: 0, y: 0, z: 0, w, d, h, rot: 0, tone: 'ink', ...more }); // prettier-ignore
const laid = (kind: Kind, h: number): Piece[] => sizesOf(kind).filter(([w, d]) => w >= d).map(([w, d]) => one(kind, w, d, h)); // prettier-ignore

export const CATALOGUE: Piece[] = [
  ...laid('brick', 3),
  ...laid('plate', 1),
  ...laid('tile', 1),
  one('grille', 2, 1, 1),
  one('cheese', 1, 1, 2),
  one('curve2', 2, 1, 2),
  one('curve3', 3, 1, 3),
  one('curve4', 4, 1, 3),
  one('slope33', 3, 1, 3),
  one('slope45', 2, 1, 3),
  one('inv45', 2, 1, 3),
  one('technic', 2, 1, 3),
  one('round', 1, 1, 1),
  one('round', 1, 1, 3),
  one('round', 2, 2, 3),
  one('quarter', 1, 1, 1),
  one('roundtile', 1, 1, 1),
  one('cone', 1, 1, 3),
  one('bar', 1, 1, 10),
  one('dome', 2, 2, 3),
  one('dome', 4, 4, 5),
  ...(['L', 'R'] as const).flatMap((hand) => [one('wedge', 4, 2, 1, { hand }), one('wedge', 2, 2, 1, { hand })]),
  one('jumper', 1, 2, 1),
  one('bracket', 2, 1, 1, { flange: 1 }),
  one('bracket', 2, 1, 1, { flange: 2 }),
  one('hinge', 2, 1, 1, { fingers: 2 }),
  one('hinge', 2, 1, 1, { fingers: 1 }),
  one('wheel', 0, 1.9, 0, { r: 2.7, cy: 7 }),
  one('wheel', 0, 2.7, 0, { r: 2.7, cy: 7 }),
  one('axle', 0, 12, 0, { r: 0.3, cy: 0 }),
];

/** Every catalogue shape's name: a model's piece outside this set is not a real part. */
export const CATALOGUE_KEYS: ReadonlySet<string> = new Set(CATALOGUE.map(partKey));
