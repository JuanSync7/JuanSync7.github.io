// One source: JuanSync7/frontend-kit, bricks/src (@juansync7/bricks). A project's copy is synced from it, never edited.
import { onHinge, onSide } from './legopose.ts';
import { piece, type Shape } from './legoswap.ts';

/** The joint rig: the smallest model with every joint that is not a stud pressed down. A bracket
 *  on a base with a tile on its side studs, a hinge with a flap turned up on it, and a jumper with
 *  a tile half a stud over on it. It must pass the checks as built; `scripts/selftest.mjs` breaks it
 *  one way per fixture. */

const tone = 'ink2';
export const br: Shape = { kind: 'part', part: 'bracket', x: 2, y: 2, z: 1, w: 2, d: 1, h: 1, tone };
export const hg: Shape = { kind: 'part', part: 'hinge', x: 2, y: 2, z: 4, w: 2, d: 1, h: 1, tone };
const tile: Shape = { kind: 'part', part: 'tile', x: 0, y: 0, z: 0, w: 2, d: 1, h: 1, tone: 'inkStrong' };
export const side = (b: Shape): Shape => ({ kind: 'sub', id: 'side', pose: onSide(piece(b)), shapes: [tile] });
export const flap = (angle: number, shapes: Shape[]): Shape => ({ kind: 'sub', id: 'flap', pose: onHinge(piece(hg), angle), shapes }); // prettier-ignore
export const leaf: Shape[] = [
  { kind: 'part', part: 'hinge', x: 0, y: 0, z: 0, w: 2, d: 1, h: 1, dir: 'x-', fingers: 1, tone: 'inkStrong' },
  { kind: 'part', part: 'plate', x: 0, y: 1, z: 0, w: 2, d: 3, h: 1, tone: 'inkStrong' },
];
/** A jumper, and a tile half a stud over on its one centre stud. */
export const jumper: Shape = { kind: 'part', part: 'jumper', x: 6, y: 2, z: 1, w: 1, d: 2, h: 1, tone };
export const half: Shape = {
  kind: 'sub',
  id: 'half',
  pose: { r: [1, 0, 0, 0, 1, 0, 0, 0, 1], o: [0, 0, 0.5] },
  shapes: [{ kind: 'part', part: 'tile', x: 6, y: 3, z: 1, w: 1, d: 1, h: 1, tone: 'inkStrong' }],
};
export const RIG: Shape[] = [
  { kind: 'block', x: 0, y: 0, z: 0, w: 8, d: 6, h: 2, root: true, tone: 'line2' },
  br,
  hg,
  side(br),
  flap(0.3, leaf),
  jumper,
  half,
];
