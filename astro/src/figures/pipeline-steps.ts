import { defineCanvasFigure } from './define';
import { ink } from './kit/ink';

/** The classic five-stage pipeline chart, running: rows are instructions, columns are
 *  cycles, and each instruction steps diagonally through fetch, decode, execute, memory and
 *  write-back. A dependent instruction stalls one cycle (a dashed bubble) and the hazard is
 *  resolved by forwarding, drawn in the signal. The pointer picks a cycle column. */

interface State {
  dep: boolean[];
  /** start[g] for g in one table period: the cycle instruction g is fetched. */
  start: number[];
  shift: number;
}

const TABLE = 24;
const STAGES = 5;
const COLS = 13;
const RATE = 1 / 0.75;
/** Fill opacity per stage: the execute stage is the heaviest. */
const TONE = [0.06, 0.1, 0.18, 0.1, 0.06] as const;

export default defineCanvasFigure<State>({
  id: 'pipeline-steps',
  title: 'Pipeline steps',
  alt: 'A staircase of small outlined boxes, five per row, each row one cycle to the right of the last; one row has a dashed empty box, and a teal hook joins it to the row above.',
  idea: 'A RISC-V pipeline as its textbook chart, moving: instructions step through five stages, a dependent one stalls, and forwarding hands it the value.',
  style: 'trace',
  motion: 'ambient',
  answers: true,
  group: 'cover',
  seed: 505,
  aspect: 2,
  setup: ({ rng }) => {
    const dep = Array.from({ length: TABLE }, (_, i) => i % 4 === 2 || rng() < 0.12);
    const start: number[] = [];
    let s = 0;
    for (let g = 0; g < TABLE; g++) {
      start.push(s);
      s += dep[(g + 1) % TABLE] ? 2 : 1;
    }
    return { dep, start, shift: s };
  },
  draw: ({ ctx, w, h, t, pointer, hover, state }) => {
    const startOf = (g: number): number => {
      const k = Math.floor(g / TABLE);
      return k * state.shift + (state.start[g - k * TABLE] ?? 0);
    };
    const depOf = (g: number): boolean => state.dep[((g % TABLE) + TABLE) % TABLE] ?? false;
    const now = t * RATE + 6;
    const left = now - 6;
    const cw = (w * 0.88) / COLS;
    const ch = Math.min(cw * 0.62, (h * 0.78) / 7);
    const X = (cycle: number): number => w * 0.06 + (cycle - left) * cw;
    // Rows are spaced by instruction, not by fetch cycle, so a stall shows as a sideways
    // shift, as in the textbook chart. `row0` is the fractional instruction at `left`.
    let g0 = Math.max(0, Math.floor(left) - 2 * STAGES);
    while (startOf(g0 + 1) <= left) g0++;
    const row0 = g0 + (left - startOf(g0)) / Math.max(1, startOf(g0 + 1) - startOf(g0));
    const Y = (g: number): number => h * 0.12 + (g - row0) * ch;
    const pick =
      pointer.active && hover > 0.3 ? Math.floor(left + ((pointer.x - 0.06) / 0.88) * COLS) : Math.floor(now);

    ctx.save();
    ctx.beginPath();
    ctx.rect(w * 0.06, 0, w * 0.88, h);
    ctx.clip();
    ctx.strokeStyle = ink.line(0.1);
    ctx.strokeRect(X(pick) + 0.5, h * 0.06, cw - 1, h * 0.88);

    let g = 0;
    while (startOf(g) < left - STAGES - 2) g++;
    let hooked = false;
    for (; startOf(g) < left + COLS + 1; g++) {
      const s0 = startOf(g);
      const y = Y(g);
      if (y > h) break;
      const stall = depOf(g);
      const cycles: (number | null)[] = stall ? [0, 1, null, 3, 4, 5] : [0, 1, 2, 3, 4];
      let stage = 0;
      cycles.forEach((c, k) => {
        const x = X(s0 + k);
        if (c === null) {
          ctx.setLineDash([2, 3]);
          ctx.strokeStyle = ink.line(0.3);
          ctx.strokeRect(x + 3.5, y + 3.5, cw - 7, ch - 7);
          ctx.setLineDash([]);
          return;
        }
        const inPick = s0 + k === pick;
        ctx.fillStyle = ink.line((TONE[stage] ?? 0.1) * (inPick ? 2.2 : 1));
        ctx.fillRect(x + 3, y + 3, cw - 6, ch - 6);
        ctx.strokeStyle = ink.line(inPick ? 0.6 : 0.32);
        ctx.strokeRect(x + 3.5, y + 3.5, cw - 7, ch - 7);
        stage++;
      });
      // Forwarding for the stalled instruction nearest the current cycle: from the end of
      // the producer's memory stage into the consumer's execute stage.
      if (stall && !hooked && s0 + 3 >= now - 1) {
        hooked = true;
        const p0 = startOf(g - 1);
        const ax = X(p0 + 4) - 3;
        const ay = Y(g - 1) + ch / 2;
        const bx = X(s0 + 3) + 3;
        const by = y + ch / 2;
        ctx.strokeStyle = ink.signal(0.9);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.bezierCurveTo(ax + cw * 0.5, ay, bx - cw * 0.5, by, bx, by);
        ctx.stroke();
        ctx.fillStyle = ink.signal(0.9);
        ctx.fillRect(bx - 1.5, by - 1.5, 3, 3);
      }
    }
    ctx.restore();
    return pointer.active && hover > 0.3 ? `cycle ${pick}` : 'rest';
  },
});
