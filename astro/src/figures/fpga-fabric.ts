import { defineCanvasFigure } from './define';
import { ink } from './kit/ink';
import { cell, dither, pixelGrid } from './kit/pixel';

/** FPGA fabric in pixels: logic blocks in a grid with routing channels between them. A
 *  quantised network is configured into a column of blocks; activations sweep through it
 *  layer by layer as dithered tone. The pointer injects an input at its block. */

interface State {
  weights: number[];
}

const BLOCK = 4;
const COLS = 14;
const ROWS = 6;

export default defineCanvasFigure<State>({
  id: 'fpga-fabric',
  title: 'FPGA fabric',
  alt: 'A pixel grid of square logic blocks separated by thin channels; a wave of brighter dithered blocks sweeps left to right, and one block is teal.',
  idea: 'A neural net placed on FPGA fabric: each column of logic blocks is a layer, and activations sweep across the fabric one layer per clock.',
  style: 'pixel',
  motion: 'ambient',
  answers: true,
  group: 'cover',
  seed: 330,
  aspect: 2,
  setup: ({ rng }) => ({ weights: Array.from({ length: COLS * ROWS }, () => 0.25 + rng() * 0.75) }),
  draw: ({ ctx, w, h, t, pointer, hover, state }) => {
    const g = pixelGrid(w * 0.92, h * 0.86, COLS * (BLOCK + 1) - 1, ROWS * (BLOCK + 1) - 1);
    g.ox += Math.floor(w * 0.04);
    g.oy += Math.floor(h * 0.07);
    const front = (t * 3) % (COLS + 4);
    const px = pointer.active ? Math.floor(pointer.x * COLS) : -1;
    const py = pointer.active ? Math.floor(pointer.y * ROWS) : -1;
    let read = 'rest';
    for (let bx = 0; bx < COLS; bx++) {
      for (let by = 0; by < ROWS; by++) {
        const wgt = state.weights[by * COLS + bx] ?? 0.5;
        const wave = Math.max(0, 1 - Math.abs(bx - front) / 1.6) * wgt;
        const near = pointer.active ? Math.max(0, 1 - Math.hypot(bx - px, (by - py) * 1.4) / 3) * hover : 0;
        const tone = wave * 0.75 + near * 0.6;
        const hot = bx === px && by === py ? true : !pointer.active && bx === Math.floor(front) && by === 2;
        if (hot && pointer.active) read = `clb ${bx}·${by}`;
        for (let x = 0; x < BLOCK; x++) {
          for (let y = 0; y < BLOCK; y++) {
            const gx = bx * (BLOCK + 1) + x;
            const gy = by * (BLOCK + 1) + y;
            if (hot) cell(ctx, g, gx, gy, ink.signal(0.9), 1);
            else {
              cell(ctx, g, gx, gy, ink.line(0.07), 1);
              dither(ctx, g, gx, gy, tone, ink.line(0.55), 1);
            }
          }
        }
      }
    }
    return read;
  },
});
