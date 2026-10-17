import { defineCanvasFigure } from './define';
import { isometric, project, type Camera } from './kit/camera';
import { box } from './kit/draw';
import { ink, mix } from './kit/ink';
import { clamp, follow } from './kit/motion';

/** A wafer in hairline isometric: a thin disk ruled into dies, with its notch. One die rises
 *  out of the grid on a leader line, held for a moment and set back, then another. The
 *  pointer picks the die to lift. */

const DIES = 9;
const R = 1;
const LIFT = 0.55;
const CYCLE = 3.2;

interface State {
  order: [number, number][];
  lift: number;
}

const cellSize = (2 * R) / DIES;
const inside = (i: number, j: number): boolean => {
  const corners = [[i, j], [i + 1, j], [i, j + 1], [i + 1, j + 1]];
  return corners.every(([a, b]) => Math.hypot(-R + (a ?? 0) * cellSize, -R + (b ?? 0) * cellSize) < R * 0.97);
};

function disk(ctx: CanvasRenderingContext2D, cam: Camera, y: number): void {
  ctx.beginPath();
  for (let k = 0; k <= 96; k++) {
    const a = (k / 96) * Math.PI * 2;
    // The notch: a small bite at the front of the wafer.
    const r = Math.abs(Math.atan2(Math.sin(a - 0.79), Math.cos(a - 0.79))) < 0.06 ? R * 0.96 : R;
    const p = project(cam, Math.cos(a) * r, y, Math.sin(a) * r);
    if (k === 0) ctx.moveTo(p[0], p[1]);
    else ctx.lineTo(p[0], p[1]);
  }
}

export default defineCanvasFigure<State>({
  id: 'wafer-stack',
  title: 'Wafer stack',
  alt: 'An isometric line drawing of a round wafer ruled into a grid of square dies, with one die lifted above it on a thin vertical line and outlined in teal.',
  idea: 'From wafer to die: the round wafer is ruled into dies, and any one of them can be lifted out to become the chip the rest of the post is about.',
  style: 'hairline',
  motion: 'ambient',
  answers: true,
  group: 'feature',
  seed: 300,
  aspect: 1.6,
  setup: ({ rng }) => {
    const all: [number, number][] = [];
    for (let i = 0; i < DIES; i++) for (let j = 0; j < DIES; j++) if (inside(i, j)) all.push([i, j]);
    for (let k = all.length - 1; k > 0; k--) {
      const m = Math.floor(rng() * (k + 1));
      [all[k], all[m]] = [all[m] ?? [0, 0], all[k] ?? [0, 0]];
    }
    const order = all.slice(0, 12);
    return { order, lift: 0 };
  },
  draw: ({ ctx, w, h, t, dt, pointer, hover, still, state }) => {
    const cam = isometric(w / 2, h * 0.62, Math.min(w * 0.36, h * 0.52));
    let die = state.order[Math.floor(t / CYCLE) % state.order.length] ?? [4, 4];
    let up = Math.sin(clamp(((t % CYCLE) / CYCLE) * 1.25, 0, 1) * Math.PI);
    if (pointer.active && hover > 0.3) {
      const i = clamp(Math.floor(pointer.x * DIES), 0, DIES - 1);
      const j = clamp(Math.floor(pointer.y * DIES), 0, DIES - 1);
      if (inside(i, j)) {
        die = [i, j];
        up = 1;
      }
    }
    state.lift = still ? up : follow(state.lift, up, dt, 6);
    const [di, dj] = die;
    const x0 = -R + di * cellSize;
    const z0 = -R + dj * cellSize;

    disk(ctx, cam, -0.04);
    ctx.fillStyle = mix('ground', 'panel', 0.6);
    ctx.fill();
    ctx.strokeStyle = ink.line(0.3);
    ctx.stroke();
    disk(ctx, cam, 0);
    ctx.fillStyle = mix('panel', 'panel2', 0.5);
    ctx.fill();
    ctx.strokeStyle = ink.line(0.55);
    ctx.stroke();
    ctx.strokeStyle = ink.line(0.16);
    ctx.beginPath();
    for (let i = 0; i < DIES; i++) {
      for (let j = 0; j < DIES; j++) {
        if (!inside(i, j)) continue;
        const a = -R + i * cellSize;
        const b = -R + j * cellSize;
        const q = [project(cam, a, 0, b), project(cam, a + cellSize, 0, b), project(cam, a + cellSize, 0, b + cellSize), project(cam, a, 0, b + cellSize)];
        q.forEach((p, k) => (k === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
        ctx.closePath();
      }
    }
    ctx.stroke();

    const lift = state.lift * LIFT;
    const hole = [project(cam, x0, 0, z0), project(cam, x0 + cellSize, 0, z0), project(cam, x0 + cellSize, 0, z0 + cellSize), project(cam, x0, 0, z0 + cellSize)];
    ctx.fillStyle = ink.ground();
    ctx.beginPath();
    hole.forEach((p, k) => (k === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
    ctx.closePath();
    ctx.fill();
    const c0 = project(cam, x0 + cellSize / 2, 0, z0 + cellSize / 2);
    const c1 = project(cam, x0 + cellSize / 2, lift, z0 + cellSize / 2);
    ctx.strokeStyle = ink.line(0.3 * state.lift);
    ctx.beginPath();
    ctx.moveTo(c0[0], c0[1]);
    ctx.lineTo(c1[0], c1[1]);
    ctx.stroke();
    box(ctx, cam, x0, z0, x0 + cellSize, z0 + cellSize, lift, lift + 0.035, {
      top: mix('panelSignal', 'signalLine', 0.5),
      left: mix('ground', 'panel', 0.9),
      right: mix('ground', 'panel', 0.5),
      edge: ink.signal(0.95),
      crease: ink.signal(0.35),
    });
    return pointer.active && hover > 0.3 ? `die ${di},${dj}` : 'rest';
  },
});
