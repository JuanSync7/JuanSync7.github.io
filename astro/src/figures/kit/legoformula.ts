import { both } from './legomirror.ts';
import { onHinge, onSide } from './legopose.ts';
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
 *  sub-assemblies: the endplates are a plate and tiles on their side on brackets, and the wings'
 *  flaps hang from hinges over a slot, the front wing's two in a cascade. */

const W = 14;
const WHEEL = { r: 2.7, cy: 6.75 };
const FRONT = 8;
const REAR = 33;
const sym = (list: Shape[]): Shape[] => list.flatMap((s) => both(s, W));

/** A flap: a two-deep hinge plate turned round on its partner, tiled on top. A second flap hangs
 *  from a hinge on the first one's back row, a plate higher, so a slot opens under it. */
const flap = (id: string, hinge: Shape, angle: number, span: number, next?: (h: Shape) => Shape): Shape => {
  const tiles = (d: number): Shape => ({
    kind: 'block',
    x: 0,
    y: 1,
    z: 0,
    w: span,
    d,
    h: 1,
    top: 'tiles',
    tone: 'ink2',
  });
  const back: Shape = { kind: 'part', part: 'hinge', x: 0, y: 1, z: 1, w: span, d: 1, h: 1, tone: 'line4' };
  return {
    kind: 'sub',
    id,
    pose: onHinge(piece(hinge), angle),
    shapes: [
      { kind: 'part', part: 'hinge', x: 0, y: 0, z: 0, w: span, d: 2, h: 1, dir: 'x-', tone: 'line4' },
      ...(next ? [tiles(1), back, next(back)] : [tiles(2)]),
    ],
  };
};
/** A thin endplate: a plate and its tiles, standing on a bracket's side studs, `tall` studs high. */
const endplate = (id: string, bracket: Shape, len: number, tall: number): Shape => ({
  kind: 'sub',
  id,
  pose: onSide(piece(bracket)),
  shapes: [{ kind: 'block', x: 0, y: 0, z: 0, w: len, d: tall, h: 2, top: 'tiles', tone: 'inkSoft' }],
});

// Front wing: the main plane carries an endplate bracket at each tip and, behind its leading edge,
// a riser with the hinge for two flaps, the second hung from the first.
const FW_BRACKET: Shape = { kind: 'part', part: 'bracket', x: 0, y: 3, z: 0, w: 4, d: 2, h: 1, flange: 2, tone: 'line4' }; // prettier-ignore
const FW_HINGE: Shape = { kind: 'part', part: 'hinge', x: 2, y: 4, z: 2, w: 4, d: 1, h: 1, dir: 'z-', tone: 'line4' };
// Rear wing: a bracket at each tip for the endplates, a hinge across the back for the flap.
const RW_BRACKET: Shape = { kind: 'part', part: 'bracket', x: 34, y: 17, z: 3, w: 3, d: 2, h: 1, flange: 3, tone: 'line4' }; // prettier-ignore
const RW_HINGE: Shape = { kind: 'part', part: 'hinge', x: 36, y: 18, z: 4, w: 6, d: 1, h: 1, dir: 'z-', tone: 'line4' };

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
  // Front wing: a two-plate main plane, a cascade of flaps rising to the back, curved endplates.
  { kind: 'block', x: 0, y: 1, z: 0, w: 4, d: 14, h: 2, tone: 'line4' },
  ...sym([
    // The main plane's rounded leading edge, the riser, the flaps, and the endplate.
    { kind: 'ramp', x: 0, y: 3, z: 2, profile: 'cheese', wid: 4, dir: 'x-', tone: 'line4' },
    { kind: 'block', x: 1, y: 3, z: 2, w: 2, d: 4, h: 1, tone: 'line4' },
    { kind: 'block', x: 1, y: 4, z: 2, w: 1, d: 4, h: 1, top: 'tiles', tone: 'line4' },
    FW_HINGE,
    flap('front-flap', FW_HINGE, 0.2, 4, (h) => flap('second', h, 0.3, 4)),
    FW_BRACKET,
    { kind: 'block', x: 0, y: 4, z: 1, w: 4, d: 1, h: 1, top: 'tiles', tone: 'line4' },
    endplate('front-endplate', FW_BRACKET, 4, 2),
    // A footplate under each endplate.
    { kind: 'block', x: 0, y: 0, z: 0, w: 4, d: 1, h: 1, tone: 'line4' },
  ]),
  { kind: 'block', x: 3, y: 3, z: 6, w: 1, d: 2, h: 5, tone: 'line4' },
  { kind: 'ramp', x: 0, y: 3, z: 6, profile: 'cheese', wid: 2, dir: 'x-', tone: 'line4' },
  { kind: 'block', x: 1, y: 3, z: 6, w: 2, d: 2, h: 1, top: 'tiles', tone: 'line4' },
  // Nose: a plate over the pillars and the front axle, a chamfered underside, a rounded tip.
  { kind: 'block', x: 2, y: 8, z: 6, w: 7, d: 2, h: 1, tone: 'inkMuted' },
  { kind: 'ramp', x: 4, y: 5, z: 6, profile: 'inv45', wid: 2, dir: 'x-', tone: 'inkMuted' },
  { kind: 'part', part: 'quarter', x: 2, y: 9, z: 6, w: 1, d: 1, h: 1, dir: 'x-', tone: 'inkSoft' },
  { kind: 'part', part: 'quarter', x: 2, y: 9, z: 7, w: 1, d: 1, h: 1, dir: 'z+', tone: 'inkSoft' },
  { kind: 'block', x: 3, y: 9, z: 6, w: 2, d: 2, h: 1, top: 'tiles', tone: 'inkSoft' },
  { kind: 'ramp', x: 5, y: 9, z: 6, profile: 'curve4', wid: 2, dir: 'x-', tone: 'inkSoft' },
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
  // Engine cover spine with the shark fin, curved shoulders either side, the tail onto the gearbox.
  { kind: 'block', x: 26, y: 8, z: 6, w: 6, d: 2, h: 5, tone: 'inkSoft' },
  { kind: 'part', part: 'fin', x: 26, y: 13, z: 6, w: 6, d: 2, h: 6, tone: 'ink2' },
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
  { kind: 'block', x: 35, y: 7, z: 6, w: 1, d: 2, h: 8, tone: 'line4' },
  // Rear wing: a two-plate main plane with a rounded leading edge; behind it, over a slot, the
  // flap on its hinge; thin endplates on brackets at the tips, struts below, the beam wing.
  { kind: 'block', x: 34, y: 15, z: 3, w: 4, d: 8, h: 2, tone: 'inkSoft' },
  { kind: 'ramp', x: 34, y: 17, z: 5, profile: 'cheese', wid: 4, dir: 'x-', tone: 'inkSoft' },
  { kind: 'block', x: 35, y: 17, z: 5, w: 1, d: 4, h: 1, top: 'tiles', tone: 'inkSoft' },
  { kind: 'block', x: 36, y: 17, z: 5, w: 1, d: 4, h: 1, tone: 'line4' },
  { kind: 'block', x: 37, y: 17, z: 5, w: 1, d: 4, h: 1, top: 'tiles', tone: 'inkSoft' },
  RW_HINGE,
  flap('rear-flap', RW_HINGE, 0.45, 6),
  ...sym([
    { kind: 'block', x: 34, y: 10, z: 3, w: 4, d: 1, h: 5, tone: 'line4' },
    RW_BRACKET,
    { kind: 'block', x: 34, y: 18, z: 4, w: 2, d: 1, h: 1, top: 'tiles', tone: 'line4' },
    endplate('rear-endplate', RW_BRACKET, 4, 3),
  ]),
  { kind: 'block', x: 36, y: 8, z: 3, w: 2, d: 8, h: 2, tone: 'ink2' },
  // Tiles over the studs that would show: smooth tops where a builder would finish them.
  { kind: 'block', x: 7, y: 3, z: 6, w: 2, d: 2, h: 1, top: 'tiles', tone: 'line3' },
  { kind: 'block', x: 34, y: 3, z: 4, w: 1, d: 6, h: 1, top: 'tiles', tone: 'line3' },
  { kind: 'block', x: 19, y: 8, z: 6, w: 1, d: 2, h: 1, top: 'tiles', tone: 'inkMuted' },
  { kind: 'block', x: 15, y: 10, z: 6, w: 1, d: 2, h: 1, top: 'tiles', tone: 'line4' },
  { kind: 'block', x: 36, y: 7, z: 6, w: 1, d: 2, h: 1, top: 'tiles', tone: 'line4' },
  { kind: 'block', x: 37, y: 7, z: 7, w: 1, d: 1, h: 1, top: 'tiles', tone: 'line4' },
  { kind: 'block', x: 36, y: 10, z: 4, w: 2, d: 6, h: 1, top: 'tiles', tone: 'ink2' },
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
    { kind: 'block', x: 37, y: 17, z: 3, w: 1, d: 2, h: 1, top: 'tiles', tone: 'inkSoft' },
  ]),
  // Axles and wheels: narrower front tyres, wider rears.
  { kind: 'axle', x: FRONT, cy: WHEEL.cy, z: 0, len: W, tone: 'line4' },
  { kind: 'axle', x: REAR, cy: WHEEL.cy, z: 0, len: W, tone: 'line4' },
  ...sym([{ kind: 'wheel', x: FRONT, cy: WHEEL.cy, z: 0, width: 2, r: WHEEL.r, tone: 'line2' }]),
  ...sym([{ kind: 'wheel', x: REAR, cy: WHEEL.cy, z: 0, width: 3, r: WHEEL.r, tone: 'line2' }]),
];
