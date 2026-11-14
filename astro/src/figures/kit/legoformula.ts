import type { Shape } from './legoswap.ts';

/** A Formula 1 car as a LEGO model, designed as shapes on the stud grid (x along the car from the
 *  front wing at 0, z across it, centre line at 7, y in plates from the ground).
 *
 *  Proportions from a current car at one stud = 0.135 m: 39 studs long (5.3 m), 14 wide
 *  (1.9 m), a 25-stud wheelbase (3.4 m), wheels 5.4 studs across (0.72 m), rear tyres wider
 *  than the front. The structure is how a builder would make it stand: a floor plate is the
 *  spine (the root); axles run through technic bricks on stacks from the floor; the nose and
 *  front wing hang from the nose plate on two pillars; the rear wing sits on one pylon with its
 *  endplates hanging from it; the halo rests on a pillar at the front and on the airbox. */

const W = { r: 2.7, cy: 6.75 };
const FRONT = 8;
const REAR = 33;

export const F1: Shape[] = [
  // Floor: the spine, wide between the wheels, narrow beside the rear wheels.
  { kind: 'block', x: 6, y: 1, z: 2, w: 24, d: 10, h: 1, tone: 'line3', root: true },
  { kind: 'block', x: 30, y: 1, z: 4, w: 6, d: 6, h: 1, tone: 'line3' },
  // Floor edges, cut back toward the nose.
  { kind: 'wedge', x: 13, y: 0, z: 0, len: 4, wid: 3, dir: 'x-', hand: 'R', tone: 'line4' },
  { kind: 'wedge', x: 13, y: 0, z: 11, len: 4, wid: 3, dir: 'x-', hand: 'L', tone: 'line4' },
  // Axle mounts: stacks on the floor with technic bricks on top, holes across the car.
  { kind: 'block', x: FRONT - 1, y: 2, z: 5, w: 2, d: 4, h: 3, tone: 'line4' },
  { kind: 'technic', x: FRONT - 1, y: 5, z: 5, len: 2, rows: 4, tone: 'line4' },
  { kind: 'block', x: REAR - 1, y: 2, z: 5, w: 2, d: 4, h: 3, tone: 'line4' },
  { kind: 'technic', x: REAR - 1, y: 5, z: 5, len: 2, rows: 4, tone: 'line4' },
  // Survival cell and engine on the floor.
  { kind: 'block', x: 9, y: 2, z: 5, w: 11, d: 4, h: 6, tone: 'inkMuted' },
  { kind: 'block', x: 20, y: 2, z: 5, w: 12, d: 4, h: 6, tone: 'inkMuted' },
  // Front wing: main plane, flaps, endplates, and the two pillars up to the nose.
  // Two plates thick: a single course of plates only holds together where something bridges it.
  { kind: 'block', x: 0, y: 1, z: 0, w: 4, d: 14, h: 2, tone: 'line4' },
  { kind: 'block', x: 2, y: 3, z: 1, w: 2, d: 5, h: 1, top: 'tiles', tone: 'ink2' },
  { kind: 'block', x: 2, y: 3, z: 8, w: 2, d: 5, h: 1, top: 'tiles', tone: 'ink2' },
  { kind: 'block', x: 0, y: 3, z: 0, w: 4, d: 1, h: 3, tone: 'inkSoft' },
  { kind: 'block', x: 0, y: 3, z: 13, w: 4, d: 1, h: 3, tone: 'inkSoft' },
  { kind: 'block', x: 3, y: 3, z: 6, w: 1, d: 2, h: 5, tone: 'line4' },
  // Nose: a plate from the pillars back over the front axle, a smooth tip, a curved rise.
  { kind: 'block', x: 2, y: 8, z: 6, w: 7, d: 2, h: 1, tone: 'inkMuted' },
  { kind: 'block', x: 2, y: 9, z: 6, w: 3, d: 2, h: 1, top: 'tiles', tone: 'inkSoft' },
  { kind: 'ramp', x: 5, y: 9, z: 6, profile: 'curve4', wid: 2, dir: 'x-', tone: 'inkSoft' },
  // Dash in front of the cockpit, the halo's pillar on it.
  { kind: 'block', x: 9, y: 8, z: 5, w: 6, d: 4, h: 3, tone: 'inkSoft' },
  { kind: 'block', x: 9, y: 11, z: 5, w: 5, d: 4, h: 1, top: 'tiles', tone: 'inkSoft' },
  { kind: 'block', x: 14, y: 11, z: 5, w: 1, d: 4, h: 2, tone: 'inkSoft' },
  // Cockpit: seat, the driver's helmet standing a plate proud of the two side walls.
  { kind: 'block', x: 15, y: 8, z: 6, w: 4, d: 2, h: 2, tone: 'line4' },
  { kind: 'round', x: 16, y: 10, z: 6, size: 2, h: 0, cap: true, tone: 'signal' },
  { kind: 'block', x: 15, y: 8, z: 5, w: 5, d: 1, h: 3, top: 'tiles', tone: 'inkSoft' },
  { kind: 'block', x: 15, y: 8, z: 8, w: 5, d: 1, h: 3, top: 'tiles', tone: 'inkSoft' },
  // Airbox and engine cover, falling in curved steps to the gearbox.
  { kind: 'block', x: 20, y: 8, z: 5, w: 6, d: 4, h: 5, tone: 'inkSoft' },
  { kind: 'round', x: 20, y: 13, z: 6, size: 2, h: 3, tone: 'line4' },
  { kind: 'ramp', x: 22, y: 13, z: 6, profile: 'curve4', wid: 2, dir: 'x+', tone: 'inkSoft' },
  { kind: 'block', x: 26, y: 8, z: 5, w: 4, d: 4, h: 2, tone: 'inkSoft' },
  { kind: 'ramp', x: 26, y: 10, z: 5, profile: 'curve4', wid: 4, dir: 'x+', tone: 'inkSoft' },
  { kind: 'ramp', x: 30, y: 8, z: 5, profile: 'curve2', wid: 4, dir: 'x+', tone: 'inkSoft' },
  // Halo: front on its pillar, legs back to the airbox.
  { kind: 'halo', x: 14, y: 13, z: 5, len: 7, wid: 4, dir: 'x-', tone: 'line4' },
  // Sidepods: rounded shoulders, louvred tops, curved tails; mirrors on stalks.
  ...[2, 9].flatMap((z): Shape[] => [
    { kind: 'block', x: 13, y: 2, z, w: 11, d: 3, h: 5, tone: 'inkSoft' },
    { kind: 'ramp', x: 13, y: 7, z, profile: 'curve2', wid: 3, dir: 'x-', tone: 'inkSoft' },
    { kind: 'block', x: 15, y: 7, z, w: 2, d: 3, h: 1, tone: 'inkSoft' },
    { kind: 'block', x: 17, y: 7, z, w: 7, d: 3, h: 1, top: 'grille', tone: 'line4' },
    { kind: 'block', x: 24, y: 2, z, w: 4, d: 3, h: 2, tone: 'inkSoft' },
    { kind: 'ramp', x: 24, y: 4, z, profile: 'curve4', wid: 3, dir: 'x+', tone: 'inkSoft' },
    { kind: 'round', x: 15, y: 8, z: z === 2 ? 4 : 9, size: 1, h: 1, tone: 'line4' },
  ]),
  // Gearbox, crash structure with the rain light, the pylon and the rear wing.
  { kind: 'block', x: 34, y: 2, z: 6, w: 3, d: 2, h: 3, tone: 'line4' },
  { kind: 'round', x: 36, y: 5, z: 6, size: 1, h: 1, tone: 'signal' },
  { kind: 'block', x: 34, y: 5, z: 6, w: 2, d: 2, h: 9, tone: 'line4' },
  { kind: 'block', x: 34, y: 14, z: 3, w: 4, d: 8, h: 2, tone: 'inkSoft' },
  { kind: 'block', x: 35, y: 16, z: 3, w: 2, d: 8, h: 1, top: 'tiles', tone: 'ink2' },
  { kind: 'block', x: 34, y: 8, z: 3, w: 4, d: 1, h: 6, tone: 'line4' },
  { kind: 'block', x: 34, y: 8, z: 10, w: 4, d: 1, h: 6, tone: 'line4' },
  // Axles and wheels: narrower front tyres, wider rears.
  { kind: 'axle', x: FRONT, cy: W.cy, z: 0, len: 14, tone: 'line4' },
  { kind: 'axle', x: REAR, cy: W.cy, z: 0, len: 14, tone: 'line4' },
  ...[0, 12].map((z): Shape => ({ kind: 'wheel', x: FRONT, cy: W.cy, z, width: 2, r: W.r, tone: 'line2' })),
  ...[0, 11].map((z): Shape => ({ kind: 'wheel', x: REAR, cy: W.cy, z, width: 3, r: W.r, tone: 'line2' })),
];
