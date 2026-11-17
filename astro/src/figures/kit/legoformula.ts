import { both } from './legomirror.ts';
import { flap } from './legoaero.ts';
import { onSide } from './legopose.ts';
import { rearWing } from './legorearwing.ts';
import { piece, type Shape } from './legoswap.ts';

/** A Formula 1 car as a LEGO model, designed as shapes on the stud grid (x along the car from the
 *  front wing at 0, z across it with the centre line at 7, y in plates from the ground). Every part
 *  on one side is written once and mirrored (`both`).
 *
 *  Proportions from a current car at one stud = 0.135 m: 39 studs long (5.3 m), 14 wide
 *  (1.9 m), a 25-stud wheelbase (3.4 m), wheels 5.4 studs across (0.72 m), rear tyres wider
 *  than the front. The structure is how a builder would make it stand: a two-plate floor is the
 *  spine (the root); axles run through technic bricks with wishbones above and below; the nose
 *  and the front wing hang from the nose plate on two pillars; the rear wing sits on a pylon, its
 *  endplates hang from it and the beam wing hangs from them; the halo rests on a pillar at the
 *  front and on the airbox. Slopes, curves, wedges and quarter tiles give the surfaces their
 *  angles: the nose's chamfered underside, the sidepods' undercut and coke-bottle tail, the
 *  engine cover's fall to the shark fin, the diffuser's kick. Thin and angled parts are
 *  sub-assemblies: the endplates are tiles (and a plate behind them where the flange cannot reach)
 *  on their side on brackets, and the wings' flaps hang from hinges over a slot, the front wing's
 *  two in a cascade. Both wings are planned from their drawings (JS-LEGO-0001 and -0002, the
 *  `rearwing` and `frontwing` sketches); the hand-over of each rebuild lists where they differ. */

const W = 14;
const WHEEL = { r: 2.7, cy: 6.75 };
const FRONT = 8;
const REAR = 33;
const sym = (list: Shape[]): Shape[] => list.flatMap((s) => both(s, W));

// Front wing: the endplate bracket stands on the footplate; the flaps' hinge on the main plane.
const FW_BRACKET: Shape = { kind: 'part', part: 'bracket', x: 0, y: 1, z: 0, w: 4, d: 2, h: 1, flange: 2, tone: 'line4' }; // prettier-ignore
const FW_HINGE: Shape = { kind: 'part', part: 'hinge', x: 1, y: 2, z: 1, w: 5, d: 1, h: 1, dir: 'z-', tone: 'line4' };
/** The front endplate: tiles straight on the bracket's 4 x 2 flange, one plate thick, its top
 *  front corner rounded (the drawing's 12 mm plate is 54 mm here; a plate under them doubled it). */
const FW_ENDPLATE: Shape = {
  kind: 'sub',
  id: 'front-endplate',
  pose: onSide(piece(FW_BRACKET)),
  shapes: [
    { kind: 'part', part: 'tile', x: 0, y: 0, z: 0, w: 4, d: 1, h: 1, tone: 'inkSoft' },
    { kind: 'part', part: 'quarter', x: 0, y: 0, z: 1, w: 1, d: 1, h: 1, dir: 'z+', tone: 'inkSoft' },
    { kind: 'part', part: 'tile', x: 1, y: 0, z: 1, w: 3, d: 1, h: 1, tone: 'inkSoft' },
  ],
};

export const F1: Shape[] = [
  // Floor: a two-plate spine between the wheels, narrower beside the rear wheels.
  { kind: 'block', x: 6, y: 1, z: 3, w: 24, d: 8, h: 2, tone: 'line3', root: true },
  { kind: 'block', x: 30, y: 1, z: 4, w: 6, d: 6, h: 2, tone: 'line3' },
  ...sym([
    // Floor edges under the spine, cut back toward the nose, and a bargeboard ahead of each pod.
    { kind: 'wedge', x: 13, y: 0, z: 1, len: 4, wid: 3, dir: 'x-', hand: 'R', tone: 'line4' },
    { kind: 'block', x: 17, y: 0, z: 2, w: 12, d: 2, h: 1, tone: 'line4' },
    { kind: 'part', part: 'fin', x: 10, y: 3, z: 3, w: 3, d: 1, h: 3, tone: 'ink2' },
    { kind: 'part', part: 'fin', x: 10, y: 3, z: 4, w: 3, d: 1, h: 2, tone: 'ink2' },
    { kind: 'wedge', x: 29, y: 0, z: 3, len: 4, wid: 2, dir: 'x+', hand: 'L', tone: 'line4' },
    // Axle mounts: a lower wishbone on the floor, the technic brick, an upper wishbone, each
    // wishbone one plate laid across the car so it reaches from the hub to the chassis.
    { kind: 'block', x: FRONT - 1, y: 3, z: 2, w: 2, d: 4, h: 2, lay: 'z', tone: 'line4' },
    { kind: 'technic', x: FRONT - 1, y: 5, z: 5, len: 2, rows: 2, tone: 'line4' },
    { kind: 'block', x: FRONT - 1, y: 8, z: 2, w: 2, d: 4, h: 1, lay: 'z', tone: 'line4' },
    { kind: 'block', x: REAR - 1, y: 3, z: 3, w: 2, d: 4, h: 2, lay: 'z', tone: 'line4' },
    { kind: 'technic', x: REAR - 1, y: 5, z: 5, len: 2, rows: 2, tone: 'line4' },
    { kind: 'block', x: REAR - 1, y: 8, z: 3, w: 2, d: 3, h: 1, lay: 'z', tone: 'line4' },
    // Brake-duct winglets on the upper wishbones.
    { kind: 'part', part: 'fin', x: FRONT - 1, y: 9, z: 2, w: 2, d: 1, h: 2, tone: 'ink2' },
    { kind: 'part', part: 'fin', x: REAR - 1, y: 9, z: 3, w: 2, d: 1, h: 3, tone: 'ink2' },
    // Tiles where the floor shows between the wheels and the pods.
    { kind: 'block', x: 6, y: 3, z: 3, w: 1, d: 4, h: 1, top: 'tiles', tone: 'line3' },
    { kind: 'block', x: 9, y: 3, z: 3, w: 1, d: 2, h: 1, top: 'tiles', tone: 'line3' },
  ]),
  // Survival cell and engine on the floor.
  { kind: 'block', x: 9, y: 3, z: 5, w: 11, d: 4, h: 5, tone: 'inkMuted' },
  { kind: 'block', x: 20, y: 3, z: 5, w: 12, d: 4, h: 5, tone: 'inkMuted' },
  // Front wing, to the drawing of the `frontwing` sketch (kit/legosketches.ts): a footplate on the
  // ground at each tip with the endplate's bracket on it; the main plane an arrowhead of two
  // tapered plates, swept back to the tips; on its back row the hinge for the two active flaps,
  // each a stud in chord at the drawing's angles, the second hung from the first, both inside the
  // endplate's length; a pylon from the middle up to the nose.
  ...sym([
    { kind: 'part', part: 'plate', x: 0, y: 0, z: 0, w: 4, d: 2, h: 1, tone: 'line4' },
    FW_BRACKET,
    { kind: 'part', part: 'tile', x: 0, y: 2, z: 1, w: 1, d: 1, h: 1, tone: 'line4' },
    FW_ENDPLATE,
    { kind: 'wedge', x: 0, y: 1, z: 2, len: 5, wid: 2, dir: 'z-', hand: 'L', tone: 'line4' },
    FW_HINGE,
    flap('front-flap', FW_HINGE, 0.27, 5, (h) => flap('second', h, 0.22, 5, undefined, 1), 1),
  ]),
  { kind: 'part', part: 'plate', x: 1, y: 2, z: 6, w: 1, d: 2, h: 1, tone: 'line4' },
  { kind: 'block', x: 1, y: 3, z: 6, w: 1, d: 2, h: 3, tone: 'line4' },
  // Nose, to the drawing of `nose`: low at the tip on its pylon (top 3.2 studs, drawn 3.0 to
  // 3.5), a curved rise, then a plate bridging onto the front axle's mount (top 4.0, drawn 4.0).
  { kind: 'block', x: 1, y: 6, z: 6, w: 6, d: 2, h: 1, tone: 'inkMuted' },
  { kind: 'part', part: 'quarter', x: 1, y: 7, z: 6, w: 1, d: 1, h: 1, dir: 'x-', tone: 'inkSoft' },
  { kind: 'part', part: 'quarter', x: 1, y: 7, z: 7, w: 1, d: 1, h: 1, dir: 'z+', tone: 'inkSoft' },
  { kind: 'block', x: 2, y: 7, z: 6, w: 1, d: 2, h: 1, top: 'tiles', tone: 'inkSoft' },
  { kind: 'ramp', x: 3, y: 7, z: 6, profile: 'curve2', wid: 2, dir: 'x-', tone: 'inkSoft' },
  { kind: 'block', x: 5, y: 7, z: 6, w: 2, d: 2, h: 1, tone: 'inkMuted' },
  { kind: 'block', x: 5, y: 8, z: 6, w: 4, d: 2, h: 1, tone: 'inkMuted' },
  { kind: 'block', x: 5, y: 9, z: 6, w: 4, d: 2, h: 1, top: 'tiles', tone: 'inkSoft' },
  // Dash in front of the cockpit, the halo's pillar on it.
  { kind: 'block', x: 9, y: 8, z: 5, w: 6, d: 4, h: 3, tone: 'inkSoft' },
  { kind: 'block', x: 9, y: 11, z: 6, w: 5, d: 2, h: 1, top: 'tiles', tone: 'inkSoft' },
  ...sym([{ kind: 'ramp', x: 9, y: 11, z: 5, profile: 'cheese', wid: 5, dir: 'z-', tone: 'inkSoft' }]),
  { kind: 'block', x: 14, y: 11, z: 5, w: 1, d: 4, h: 2, tone: 'inkSoft' },
  // Cockpit: the seat, the helmet a plate proud of the side walls, the walls' rounded fronts.
  { kind: 'block', x: 15, y: 8, z: 6, w: 4, d: 2, h: 2, tone: 'line4' },
  { kind: 'round', x: 16, y: 10, z: 6, size: 2, h: 0, cap: true, tone: 'signal' },
  { kind: 'ramp', x: 18, y: 10, z: 6, profile: 'cheese', wid: 2, dir: 'x-', tone: 'line4' },
  ...sym([{ kind: 'block', x: 15, y: 8, z: 5, w: 5, d: 1, h: 3, top: 'tiles', tone: 'inkSoft' }]),
  // Airbox: the roll hoop's intake with its T-camera, then the engine cover in curved steps.
  { kind: 'block', x: 20, y: 8, z: 5, w: 6, d: 4, h: 5, tone: 'inkSoft' },
  ...sym([{ kind: 'ramp', x: 21, y: 13, z: 5, profile: 'cheese', wid: 5, dir: 'z-', tone: 'inkSoft' }]),
  { kind: 'round', x: 20, y: 13, z: 6, size: 2, h: 3, tone: 'line4' },
  { kind: 'round', x: 21, y: 16, z: 6, size: 1, h: 1, tone: 'line4' },
  { kind: 'part', part: 'tile', x: 21, y: 17, z: 6, w: 1, d: 2, h: 1, tone: 'ink2' },
  { kind: 'ramp', x: 22, y: 13, z: 6, profile: 'curve4', wid: 2, dir: 'x+', tone: 'inkSoft' },
  // Engine cover spine falling to the gearbox as the drawing of `bodywork` does (4.8 studs at
  // x = 27, 3.2 at 32; drawn 4.7 and 3.3), a low shark fin on it, curved shoulders either side.
  { kind: 'block', x: 26, y: 8, z: 6, w: 2, d: 2, h: 4, tone: 'inkSoft' },
  { kind: 'ramp', x: 28, y: 8, z: 6, profile: 'curve4', wid: 2, dir: 'x+', tone: 'inkSoft' },
  { kind: 'part', part: 'fin', x: 26, y: 12, z: 6, w: 2, d: 2, h: 3, tone: 'ink2' },
  ...sym([
    { kind: 'block', x: 26, y: 8, z: 5, w: 4, d: 1, h: 2, tone: 'inkSoft' },
    { kind: 'ramp', x: 26, y: 10, z: 5, profile: 'curve4', wid: 1, dir: 'x+', tone: 'inkSoft' },
    { kind: 'ramp', x: 30, y: 8, z: 5, profile: 'curve2', wid: 1, dir: 'x+', tone: 'inkSoft' },
  ]),
  // Halo: front on its pillar, legs back to the airbox.
  { kind: 'halo', x: 14, y: 13, z: 5, len: 7, wid: 4, dir: 'x-', tone: 'line4' },
  ...sym([
    // Sidepods: an undercut of inverted slopes, a bridging course, a rounded shoulder, louvres,
    // a mirror on its stalk, and a tail that narrows (a wedge) and falls (a curve).
    { kind: 'ramp', x: 13, y: 3, z: 2, profile: 'inv45', wid: 11, dir: 'z-', tone: 'inkSoft' },
    { kind: 'block', x: 13, y: 3, z: 4, w: 11, d: 1, h: 3, tone: 'inkSoft' },
    { kind: 'block', x: 13, y: 6, z: 2, w: 11, d: 3, h: 1, tone: 'inkSoft' },
    { kind: 'ramp', x: 13, y: 7, z: 2, profile: 'curve2', wid: 3, dir: 'x-', tone: 'inkSoft' },
    { kind: 'block', x: 15, y: 7, z: 3, w: 2, d: 2, h: 1, tone: 'inkSoft' },
    { kind: 'block', x: 15, y: 8, z: 3, w: 1, d: 1, h: 1, top: 'tiles', tone: 'inkSoft' },
    { kind: 'block', x: 16, y: 8, z: 3, w: 1, d: 2, h: 1, top: 'tiles', tone: 'inkSoft' },
    { kind: 'block', x: 17, y: 7, z: 3, w: 7, d: 2, h: 1, top: 'grille', tone: 'line4' },
    { kind: 'ramp', x: 15, y: 7, z: 2, profile: 'cheese', wid: 9, dir: 'z-', tone: 'inkSoft' },
    { kind: 'round', x: 15, y: 8, z: 4, size: 1, h: 1, tone: 'line4' },
    { kind: 'part', part: 'cheese', x: 15, y: 9, z: 4, w: 1, d: 1, h: 2, dir: 'z-', tone: 'line4' },
    { kind: 'wedge', x: 24, y: 3, z: 2, len: 4, wid: 2, dir: 'x+', hand: 'L', tone: 'inkSoft' },
    { kind: 'block', x: 24, y: 4, z: 3, w: 4, d: 2, h: 1, tone: 'inkSoft' },
    { kind: 'ramp', x: 24, y: 5, z: 3, profile: 'curve4', wid: 2, dir: 'x+', tone: 'inkSoft' },
  ]),
  // Rear: deck over the diffuser's kick, crash structure, rain light, pylon.
  { kind: 'block', x: 35, y: 3, z: 4, w: 4, d: 6, h: 1, tone: 'line4' },
  ...sym([{ kind: 'block', x: 35, y: 4, z: 4, w: 4, d: 2, h: 1, top: 'grille', tone: 'line3' }]),
  { kind: 'block', x: 38, y: 4, z: 6, w: 1, d: 2, h: 1, top: 'tiles', tone: 'line3' },
  { kind: 'ramp', x: 37, y: 0, z: 4, profile: 'inv45', wid: 6, dir: 'x+', tone: 'line3' },
  { kind: 'block', x: 32, y: 8, z: 6, w: 2, d: 2, h: 1, top: 'tiles', tone: 'inkSoft' },
  { kind: 'block', x: 35, y: 4, z: 6, w: 3, d: 2, h: 3, tone: 'line4' },
  { kind: 'round', x: 37, y: 7, z: 6, size: 1, h: 1, tone: 'signal' },
  ...rearWing(sym),
  // Tiles over the studs that would show: smooth tops where a builder would finish them.
  { kind: 'block', x: 7, y: 3, z: 6, w: 2, d: 2, h: 1, top: 'tiles', tone: 'line3' },
  { kind: 'block', x: 34, y: 3, z: 4, w: 1, d: 6, h: 1, top: 'tiles', tone: 'line3' },
  { kind: 'block', x: 19, y: 8, z: 6, w: 1, d: 2, h: 1, top: 'tiles', tone: 'inkMuted' },
  { kind: 'block', x: 15, y: 10, z: 6, w: 1, d: 2, h: 1, top: 'tiles', tone: 'line4' },
  { kind: 'block', x: 36, y: 7, z: 6, w: 1, d: 2, h: 1, top: 'tiles', tone: 'line4' },
  { kind: 'block', x: 37, y: 7, z: 7, w: 1, d: 1, h: 1, top: 'tiles', tone: 'line4' },
  ...sym([
    { kind: 'block', x: 24, y: 3, z: 4, w: 4, d: 1, h: 1, top: 'tiles', tone: 'line3' },
    { kind: 'block', x: 28, y: 3, z: 3, w: 2, d: 2, h: 1, top: 'tiles', tone: 'line3' },
    { kind: 'block', x: 30, y: 3, z: 4, w: 2, d: 1, h: 1, top: 'tiles', tone: 'line3' },
    { kind: 'block', x: 15, y: 1, z: 2, w: 2, d: 1, h: 1, top: 'tiles', tone: 'line4' },
    { kind: 'block', x: 17, y: 1, z: 2, w: 12, d: 1, h: 1, top: 'tiles', tone: 'line4' },
    { kind: 'block', x: 7, y: 5, z: 2, w: 2, d: 3, h: 1, top: 'tiles', tone: 'line4' },
    { kind: 'block', x: 7, y: 9, z: 3, w: 2, d: 3, h: 1, top: 'tiles', tone: 'line4' },
    { kind: 'block', x: 32, y: 5, z: 3, w: 2, d: 2, h: 1, top: 'tiles', tone: 'line4' },
    { kind: 'block', x: 32, y: 9, z: 4, w: 2, d: 2, h: 1, top: 'tiles', tone: 'line4' },
  ]),
  // Axles and wheels: narrower front tyres, wider rears.
  { kind: 'axle', x: FRONT, cy: WHEEL.cy, z: 0, len: W, tone: 'line4' },
  { kind: 'axle', x: REAR, cy: WHEEL.cy, z: 0, len: W, tone: 'line4' },
  ...sym([{ kind: 'wheel', x: FRONT, cy: WHEEL.cy, z: 0, width: 2, r: WHEEL.r, tone: 'line2' }]),
  ...sym([{ kind: 'wheel', x: REAR, cy: WHEEL.cy, z: 0, width: 3, r: WHEEL.r, tone: 'line2' }]),
];
