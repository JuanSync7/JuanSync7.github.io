import { defineCanvasFigure } from './define';
import { isometric, project, type Camera, type ScreenPoint } from './kit/camera';
import { box, dot, line, poly } from './kit/draw';
import { ink, mix } from './kit/ink';
import { follow, smoothstep } from './kit/motion';

// The safe's frame: x across, y up, z out of the door. The door is hinged on the opening's left edge.
const OPEN = { x0: -0.92, x1: 0.92, y0: 0.46, y1: 2.06, z: 0.9 };
const DOOR_W = OPEN.x1 - OPEN.x0;
const DOOR_T = 0.16;
const WHEEL = { u: 1.02, y: 1.26, r: 0.34 };
const SPOKES = 6;
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

function face(ctx: CanvasRenderingContext2D, pts: readonly ScreenPoint[], fill: string, edge: string) {
  poly(ctx, pts);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.stroke();
}

/** A point on the door: `u` along it from the hinge, `n` out from its inner face, `a` its swing. */
function doorPoint(cam: Camera, u: number, y: number, n: number, a: number): ScreenPoint {
  const x = OPEN.x0 + u * Math.cos(a) - n * Math.sin(a);
  const z = OPEN.z + u * Math.sin(a) + n * Math.cos(a);
  return project(cam, x, y, z);
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

function drawInside(ctx: CanvasRenderingContext2D, cam: Camera, stacks: readonly Stack[], open: number) {
  const p = (x: number, y: number, z: number): ScreenPoint => project(cam, x, y, z);
  const { x0, x1, y0, y1, z } = OPEN;
  const back = -0.72;
  ctx.save();
  poly(ctx, [p(x0, y0, z), p(x1, y0, z), p(x1, y1, z), p(x0, y1, z)]);
  ctx.clip();
  const hollow = mix('ground', 'panel', 0.2);
  face(ctx, [p(x0, y0, back), p(x1, y0, back), p(x1, y1, back), p(x0, y1, back)], hollow, ink.line(0.3));
  face(ctx, [p(x0, y0, back), p(x0, y0, z), p(x0, y1, z), p(x0, y1, back)], mix('ground', 'panel', 0.5), ink.line(0.3));
  face(
    ctx,
    [p(x0, y0, back), p(x1, y0, back), p(x1, y0, z), p(x0, y0, z)],
    mix('ground', 'panel2', 0.4),
    ink.line(0.3),
  );
  // Lower papers, then the shelf over them, then the papers on the shelf.
  for (const s of stacks.slice(0, 2)) drawPapers(ctx, cam, s, open);
  box(ctx, cam, x0, back, x1, z - 0.04, SHELF - 0.06, SHELF, tones(0.55));
  for (const s of stacks.slice(2)) drawPapers(ctx, cam, s, open);
  ctx.restore();
}

function drawWheel(ctx: CanvasRenderingContext2D, cam: Camera, a: number, spin: number, lit: number) {
  const n = DOOR_T + 0.1;
  const at = (r: number, th: number): ScreenPoint =>
    doorPoint(cam, WHEEL.u + r * Math.cos(th), WHEEL.y + r * Math.sin(th), n, a);
  const style = lit > 0.5 ? ink.signal(0.95) : ink.line(0.75);
  // The axle stands the wheel off the door.
  line(ctx, doorPoint(cam, WHEEL.u, WHEEL.y, DOOR_T, a), at(0, 0), ink.line(0.6));
  for (const r of [WHEEL.r, 0.08]) {
    poly(
      ctx,
      Array.from({ length: 40 }, (_, i) => at(r, (i / 40) * Math.PI * 2)),
    );
    ctx.strokeStyle = style;
    ctx.stroke();
  }
  for (let i = 0; i < SPOKES; i++) {
    const th = spin + (i / SPOKES) * Math.PI * 2;
    line(ctx, at(0.08, th), at(WHEEL.r * 1.32, th), style);
    const [x, y] = at(WHEEL.r * 1.38, th);
    dot(ctx, x, y, 2.2, style);
  }
}

function drawDoor(ctx: CanvasRenderingContext2D, cam: Camera, k: number) {
  const a = smoothstep(0.42, 1, k) * SWING;
  const spin = smoothstep(0, 0.45, k) * Math.PI * 3;
  const { y0, y1 } = OPEN;
  const q = (u: number, y: number, n: number): ScreenPoint => doorPoint(cam, u, y, n, a);
  const t = tones(0.7);
  // The free edge, then whichever broad face is turned to us.
  face(ctx, [q(DOOR_W, y0, 0), q(DOOR_W, y0, DOOR_T), q(DOOR_W, y1, DOOR_T), q(DOOR_W, y1, 0)], t.right, t.edge);
  face(ctx, [q(0, y1, 0), q(DOOR_W, y1, 0), q(DOOR_W, y1, DOOR_T), q(0, y1, DOOR_T)], t.top, t.edge);
  // The outer face is turned to the isometric eye (from +x, +z) until the door passes 45°.
  const outer = Math.cos(a) - Math.sin(a) > 0;
  const n = outer ? DOOR_T : 0;
  face(ctx, [q(0, y0, n), q(DOOR_W, y0, n), q(DOOR_W, y1, n), q(0, y1, n)], t.left, t.edge);
  const inset = (d: number) => [q(d, y0 + d, n), q(DOOR_W - d, y0 + d, n), q(DOOR_W - d, y1 - d, n), q(d, y1 - d, n)];
  poly(ctx, inset(0.12));
  ctx.strokeStyle = ink.line(0.28);
  ctx.stroke();
  if (outer) drawWheel(ctx, cam, a, spin, 1 - smoothstep(0.5, 0.75, k));
  // Two hinge knuckles on the hinge edge.
  for (const y of [y0 + 0.3, y1 - 0.3])
    line(ctx, q(0, y - 0.14, DOOR_T * 0.5), q(0, y + 0.14, DOOR_T * 0.5), ink.line(0.85));
}

export default defineCanvasFigure<State>({
  id: 'vault-safe',
  title: 'The experience vault',
  alt: 'An isometric hairline safe with a ship’s-wheel handle. On hover the wheel spins, the door swings open and stacks of written notes sit on the shelves inside, the top sheet lifting.',
  idea: 'A vault keeps what an engineer knows: the wheel turns to unlock it, the door swings open, and inside are notes, not money, with one sheet lifting as the lesson you take out.',
  style: 'hairline',
  motion: 'responsive',
  answers: true,
  group: 'hero',
  seed: 1117,
  aspect: 0.95,
  setup: ({ rng }) => ({
    k: 0,
    stacks: [
      stack(rng, -0.4, 0.42, 0.47, 7, true),
      stack(rng, 0.3, 0.3, 0.47, 4, false),
      stack(rng, 0.26, 0.3, SHELF + 0.01, 3, false),
      stack(rng, -0.44, 0.46, SHELF + 0.01, 3, false),
    ],
  }),
  draw: ({ ctx, w, h, t, dt, still, pointer, state }) => {
    // Hover opens it. With no hover (a phone) it opens once it has been on screen a moment.
    const target = pointer.active || (w < 420 && t > 1.4) ? 1 : 0;
    state.k = still ? target : follow(state.k, target, dt, target > state.k ? 1.6 : 3);
    const cam = isometric(w * 0.62, h * 0.7, Math.min(w * 0.2, h * 0.23));
    // Feet, then the body.
    for (const x of [-1.05, 0.88])
      for (const z of [-0.68, 0.62]) box(ctx, cam, x, z, x + 0.18, z + 0.18, 0, 0.24, tones(0.3));
    box(ctx, cam, -1.2, -0.9, 1.2, OPEN.z, 0.22, 2.3, tones(0.64));
    const open = smoothstep(0.42, 1, state.k);
    if (open > 0) drawInside(ctx, cam, state.stacks, open);
    drawDoor(ctx, cam, state.k);
    return state.k < 0.02 ? 'rest' : state.k > 0.98 ? 'open' : 'opening';
  },
});
