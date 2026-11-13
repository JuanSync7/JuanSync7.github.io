import { defineCanvasFigure } from './define';
import { isometric, project, type Camera } from './kit/camera';
import { box, poly } from './kit/draw';
import { ink, mix } from './kit/ink';
import { clamp, easeOut } from './kit/motion';

/** Interlocking bricks building a small tower on a base plate, one brick at a time, in
 *  hairline isometric: each brick drops onto the studs of the one below and locks there,
 *  the finished build holds, then it comes apart top first and is built again. The brick
 *  being placed (or, at rest, the last one placed) is the one signal. */

type Brick = readonly [x0: number, z0: number, x1: number, z1: number, layer: number];
interface State {
  cam: Camera;
}

const H = 1.2; // a brick's height; studs pitch 1
const PLATE = 0.32;
const BRICKS: readonly Brick[] = [
  [0, 0, 4, 2, 0],
  [4, 0, 6, 4, 0],
  [0, 2, 4, 4, 0],
  [7, 3, 9, 5, 0],
  [0, 0, 2, 4, 1],
  [2, 0, 6, 2, 1],
  [2, 2, 6, 4, 1],
  [7, 3, 9, 5, 1],
  [1, 1, 5, 3, 2],
  [7, 3, 9, 5, 2],
  [2, 1, 4, 3, 3],
];
const N = BRICKS.length;
const DROP = 0.55;
const STEP = 0.5;
const BUILD = (N - 1) * STEP + DROP;
const HOLD = 3.2;
const LIFT = 0.6;
const LIFT_STEP = 0.26;
const APART = (N - 1) * LIFT_STEP + LIFT;
const PERIOD = BUILD + HOLD + APART + 0.9;
const RISE = 6;

/** Where each brick is in the loop: its height above its seat (0 = locked) and opacity. */
function pose(i: number, ph: number): { up: number; a: number } {
  if (ph < BUILD + HOLD) {
    const s = clamp((ph - i * STEP) / DROP, 0, 1);
    return { up: (1 - easeOut(s)) * RISE, a: s <= 0 ? 0 : clamp(s * 3, 0, 1) };
  }
  const u = clamp((ph - BUILD - HOLD - (N - 1 - i) * LIFT_STEP) / LIFT, 0, 1);
  return { up: u * u * RISE, a: 1 - u };
}

function stud(ctx: CanvasRenderingContext2D, cam: Camera, x: number, y: number, z: number, lit: boolean): void {
  const ring = (yy: number) =>
    Array.from({ length: 16 }, (_, k) => {
      const a = (k / 16) * Math.PI * 2;
      return project(cam, x + Math.cos(a) * 0.3, yy, z + Math.sin(a) * 0.3);
    });
  const lo = ring(y);
  const hi = ring(y + 0.18);
  // Screen extremes of a level circle sit along (1, -1) and (-1, 1): k = 14 and k = 6.
  const [l0, r0, l1, r1] = [lo[6], lo[14], hi[6], hi[14]];
  if (!l0 || !r0 || !l1 || !r1) return;
  poly(ctx, lo);
  ctx.fillStyle = mix('ground', 'panel', 0.6);
  ctx.fill();
  ctx.strokeStyle = lit ? ink.signal(0.8) : ink.line(0.4);
  ctx.stroke();
  poly(ctx, [l0, r0, r1, l1]);
  ctx.fill();
  poly(ctx, hi);
  ctx.fillStyle = lit ? mix('panel', 'panelSignal', 0.7) : mix('panel', 'panel2', 0.75);
  ctx.fill();
  ctx.stroke();
}

function brick(ctx: CanvasRenderingContext2D, cam: Camera, b: Brick, up: number, lit: boolean): void {
  const [x0, z0, x1, z1, layer] = b;
  const y0 = PLATE + layer * H + up;
  box(ctx, cam, x0 + 0.03, z0 + 0.03, x1 - 0.03, z1 - 0.03, y0, y0 + H, {
    right: mix('ground', 'panel', 0.55),
    left: mix('ground', 'panel', 0.95),
    top: lit ? mix('panel', 'panelSignal', 0.7) : mix('panel', 'panel2', 0.75),
    edge: lit ? ink.signal(0.95) : ink.line(0.55),
    crease: lit ? ink.signal(0.45) : ink.line(0.16),
  });
  for (let i = x0; i < x1; i++) for (let j = z0; j < z1; j++) stud(ctx, cam, i + 0.5, y0 + H, j + 0.5, lit);
}

export default defineCanvasFigure<State>({
  id: 'brick-build',
  title: 'Brick build',
  alt: 'Interlocking toy bricks in hairline isometric on a base plate: a stepped tower of eleven studded bricks and a small column beside it, built one brick at a time, taken apart from the top and built again. The brick being placed is the highlighted one.',
  idea: 'A build as bricks: each brick drops onto the studs below and locks, the build holds, comes apart top first and is built again; the brick moving now is the signal.',
  style: 'hairline',
  motion: 'ambient',
  answers: false,
  group: 'hero',
  seed: 4417,
  aspect: 1.1,
  setup: ({ w, h }) => {
    const scale = Math.min(w / 13.2, h / 12.4);
    const cam = isometric(0, 0, scale);
    const c = project(cam, 4.5, 3.4, 2.5);
    return { cam: { ...cam, cx: w / 2 - c[0], cy: h / 2 - c[1] } };
  },
  draw: ({ ctx, t, state }) => {
    const { cam } = state;
    const ph = (t + BUILD - 2) % PERIOD;
    box(ctx, cam, -0.6, -0.6, 9.6, 5.6, 0, PLATE, {
      right: mix('ground', 'panel', 0.4),
      left: mix('ground', 'panel', 0.8),
      top: mix('ground', 'panel', 0.3),
      edge: ink.line(0.42),
      crease: ink.line(0.12),
    });
    for (let i = 0; i < 10; i++)
      for (let j = 0; j < 5; j++) {
        if (BRICKS.some(([x0, z0, x1, z1, l]) => l === 0 && i >= x0 && i < x1 && j >= z0 && j < z1)) continue;
        if (i === 9) continue;
        stud(ctx, cam, i + 0.5, PLATE, j + 0.5, false);
      }
    const poses = BRICKS.map((_, i) => pose(i, ph));
    const moving = poses.findIndex((p) => p.a > 0 && p.up > 0.02);
    const placed = poses.filter((p) => p.a >= 1 && p.up <= 0.02).length;
    const lit = moving >= 0 ? moving : placed === N ? N - 1 : -1;
    // Painter's order: the far tower before the near column; in each, lower layers first, far to
    // near within a layer; a moving brick last.
    const order = BRICKS.map((b, i) => ({
      b,
      i,
      k: (b[0] >= 7 ? 1e3 : 0) + b[4] * 100 + (b[0] + b[2] + b[1] + b[3]) / 2 + (i === moving ? 1e4 : 0),
    }));
    order.sort((a, b) => a.k - b.k);
    for (const { b, i } of order) {
      const p = poses[i];
      if (!p || p.a <= 0) continue;
      ctx.globalAlpha = p.a;
      brick(ctx, cam, b, p.up, i === lit);
      ctx.globalAlpha = 1;
    }
    if (ph >= BUILD + HOLD) return 'apart';
    return placed === N && moving < 0 ? 'built' : `brick ${Math.min(N, placed + 1)}/${N}`;
  },
});
