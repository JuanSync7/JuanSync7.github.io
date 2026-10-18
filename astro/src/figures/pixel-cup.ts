import { defineCanvasFigure } from './define';
import { ink } from './kit/ink';
import { noise2, type Noise2 } from './kit/noise';
import { bayer, cell, pixelGrid, type PixelGrid } from './kit/pixel';

/** Three pixel-art cups on a podium, second, first and third, steam curling off each in
 *  dithered wisps. The winner's coffee is the signal. The pointer picks a cup, which lifts
 *  off its step with its steam rising higher; the read-out names its place. */

interface State {
  noise: Noise2;
}

const COLS = 72;
const ROWS = 36;
const PODIUM = [
  { x: 14, top: 27, place: 2 },
  { x: 36, top: 23, place: 1 },
  { x: 58, top: 30, place: 3 },
] as const;

function cup(ctx: CanvasRenderingContext2D, g: PixelGrid, cx: number, base: number, winner: boolean): void {
  const line = ink.line(0.6);
  for (let x = cx - 4; x <= cx + 4; x++) cell(ctx, g, x, base - 7, line);
  for (let y = base - 6; y <= base - 1; y++) {
    cell(ctx, g, cx - 4 + (y > base - 3 ? 1 : 0), y, line);
    cell(ctx, g, cx + 4 - (y > base - 3 ? 1 : 0), y, line);
  }
  for (let x = cx - 3; x <= cx + 3; x++) cell(ctx, g, x, base - 1, line);
  for (const [dx, dy] of [
    [5, -6],
    [6, -5],
    [6, -4],
    [5, -3],
  ] as const)
    cell(ctx, g, cx + dx, base + dy, line);
  for (let x = cx - 3; x <= cx + 3; x++) cell(ctx, g, x, base - 6, winner ? ink.signal(0.9) : ink.line(0.25));
  for (let x = cx - 6; x <= cx + 6; x++) cell(ctx, g, x, base, ink.line(0.35));
}

export default defineCanvasFigure<State>({
  id: 'pixel-cup',
  title: 'Pixel cup',
  alt: 'Pixel art of three small coffee cups on a three-step podium, the tallest step in the middle, grey steam wisps rising from each; the middle cup’s coffee is teal.',
  idea: 'Ranking coffee as a podium in pixels: three cups, the winner in the middle, steam rising off each like a score you can watch.',
  style: 'pixel',
  motion: 'ambient',
  answers: true,
  group: 'cover',
  seed: 1105,
  aspect: 2,
  setup: ({ rng }) => ({ noise: noise2(rng) }),
  draw: ({ ctx, w, h, t, pointer, hover, state }) => {
    const g = pixelGrid(w, h, COLS, ROWS);
    const pick = pointer.active && hover > 0.3 ? Math.min(2, Math.floor(pointer.x * 3)) : -1;
    PODIUM.forEach((p, k) => {
      for (let y = p.top + 1; y < ROWS - 2; y++) {
        for (let x = p.x - 10; x <= p.x + 10; x++) {
          const edge = y === p.top + 1 || x === p.x - 10 || x === p.x + 10;
          if (edge) cell(ctx, g, x, y, ink.line(0.3));
        }
      }
      // The picked cup is lifted off its step, as if picked up to taste.
      const lift = k === pick ? 3 : 0;
      cup(ctx, g, p.x, p.top - lift, p.place === 1);
      const tall = k === pick ? 15 : 9;
      for (let wisp = -1; wisp <= 1; wisp++) {
        for (let s = 1; s <= tall; s++) {
          const y = p.top - lift - 8 - s;
          const drift = state.noise(s * 0.22 - t * 1.1, k * 5 + wisp * 1.7) * 2.6;
          const x = p.x + wisp * 2 + Math.round(drift + Math.sin(s * 0.5 - t * 2 + wisp) * 0.6);
          const fade = 1 - s / (tall + 1);
          if (fade * 0.9 > bayer(x, y)) cell(ctx, g, x, y, ink.line(0.2 + fade * 0.35));
        }
      }
    });
    for (let x = 2; x < COLS - 2; x++) cell(ctx, g, x, ROWS - 2, ink.line(0.2));
    const placed = PODIUM[pick];
    return placed ? `#${placed.place}` : 'rest';
  },
});
