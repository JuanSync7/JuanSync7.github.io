import { flap } from './legoaero.ts';
import { onSide } from './legopose.ts';
import { piece, type Shape } from './legoswap.ts';

/** The F1's rear wing, built to the reference sketch `rearwing` (kit/legosketches.ts): the 2026
 *  layout of three elements stacked up and back, no beam wing, endplates with their lights, and
 *  the wing held from below by two pillars on the crash structure. In the F1's frame (rear axle
 *  x = 33, centre z = 7); `sym` mirrors one side onto the other. */

// The main plane: a plate between the endplate brackets, on the pillars, under a row of hinge.
const BRACKET: Shape = { kind: 'part', part: 'bracket', x: 35, y: 12, z: 3, w: 1, d: 2, h: 1, flange: 2, tone: 'line4' }; // prettier-ignore
const HINGE: Shape = { kind: 'part', part: 'hinge', x: 35, y: 13, z: 4, w: 6, d: 1, h: 1, dir: 'z-', tone: 'line4' };

/** The endplate: two studs on the bracket, a lower row set back to clear the tyre, the light at
 *  the bottom of the trailing edge; the tiles over the lower row tie it to the upper. */
const ENDPLATE: Shape = {
  kind: 'sub',
  id: 'rear-endplate',
  pose: onSide(piece(BRACKET)),
  shapes: [
    { kind: 'part', part: 'plate', x: 0, y: 0, z: 0, w: 4, d: 2, h: 1, tone: 'inkSoft' },
    { kind: 'part', part: 'plate', x: 1, y: 0, z: -1, w: 3, d: 1, h: 1, tone: 'inkSoft' },
    { kind: 'part', part: 'tile', x: 0, y: 1, z: 1, w: 4, d: 1, h: 1, tone: 'inkSoft' },
    { kind: 'part', part: 'tile', x: 0, y: 1, z: 0, w: 1, d: 1, h: 1, tone: 'inkSoft' },
    { kind: 'part', part: 'tile', x: 1, y: 1, z: -1, w: 2, d: 2, h: 1, tone: 'inkSoft' },
    { kind: 'part', part: 'tile', x: 3, y: 1, z: 0, w: 1, d: 1, h: 1, tone: 'inkSoft' },
    { kind: 'part', part: 'tile', x: 3, y: 1, z: -1, w: 1, d: 1, h: 1, tone: 'signal' },
  ],
};

export const rearWing = (sym: (list: Shape[]) => Shape[]): Shape[] => [
  // Two pillars, round, from the crash structure up to the main plane.
  { kind: 'round', x: 35, y: 7, z: 6, size: 1, h: 5, tone: 'line4' },
  { kind: 'round', x: 35, y: 7, z: 7, size: 1, h: 5, tone: 'line4' },
  { kind: 'block', x: 35, y: 12, z: 5, w: 1, d: 4, h: 1, tone: 'inkSoft' },
  HINGE,
  // The second element (larger chord) on the main plane's hinge, the third on the second's.
  flap('rear-wing', HINGE, 0.12, 6, (h) => flap('top', h, 0.2, 6, undefined, 1)),
  ...sym([BRACKET, ENDPLATE]),
];
