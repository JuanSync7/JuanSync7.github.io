import { defineCanvasFigure } from './define';
import { isometric, project, type Camera, type ScreenPoint } from './kit/camera';
import { box, line, poly } from './kit/draw';
import { ink, mix } from './kit/ink';
import { follow, smoothstep } from './kit/motion';
import { dial, drum, handle, slab, type Plane } from './kit/safe';

// The safe's frame: x across, y up, z out of the door. The door is hinged on the opening's left edge.
const OPEN = { x0: -0.92, x1: 0.92, y0: 0.5, y1: 2.0, z: 0.9 };
const DOOR_W = OPEN.x1 - OPEN.x0;
const DOOR_T = 0.2;
const PLUG = [0.08, DOOR_W - 0.08, OPEN.y0 + 0.08, OPEN.y1 - 0.08, -0.14, 0] as const;
const SWING = (100 * Math.PI) / 180;
const SHELF = 1.36;

interface Sheet {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  y: number;
}
interface Stack {
  sheets: Sheet[];
  lit: boolean;
}
interface State {
  k: number;
  stacks: Stack[];
}

function tones(alpha = 0.6) {
  return {
    top: mix('ground', 'panel2', 0.6),
    left: mix('ground', 'panel', 0.75),
    right: mix('ground', 'panel', 0.35),
    edge: ink.line(alpha),
    crease: ink.line(0.18),
  };
}

// A stack of loose sheets on a floor, each nudged a little so it reads as paper, not a block.
function stack(rng: () => number, x: number, z: number, y: number, n: number, lit: boolean): Stack {
  const sheets = Array.from({ length: n }, (_, i) => {
    const dx = (rng() - 0.5) * 0.06;
    const dz = (rng() - 0.5) * 0.06;
    return { x0: x - 0.36 + dx, x1: x + 0.36 + dx, z0: z - 0.3 + dz, z1: z + 0.3 + dz, y: y + i * 0.045 };
  });
  return { sheets, lit };
}

function drawPapers(ctx: CanvasRenderingContext2D, cam: Camera, s: Stack, open: number) {
  s.sheets.forEach((sh, i) => {
    const top = i === s.sheets.length - 1;
    const lift = top && s.lit ? open * 0.06 : 0;
    const pull = top && s.lit ? open * 0.34 : 0;
    const hot = top && s.lit && open > 0.5;
    box(ctx, cam, sh.x0, sh.z0 + pull, sh.x1, sh.z1 + pull, sh.y + lift, sh.y + lift + 0.03, tones(hot ? 0.8 : 0.62));
    if (!top) return;
    // Ruled lines on the top sheet: notes, not money.
    for (let r = 0; r < 4; r++) {
      const z = sh.z0 + pull + 0.12 + r * 0.12;
      const end = r === 3 ? sh.x0 + 0.34 : sh.x1 - 0.1;
      const y = sh.y + lift + 0.031;
      line(ctx, project(cam, sh.x0 + 0.1, y, z), project(cam, end, y, z), hot ? ink.signal(0.95) : ink.line(0.55));
    }
  });
}

function opening(ctx: CanvasRenderingContext2D, cam: Camera) {
  const { x0, x1, y0, y1, z } = OPEN;
  poly(ctx, [project(cam, x0, y0, z), project(cam, x1, y0, z), project(cam, x1, y1, z), project(cam, x0, y1, z)]);
}

function drawInside(ctx: CanvasRenderingContext2D, cam: Camera, stacks: readonly Stack[], open: number) {
  const p = (x: number, y: number, z: number): ScreenPoint => project(cam, x, y, z);
  const { x0, x1, y0, y1, z } = OPEN;
  const back = -0.72;
  const wall = (pts: ScreenPoint[], t: number) => {
    poly(ctx, pts);
    ctx.fillStyle = mix('ground', 'panel', t);
    ctx.fill();
    ctx.strokeStyle = ink.line(0.3);
    ctx.stroke();
  };
  ctx.save();
  opening(ctx, cam);
  ctx.clip();
  wall([p(x0, y0, back), p(x1, y0, back), p(x1, y1, back), p(x0, y1, back)], 0.2);
  wall([p(x0, y0, back), p(x0, y0, z), p(x0, y1, z), p(x0, y1, back)], 0.5);
  wall([p(x0, y0, back), p(x1, y0, back), p(x1, y0, z), p(x0, y0, z)], 0.3);
  // The jamb is as deep as the door's plug: its inner edge is where the door seats.
  line(ctx, p(x0, y0, z - 0.14), p(x0, y1, z - 0.14), ink.line(0.35));
  line(ctx, p(x0, y0, z - 0.14), p(x1, y0, z - 0.14), ink.line(0.35));
  // Lower papers, then the shelf over them, then the papers on the shelf.
  for (const s of stacks.slice(0, 2)) drawPapers(ctx, cam, s, open);
  box(ctx, cam, x0, back, x1, z - 0.18, SHELF - 0.06, SHELF, tones(0.55));
  for (const s of stacks.slice(2)) drawPapers(ctx, cam, s, open);
  ctx.restore();
}

/** The body: plinth, carcass and cap, the frame round the door, a blank name plate and side ribs. */
function drawBody(ctx: CanvasRenderingContext2D, cam: Camera) {
  const p = (x: number, y: number, z: number): ScreenPoint => project(cam, x, y, z);
  for (const x of [-1.05, 0.88])
    for (const z of [-0.68, 0.62]) box(ctx, cam, x, z, x + 0.18, z + 0.18, 0, 0.22, tones(0.3));
  box(ctx, cam, -1.26, -0.96, 1.26, 0.96, 0.22, 0.34, tones(0.6));
  box(ctx, cam, -1.2, -0.9, 1.2, OPEN.z, 0.34, 2.2, tones(0.64));
  box(ctx, cam, -1.26, -0.96, 1.26, 0.96, 2.2, 2.3, tones(0.6));
  const { x0, x1, y0, y1, z } = OPEN;
  const m = 0.07;
  poly(ctx, [p(x0 - m, y0 - m, z), p(x1 + m, y0 - m, z), p(x1 + m, y1 + m, z), p(x0 - m, y1 + m, z)]);
  ctx.strokeStyle = ink.line(0.35);
  ctx.stroke();
  poly(ctx, [p(-0.32, 2.07, z), p(0.32, 2.07, z), p(0.32, 2.15, z), p(-0.32, 2.15, z)]);
  ctx.fillStyle = mix('ground', 'panel2', 0.7);
  ctx.fill();
  ctx.stroke();
  for (const y of [0.95, 1.6]) line(ctx, p(1.2, y, -0.84), p(1.2, y, 0.84), ink.line(0.25));
  line(ctx, p(1.2, 0.4, 0.82), p(1.2, 2.14, 0.82), ink.line(0.18));
}

function drawDoor(ctx: CanvasRenderingContext2D, cam: Camera, k: number) {
  const a = smoothstep(0.42, 1, k) * SWING;
  // The dial runs a combination (one way, back, then home) until its zero sits under the index.
  const u = smoothstep(0, 0.3, k);
  const turn = (1.1 + Math.sin(u * Math.PI * 2) * 1.4) * (1 - u);
  const unlock = smoothstep(0.3, 0.42, k);
  const q: Plane = (uu, v, n) =>
    project(cam, OPEN.x0 + uu * Math.cos(a) - n * Math.sin(a), v, OPEN.z + uu * Math.sin(a) + n * Math.cos(a));
  const outer = Math.cos(a) - Math.sin(a) > 0;
  const plug = () => {
    if (a < 0.01) return;
    ctx.save();
    // Until the plug has cleared the jamb, only the part inside the opening shows.
    if (a < 1.05) {
      opening(ctx, cam);
      ctx.clip();
    }
    slab(ctx, q, PLUG, false);
    // Locking bolts on the plug's free edge, drawn in as the handle turns.
    const out = PLUG[1] + 0.03 + 0.1 * (1 - unlock);
    for (const v of [PLUG[2] + 0.3, (OPEN.y0 + OPEN.y1) / 2, PLUG[3] - 0.3]) {
      const ring = (th: number, s: number) => q(s, v + 0.045 * Math.cos(th), -0.07 + 0.045 * Math.sin(th));
      drum(ctx, ring, PLUG[1], out, mix('ground', 'panel', 0.45), mix('ground', 'panel', 0.8), ink.line(0.7));
    }
    ctx.restore();
  };
  const plate = [0, DOOR_W, OPEN.y0, OPEN.y1, 0, DOOR_T];
  if (outer) plug();
  slab(ctx, q, plate, outer);
  if (outer) {
    const d = 0.1;
    poly(ctx, [
      q(d, OPEN.y0 + d, DOOR_T),
      q(DOOR_W - d, OPEN.y0 + d, DOOR_T),
      q(DOOR_W - d, OPEN.y1 - d, DOOR_T),
      q(d, OPEN.y1 - d, DOOR_T),
    ]);
    ctx.strokeStyle = ink.line(0.28);
    ctx.stroke();
    dial(ctx, q, DOOR_W / 2, 1.56, 0.27, DOOR_T, turn);
    handle(ctx, q, DOOR_W / 2, 0.96, 0.25, DOOR_T, (-Math.PI / 3) * unlock);
  } else plug();
  // Two hinge barrels stand proud of the hinge edge.
  for (const [y0, y1] of [
    [OPEN.y0 + 0.16, OPEN.y0 + 0.44],
    [OPEN.y1 - 0.44, OPEN.y1 - 0.16],
  ] as const) {
    const ring = (th: number, s: number) =>
      project(cam, OPEN.x0 - 0.03 + 0.06 * Math.cos(th), s, OPEN.z + 0.1 + 0.06 * Math.sin(th));
    drum(ctx, ring, y0, y1, mix('ground', 'panel', 0.5), mix('ground', 'panel2', 0.8), ink.line(0.75));
  }
}

export default defineCanvasFigure<State>({
  id: 'vault-safe',
  title: 'The experience vault',
  alt: 'An isometric hairline vault safe with a combination dial and a three-spoke handle. On hover the dial turns until its zero meets the index, the handle turns, the bolts draw in, the door swings open on its hinges and stacks of written notes sit on the shelves inside, the top sheet lifting.',
  idea: 'A vault keeps what an engineer knows: the dial finds the combination, the bolts draw in, the door swings open, and inside are notes, not money, with one sheet lifting as the lesson you take out.',
  style: 'hairline',
  motion: 'responsive',
  answers: true,
  group: 'hero',
  seed: 1117,
  aspect: 0.95,
  setup: ({ rng }) => ({
    k: 0,
    stacks: [
      stack(rng, -0.4, 0.42, 0.51, 7, true),
      stack(rng, 0.3, 0.3, 0.51, 4, false),
      stack(rng, 0.26, 0.3, SHELF + 0.01, 3, false),
      stack(rng, -0.44, 0.46, SHELF + 0.01, 3, false),
    ],
  }),
  draw: ({ ctx, w, h, t, dt, still, pointer, state }) => {
    // Hover opens it. With no hover (a phone) it opens once it has been on screen a moment.
    const target = pointer.active || (w < 420 && t > 1.4) ? 1 : 0;
    state.k = still ? target : follow(state.k, target, dt, target > state.k ? 1.1 : 3);
    const cam = isometric(w * 0.6, h * 0.7, Math.min(w * 0.2, h * 0.22));
    drawBody(ctx, cam);
    const open = smoothstep(0.42, 1, state.k);
    if (open > 0) drawInside(ctx, cam, state.stacks, open);
    drawDoor(ctx, cam, state.k);
    return state.k < 0.02 ? 'rest' : state.k > 0.98 ? 'open' : state.k < 0.42 ? 'unlocking' : 'opening';
  },
});
