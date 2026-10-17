import { defineCanvasFigure } from './define';
import { ink } from './kit/ink';
import { cell, pixelGrid } from './kit/pixel';

/** A terminal in pixels with no letters in it: each line is a run of blocks, words are the
 *  gaps, and the newest line types itself out behind a block cursor, which blinks in the
 *  pause before the screen scrolls. The pointer's row is shown in inverse video. */

interface State {
  lines: number[][];
  /** Cells already typed before t = 0, so the screen starts full instead of empty. */
  prefill: number;
}

const COLS = 60;
const ROWS = 12;
const POOL = 48;
const TYPE = 26;
/** Cells' worth of time the cursor waits at the end of a line. */
const PAUSE = 8;

export default defineCanvasFigure<State>({
  id: 'crt-terminal',
  title: 'CRT terminal',
  alt: 'A pixel-art terminal screen in a rounded frame, filled with rows of grey block runs like text without letters, a new row typing out behind a teal block cursor.',
  idea: 'A terminal made of blocks: you read a shell by the shape of its lines, the prompt, the output, the cursor waiting at the end.',
  style: 'pixel',
  motion: 'ambient',
  answers: true,
  group: 'cover',
  seed: 77,
  aspect: 2,
  setup: ({ rng }) => {
    const lines: number[][] = [];
    for (let i = 0; i < POOL; i++) {
      const runs: number[] = [];
      const prompt = rng() < 0.35;
      if (prompt) runs.push(2, 1);
      let len = prompt ? 3 : 0;
      const want = 8 + Math.floor(rng() * (prompt ? 26 : 46));
      while (len < want) {
        const word = 2 + Math.floor(rng() * 7);
        runs.push(word, 1);
        len += word + 1;
      }
      lines.push(runs);
    }
    const prefill =
      lines.slice(0, ROWS - 1).reduce((sum, runs) => sum + runs.reduce((a, b) => a + b, 0) + PAUSE, 0) + 6;
    return { lines, prefill };
  },
  draw: ({ ctx, w, h, t, pointer, hover, state }) => {
    const g = pixelGrid(w * 0.9, h * 0.86, COLS + 4, ROWS + 4);
    g.ox += Math.floor(w * 0.05);
    g.oy += Math.floor(h * 0.07);
    // Bezel: a pixel outline with the corners knocked off.
    for (let x = 1; x < COLS + 3; x++) {
      cell(ctx, g, x, 0, ink.line(0.2));
      cell(ctx, g, x, ROWS + 3, ink.line(0.2));
    }
    for (let y = 1; y < ROWS + 3; y++) {
      cell(ctx, g, 0, y, ink.line(0.2));
      cell(ctx, g, COLS + 3, y, ink.line(0.2));
    }
    const typed = state.prefill + t * TYPE;
    const lineLen = (k: number): number => (state.lines[k % POOL] ?? []).reduce((a, b) => a + b, 0);
    let done = 0;
    let k = 0;
    while (done + lineLen(k) + PAUSE < typed) {
      done += lineLen(k) + PAUSE;
      k++;
    }
    const partial = Math.max(0, typed - done);
    const pickRow = pointer.active && hover > 0.3 ? Math.floor(pointer.y * (ROWS + 4)) - 2 : -99;
    let read = 'rest';
    for (let row = 0; row < ROWS; row++) {
      const lineIx = k - (ROWS - 1) + row;
      if (lineIx < 0) continue;
      const runs = state.lines[lineIx % POOL] ?? [];
      const live = lineIx === k;
      const inverse = row === pickRow;
      if (inverse) read = `ln ${lineIx + 1}`;
      let x = 0;
      const limit = live ? Math.floor(partial) : COLS;
      for (let r = 0; r < runs.length; r++) {
        const n = runs[r] ?? 0;
        const word = r % 2 === 0;
        const prompt = r === 0 && runs.length > 2 && n === 2;
        for (let i = 0; i < n && x < COLS && x < limit; i++, x++) {
          // Inverse video: the line becomes a bar and its words are cut out of it.
          if (inverse) cell(ctx, g, x + 2, row + 2, word ? ink.line(0.14) : ink.line(0.62), 1);
          else if (word) cell(ctx, g, x + 2, row + 2, ink.line(prompt ? 0.75 : 0.42), 1);
        }
      }
      if (inverse) for (; x < COLS; x++) cell(ctx, g, x + 2, row + 2, ink.line(0.62), 1);
      // Solid while typing, blinking only in the pause after the line.
      const since = (partial - lineLen(lineIx)) / TYPE;
      if (live && (since < 0 || Math.floor(since * 2.2) % 2 === 0))
        cell(ctx, g, Math.min(COLS - 1, Math.floor(partial)) + 2, row + 2, ink.signal(0.95));
    }
    return read;
  },
});
