import { defineCanvasFigure } from './define';
import { camera, project, type Camera } from './kit/camera';
import { ink } from './kit/ink';
import { clamp } from './kit/motion';

/** A systolic array in wireframe perspective: a grid of processing elements, activations
 *  marching in from the left and weights from the top, so the work passes through the array
 *  as a diagonal wavefront. The element under the pointer is the signal; its row and column
 *  links show what feeds it. */

const N = 6;
const PITCH = 0.36;
const HALF = 0.11;
const BEAT = 0.42;

const pos = (i: number): number => (i - (N - 1) / 2) * PITCH;

function cube(ctx: CanvasRenderingContext2D, cam: Camera, x: number, z: number, h: number, style: string): void {
  const c = [
    [x - HALF, 0, z - HALF], [x + HALF, 0, z - HALF], [x + HALF, 0, z + HALF], [x - HALF, 0, z + HALF],
    [x - HALF, h, z - HALF], [x + HALF, h, z - HALF], [x + HALF, h, z + HALF], [x - HALF, h, z + HALF],
  ].map((p) => project(cam, p[0] ?? 0, p[1] ?? 0, p[2] ?? 0));
  ctx.strokeStyle = style;
  ctx.beginPath();
  for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]] as const) {
    const pa = c[a];
    const pb = c[b];
    if (!pa || !pb) continue;
    ctx.moveTo(pa[0], pa[1]);
    ctx.lineTo(pb[0], pb[1]);
  }
  ctx.stroke();
}

export default defineCanvasFigure<null>({
  id: 'systolic-array',
  title: 'Systolic array',
  alt: 'A six by six grid of small wireframe cubes seen in perspective, joined by thin links; small squares travel along the links from the left and from the back, and a diagonal band of cubes rises and brightens as they pass; one cube is teal.',
  idea: 'How a matrix unit multiplies: operands pulse through a grid of simple cells, each doing one multiply-add per beat, and the answer forms along a moving diagonal.',
  style: 'wireframe',
  motion: 'ambient',
  answers: true,
  group: 'feature',
  seed: 808,
  aspect: 1.6,
  setup: () => null,
  draw: ({ ctx, w, h, t, pointer, hover }) => {
    const cam = camera({ cx: w / 2, cy: h * 0.5, scale: Math.min(w * 0.34, h * 0.56), yaw: 0.62, pitch: 0.78, dist: 4.2 });
    const beat = t / BEAT;
    const front = beat % (2 * N + 2);
    const pi = pointer.active && hover > 0.3 ? clamp(Math.floor(pointer.y * N), 0, N - 1) : -1;
    const pj = pointer.active && hover > 0.3 ? clamp(Math.floor(pointer.x * N), 0, N - 1) : -1;

    // Links along rows (activations, left to right) and columns (weights, back to front).
    for (let i = 0; i < N; i++) {
      const rowHot = i === pi;
      const colHot = i === pj;
      ctx.strokeStyle = ink.line(rowHot ? 0.5 : 0.14);
      ctx.beginPath();
      const ra = project(cam, pos(0) - PITCH, 0.02, pos(i));
      const rb = project(cam, pos(N - 1), 0.02, pos(i));
      ctx.moveTo(ra[0], ra[1]);
      ctx.lineTo(rb[0], rb[1]);
      ctx.stroke();
      ctx.strokeStyle = ink.line(colHot ? 0.5 : 0.14);
      ctx.beginPath();
      const ca = project(cam, pos(i), 0.02, pos(0) - PITCH);
      const cb = project(cam, pos(i), 0.02, pos(N - 1));
      ctx.moveTo(ca[0], ca[1]);
      ctx.lineTo(cb[0], cb[1]);
      ctx.stroke();
    }

    // Cells back to front, so nearer wireframes draw over farther ones.
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const wave = Math.max(0, 1 - Math.abs(i + j - front) / 1.3);
        const picked = i === pi && j === pj;
        const head = pi < 0 && i === 2 && Math.abs(i + j - front) < 0.5;
        const style = picked || head ? ink.signal(0.95) : ink.line(0.22 + wave * 0.55);
        cube(ctx, cam, pos(j), pos(i), 0.06 + wave * 0.1, style);
      }
    }

    // Operands in flight: one per row and column, a beat apart, entering from the edges.
    const step = beat % 1;
    for (let i = 0; i < N; i++) {
      const k = front - i - step;
      for (const [x, z] of [[pos(0) - PITCH + (k + step) * PITCH, pos(i)], [pos(i), pos(0) - PITCH + (k + step) * PITCH]] as const) {
        if (x < pos(0) - PITCH || x > pos(N - 1) || z < pos(0) - PITCH || z > pos(N - 1)) continue;
        const p = project(cam, x, 0.02, z);
        ctx.fillStyle = ink.line(0.7);
        ctx.fillRect(p[0] - 1.5, p[1] - 1.5, 3, 3);
      }
    }
    return pi >= 0 ? `pe ${pi},${pj}` : 'rest';
  },
});
