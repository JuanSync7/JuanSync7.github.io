import type { NightKey } from '../../styles/tokens/palette.ts';
import { onHinge, onSide, type Pose } from './legopose.ts';
import { piece, type Shape } from './legoswap.ts';

/** The F1's rear wing, built to the reference sketch `rearwing` (kit/legosketches.ts): the 2026
 *  layout of three elements stacked up and back, no beam wing, endplates with their lights, the
 *  central actuator, and the wing held from below by two pillars on the crash structure. In the
 *  F1's frame (rear axle x = 33, centre z = 7); `sym` mirrors one side onto the other.
 *
 *  The elements reach the endplates: their hinge row sits on jumper plates, half a stud across,
 *  so the row spans 7 studs centred between the brackets' flanges, a tenth of a stud from each.
 *  Heights are the drawing's (JS-LEGO-0001): the hinge's knuckle at the second element's leading
 *  edge (5.4 studs), the actuator a low fairing, not a post. */

const BRACKET: Shape = { kind: 'part', part: 'bracket', x: 35, y: 11, z: 3, w: 1, d: 2, h: 1, flange: 3, tone: 'line4' }; // prettier-ignore
const SPAN = 7;
// The hinge row, half a stud over (its own grid), on the jumpers' centre studs.
const HALF: Pose = { r: [1, 0, 0, 0, 1, 0, 0, 0, 1], o: [0, 0, 0.5] };
const HINGE: Shape = { kind: 'part', part: 'hinge', x: 35, y: 13, z: 3, w: SPAN, d: 1, h: 1, dir: 'z-', tone: 'line4' }; // prettier-ignore
const tiles = (x: number, z: number, w: number, d: number, tone: NightKey = 'ink2'): Shape => ({ kind: 'block', x, y: 1, z, w, d, h: 1, top: 'tiles', tone }); // prettier-ignore

/** The third element: short and steep, on a hinge at the second's trailing edge. */
const third = (h: Shape): Shape => ({
  kind: 'sub',
  id: 'third',
  pose: onHinge(piece(h), 0.36),
  shapes: [{ kind: 'part', part: 'hinge', x: 0, y: 0, z: 0, w: SPAN, d: 1, h: 1, dir: 'x-', tone: 'line4' }, tiles(0, 0, SPAN, 1)], // prettier-ignore
});
/** The second element (the larger chord): its front row tiled either side of the actuator pod,
 *  its back row the hinge for the third. */
const BACK: Shape = { kind: 'part', part: 'hinge', x: 0, y: 1, z: 1, w: SPAN, d: 1, h: 1, tone: 'line4' };
const SECOND: Shape = {
  kind: 'sub',
  id: 'second',
  pose: onHinge(piece(HINGE), 0.28),
  shapes: [
    { kind: 'part', part: 'hinge', x: 0, y: 0, z: 0, w: SPAN, d: 2, h: 1, dir: 'x-', tone: 'line4' },
    tiles(0, 0, 3, 1),
    { kind: 'part', part: 'cheese', x: 3, y: 1, z: 0, w: 1, d: 1, h: 2, dir: 'z+', tone: 'line4' },
    tiles(4, 0, 3, 1),
    BACK,
    third(BACK),
  ],
};

/** The endplate on the bracket's side studs, a row below its foot and three up the flange: its
 *  leading edge raked back over the tyre (a tapered plate, the middle row a stud short), a plate
 *  across the top two rows, tiles over all, the light low on the trailing edge. */
const ENDPLATE: Shape = {
  kind: 'sub',
  id: 'rear-endplate',
  pose: onSide(piece(BRACKET)),
  shapes: [
    { kind: 'wedge', x: 1, y: 0, z: -1, len: 2, wid: 2, dir: 'x-', hand: 'R', tone: 'inkSoft' },
    { kind: 'part', part: 'plate', x: 3, y: 0, z: -1, w: 1, d: 2, h: 1, tone: 'inkSoft' },
    { kind: 'part', part: 'plate', x: 0, y: 0, z: 1, w: 4, d: 2, h: 1, tone: 'inkSoft' },
    { kind: 'part', part: 'tile', x: 1, y: 1, z: 0, w: 3, d: 2, h: 1, tone: 'inkSoft' },
    { kind: 'part', part: 'tile', x: 0, y: 1, z: 1, w: 1, d: 2, h: 1, tone: 'inkSoft' },
    { kind: 'part', part: 'tile', x: 1, y: 1, z: 2, w: 3, d: 1, h: 1, tone: 'inkSoft' },
    { kind: 'part', part: 'tile', x: 3, y: 1, z: -1, w: 1, d: 1, h: 1, tone: 'signal' },
  ],
};

export const rearWing = (sym: (list: Shape[]) => Shape[]): Shape[] => [
  // Two pillars, round, from the crash structure up to the main plane.
  { kind: 'round', x: 35, y: 7, z: 6, size: 1, h: 4, tone: 'line4' },
  { kind: 'round', x: 35, y: 7, z: 7, size: 1, h: 4, tone: 'line4' },
  // The main plane between the brackets, the jumpers on it, the hinge row on them.
  { kind: 'block', x: 35, y: 11, z: 5, w: 1, d: 4, h: 1, tone: 'inkSoft' },
  { kind: 'part', part: 'jumper', x: 35, y: 12, z: 4, w: 1, d: 2, h: 1, tone: 'inkSoft' },
  { kind: 'part', part: 'jumper', x: 35, y: 12, z: 6, w: 1, d: 2, h: 1, tone: 'inkSoft' },
  { kind: 'part', part: 'jumper', x: 35, y: 12, z: 8, w: 1, d: 2, h: 1, tone: 'inkSoft' },
  { kind: 'sub', id: 'rear-hinge', pose: HALF, shapes: [HINGE, SECOND] },
  ...sym([BRACKET, ENDPLATE]),
];
