import { flap, flapTiles } from './legoaero.ts';
import { onSide } from './legopose.ts';
import { piece, type Shape } from './legoswap.ts';

/** The F1's rear wing, built to the reference sketch `rearwing` (kit/legosketches.ts): the 2026
 *  layout of three elements stacked up and back, no beam wing, endplates with their lights, the
 *  central actuator, and the wing held from below by two pillars on the crash structure. In the
 *  F1's frame (rear axle x = 33, centre z = 7); `sym` mirrors one side onto the other.
 *
 *  The elements span 6 studs (z 4 to 10) on real click hinges, the endplates on two up brackets
 *  (99207) just outside them, so the wing is 8 studs (1.08 m) across against the drawing's 1.13 m.
 *  The hinge's knuckle sits at the second element's leading edge, 5.5 studs up (drawn 5.4). */

const BRACKET: Shape = { kind: 'part', part: 'bracket', x: 35, y: 12, z: 4, w: 2, d: 1, h: 1, flange: 2, tone: 'line4' }; // prettier-ignore
const SPAN = 6;
const HINGE: Shape = { kind: 'part', part: 'hinge', x: 35, y: 13, z: 4, w: SPAN, d: 1, h: 1, dir: 'z-', tone: 'line4' }; // prettier-ignore

/** The actuator, a low fairing on the middle of the row the third element hangs from. */
const ACTUATOR: Shape[] = [
  flapTiles(2, 0, 2),
  ...[2, 3].map((x): Shape => ({ kind: 'part', part: 'cheese', x, y: 2, z: 0, w: 1, d: 1, h: 2, dir: 'z+', tone: 'line4' })),
  flapTiles(2, 4, 2),
]; // prettier-ignore
/** The second element, hung from the main plane, the third (short and steep) hung from it. */
const SECOND = flap('second', HINGE, 0.28, SPAN, (h) => flap('third', h, 0.36, SPAN), ACTUATOR);

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
  { kind: 'round', x: 35, y: 7, z: 6, size: 1, h: 5, tone: 'line4' },
  { kind: 'round', x: 35, y: 7, z: 7, size: 1, h: 5, tone: 'line4' },
  // The main plane between the brackets, the hinge row on both.
  { kind: 'block', x: 35, y: 12, z: 5, w: 1, d: 4, h: 1, tone: 'inkSoft' },
  HINGE,
  { kind: 'block', x: 35, y: 14, z: 4, w: 1, d: SPAN, h: 1, top: 'tiles', tone: 'inkSoft' },
  SECOND,
  ...sym([BRACKET, ENDPLATE]),
];
