import { reveal } from './drawing/monodraw';
import type { Sketch, V3 } from './drawing/monoline';
import { cable } from './drawing/cable';
import { ease, floor, FRAME, PX, shift } from './expbase';
import type { Small } from './hiddenshared';

/** Agentic delivery (`experience-icon`, agents): the customer's requirement on a clipboard at a
 *  lectern at the head of the line, and a conveyor running through three task stations. Each station's roof carries its
 *  typed ports, an inlet and an outlet, square or round. One part rides the belt: it goes into a
 *  station square and comes out round, into the next round and out square. A thread tied to the
 *  requirement's clip hangs onto the belt and is carried along behind the part, so every output
 *  traces back to the sheet. Every task owns its step, and every output
 *  traces to what the customer asked for. */

const BELT = 0.62;
const MID = 1.225;
const STATIONS = [0.72, 1.36, 2.0];
/** Each station's ports, in then out: true is square. */
const SQUARE = [
  [true, false],
  [false, true],
  [true, false],
];
const [START, END] = [0.4, 2.36];
const CUBE: V3 = [START, BELT, MID];
const PUCK: V3 = [1.1, BELT, MID];
const PITCH = 0.12;
const CYCLE = 8;
const TRAVEL = 6.2;
/** The lectern's board: its centre, and its tilt down toward the belt. */
const BOARD: V3 = [0.17, 0.93, MID];
const TILT = -0.45;
/** A point on the board (x down its slope, y off its face, z across) in the scene. */
function onBoard(x: number, y: number, z: number): V3 {
  const [c, s] = [Math.cos(TILT), Math.sin(TILT)];
  return [BOARD[0] + x * c - y * s, BOARD[1] + x * s + y * c, BOARD[2] + z];
}

/** The requirement at the head of the line: a lectern whose board leans out over the belt's
 *  tail, with the clipboard on it. */
function lectern(k: Sketch): void {
  k.object('lectern', () => {
    k.box(0.0, 0, MID - 0.15, 0.16, 0.03, MID + 0.15);
    k.box(0.06, 0.03, MID - 0.035, 0.12, 0.92, MID + 0.035);
    k.at(
      BOARD,
      0,
      () => {
        k.box(-0.16, -0.03, -0.2, 0.16, 0, 0.2);
        k.box(-0.13, 0, -0.15, 0.13, 0.012, 0.15);
        k.box(-0.15, 0.012, -0.06, -0.1, 0.03, 0.06, { tier: 'edge' });
        for (let r = 0; r < 6; r++) {
          const x = -0.07 + r * 0.035;
          k.line(
            [
              [x, 0.013, -0.125],
              [x, 0.013, r % 3 === 2 ? -0.07 : -0.025],
            ],
            'soft',
          );
          k.line(
            [
              [x, 0.013, 0.025],
              [x, 0.013, r % 2 ? 0.07 : 0.125],
            ],
            'soft',
          );
        }
      },
      0,
      TILT,
    );
  });
}

function conveyor(k: Sketch): void {
  k.object('conveyor', () => {
    for (const z of [0.98, 1.43]) k.box(0.2, 0.5, z, 2.46, 0.6, z + 0.04);
    k.box(0.22, 0.58, 1.02, 2.44, BELT, 1.43);
    for (const x of [0.24, 1.15, 2.38]) for (const z of [0.98, 1.43]) k.box(x, 0, z, x + 0.05, 0.5, z + 0.04);
    for (const x of [0.24, 2.38]) k.box(x, 0.12, 1.02, x + 0.05, 0.16, 1.43);
  });
  k.moving('slats', [0, 0, 0], () => {
    for (let x = 0.26; x < 2.28; x += PITCH)
      k.line(
        [
          [x, BELT + 0.001, 1.03],
          [x, BELT + 0.001, 1.42],
        ],
        'faint',
      );
  });
}

function station(k: Sketch, i: number, c: number): void {
  k.object(`task-${i}`, () => {
    for (const [z0, z1] of [
      [0.93, 0.98],
      [1.47, 1.52],
    ] as const)
      k.box(c - 0.15, 0.46, z0, c + 0.15, 0.86, z1);
    k.box(c - 0.17, 0.86, 0.91, c + 0.17, 0.9, 1.54);
    k.rect('z', 1.521, c - 0.11, 0.5, c + 0.11, 0.82, 'soft');
    k.circle([c + 0.07, 0.76, 1.521], 0.022, 'z', 'soft', 16);
    (SQUARE[i] ?? []).forEach((sq, j) => {
      const x = c + (j ? 0.08 : -0.08);
      if (sq) {
        k.box(x - 0.065, 0.9, MID - 0.065, x + 0.065, 0.94, MID + 0.065);
        k.rect('y', 0.941, x - 0.04, MID - 0.04, x + 0.04, MID + 0.04, 'soft');
      } else {
        k.cyl(x, 0.9, MID, 0.07, 0.04);
        k.circle([x, 0.941, MID], 0.045, 'y', 'soft', 20);
      }
    });
  });
}

/** The thread: tied at the clip, down the sheet, over the board's edge, hanging straight down
 *  to the belt, then lying on the belt behind the part (the belt carries both). */
const DROP = onBoard(0.165, 0, 0);
const THREAD: V3[] = [onBoard(-0.1, 0.014, 0), onBoard(0.13, 0.014, 0), onBoard(0.163, 0.004, 0), [DROP[0], BELT + 0.003, MID], [END, BELT + 0.003, MID]]; // prettier-ignore
/** The routed thread, and the share of it laid before it reaches the belt (both set at build). */
let laid: V3[] = [];
let landed = 0;

function part(k: Sketch): void {
  k.moving('cube', CUBE, () => k.box(-0.075, 0, -0.075, 0.075, 0.15, 0.075, { fill: 'signal', tier: 'hot' }));
  k.moving('puck', PUCK, () => k.cyl(0, 0, 0, 0.08, 0.13, { fill: 'signal', tier: 'hot' }));
  k.moving('thread', [0, 0, 0], () => {
    laid = cable(k, {
      name: 'thread',
      pts: THREAD,
      r: 0.0015,
      px: PX,
      plugs: [false, false],
      bend: 0.02,
      tied: ['cube', 'puck'],
    });
  });
  // How far along the thread it reaches the belt.
  landed = laid.findIndex((p) => p[1] < BELT + 0.01) / Math.max(1, laid.length - 1);
}

export const agentsScene: Small = {
  frame: FRAME,
  build(k) {
    floor(k);
    lectern(k);
    conveyor(k);
    STATIONS.forEach((c, i) => station(k, i, c));
    part(k);
  },
  move(d, t) {
    const u = (t + 1.3) % CYCLE;
    const go = Math.min(1, u / TRAVEL);
    const x = START + (END - START) * go;
    const gone = 1 - ease(CYCLE - 0.6, CYCLE - 0.2, u);
    const round = STATIONS.filter((c) => x > c).length % 2 === 1;
    const cube = shift(d, 'cube', CUBE, [x - START, 0, 0]);
    const puck = shift(d, 'puck', PUCK, [x - PUCK[0], 0, 0]);
    if (cube) cube.visible = !round && gone > 0.5;
    if (puck) puck.visible = round && gone > 0.5;
    const g = d.moving.get('thread');
    // Shown as far as the part: the share of the thread laid before the belt, plus the belt run.
    if (g) reveal(g, (landed + (1 - landed) * ((x - DROP[0]) / (END - DROP[0]))) * gone);
    shift(d, 'slats', [0, 0, 0], [(u * 0.35) % PITCH, 0, 0]);
  },
};
