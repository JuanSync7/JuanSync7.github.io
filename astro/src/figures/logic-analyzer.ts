import { defineCanvasFigure } from './define';
import { ink } from './kit/ink';

/** A logic analyser capture scrolling past: a clock, four data lines and a bus. A cursor
 *  marks one capture edge; its setup window is bracketed, and the data edge that lands
 *  nearest it — the critical one — is drawn in the signal. Hovering stops the capture, moves
 *  the cursor and measures that path's slack. */

interface State {
  bits: number[];
  delay: number[];
  /** Capture position in clock periods; it stops advancing while the pointer holds it. */
  scroll: number;
}

const TABLE = 64;
const ROWS = 5;
const SPAN = 9;
const SETUP = 0.18;
const SLEW = 0.04;

export default defineCanvasFigure<State>({
  id: 'logic-analyzer',
  title: 'Logic analyzer',
  alt: 'A timing diagram: a square clock wave above four digital lines and a bus drawn as crossing pairs, scrolling left, with one capture edge marked and one data edge in teal.',
  idea: 'Timing closure as a capture: the clock edge, the setup window before it, and the one data edge that arrives closest — the path the tools are fighting for.',
  style: 'trace',
  motion: 'ambient',
  answers: true,
  group: 'cover',
  seed: 902,
  aspect: 2,
  setup: ({ rng }) => ({
    bits: Array.from({ length: TABLE * ROWS }, () => (rng() < 0.5 ? 0 : 1)),
    delay: Array.from({ length: TABLE * ROWS }, () => 0.12 + rng() * 0.7),
    scroll: 0,
  }),
  draw: ({ ctx, w, h, dt, pointer, hover, state }) => {
    const x0 = w * 0.06;
    const x1 = w * 0.94;
    const pitch = (x1 - x0) / SPAN;
    // Like an analyser's stop button: hovering halts the capture so the edge can be measured.
    state.scroll += dt * 0.55 * (1 - (pointer.active ? hover : 0));
    const scroll = state.scroll;
    const X = (time: number): number => x0 + (time - scroll) * pitch;
    const rowH = (h * 0.72) / (ROWS + 1);
    const amp = rowH * 0.42;
    const top = h * 0.16;
    const at = (row: number, n: number): { bit: number; edge: number } => {
      const k = row * TABLE + (((n % TABLE) + TABLE) % TABLE);
      return { bit: state.bits[k] ?? 0, edge: n + (state.delay[k] ?? 0.5) };
    };
    const first = Math.floor(scroll) - 1;
    const last = Math.ceil(scroll + SPAN) + 1;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, 0, x1 - x0, h);
    ctx.clip();

    // Clock: rises on each integer, falls at the half.
    const cy = top;
    ctx.strokeStyle = ink.line(0.5);
    ctx.beginPath();
    for (let n = first; n <= last; n++) {
      ctx.lineTo(X(n), cy);
      ctx.lineTo(X(n + SLEW), cy - amp);
      ctx.lineTo(X(n + 0.5), cy - amp);
      ctx.lineTo(X(n + 0.5 + SLEW), cy);
    }
    ctx.stroke();

    // The capture edge under the cursor, and the data edge nearest before it.
    const cursorT = scroll + (pointer.active ? pointer.x : 0.62) * SPAN;
    const capture = Math.round(cursorT);
    let worst = { row: -1, edge: -Infinity };
    for (let r = 1; r < ROWS; r++) {
      const e = at(r, capture - 1).edge;
      if (e > worst.edge) worst = { row: r, edge: e };
    }
    ctx.strokeStyle = ink.line(0.12);
    ctx.beginPath();
    ctx.moveTo(X(capture), top - amp - 8);
    ctx.lineTo(X(capture), top + rowH * ROWS + 6);
    ctx.stroke();

    for (let r = 1; r <= ROWS; r++) {
      const base = top + r * rowH;
      const bus = r === ROWS;
      for (let n = first; n <= last; n++) {
        const a = at(r, n);
        const b = at(r, n + 1);
        const prev = at(r, n - 1);
        const hot = !bus && r === worst.row && n === capture - 1;
        if (bus) {
          // A bus is a pair of lines that cross wherever the value changes.
          ctx.strokeStyle = ink.line(0.4);
          ctx.beginPath();
          ctx.moveTo(X(a.edge), base - amp / 2);
          ctx.lineTo(X(a.edge + SLEW * 2), base - amp);
          ctx.lineTo(X(b.edge), base - amp);
          ctx.lineTo(X(b.edge + SLEW * 2), base);
          ctx.moveTo(X(a.edge), base - amp / 2);
          ctx.lineTo(X(a.edge + SLEW * 2), base);
          ctx.lineTo(X(b.edge), base);
          ctx.lineTo(X(b.edge + SLEW * 2), base - amp);
          ctx.stroke();
          continue;
        }
        const y = (bit: number): number => base - bit * amp;
        ctx.strokeStyle = ink.line(0.4);
        ctx.beginPath();
        ctx.moveTo(X(a.edge + SLEW), y(a.bit));
        ctx.lineTo(X(b.edge), y(a.bit));
        ctx.stroke();
        ctx.strokeStyle = hot ? ink.signal(0.95) : ink.line(0.4);
        ctx.beginPath();
        ctx.moveTo(X(a.edge), y(prev.bit));
        ctx.lineTo(X(a.edge + SLEW), y(a.bit));
        if (hot) ctx.lineTo(X(Math.min(b.edge, capture)), y(a.bit));
        ctx.stroke();
      }
    }

    // Hovering measures the slack on the critical path: a dimension line from its data edge
    // to the start of the setup window, ticked at both ends.
    if (pointer.active && hover > 0.3 && worst.row > 0) {
      // The setup line drops through every row, so you can see which data edges clear it.
      ctx.strokeStyle = ink.line(0.4 * hover);
      ctx.beginPath();
      for (let y = top - amp; y < top + rowH * ROWS + 6; y += 6) {
        ctx.moveTo(X(capture - SETUP), y);
        ctx.lineTo(X(capture - SETUP), y + 3);
      }
      ctx.stroke();
      const y = top + worst.row * rowH + 6;
      const a = X(worst.edge + SLEW);
      const b = X(capture - SETUP);
      ctx.strokeStyle = ink.signal(0.9 * hover);
      ctx.beginPath();
      ctx.moveTo(a, y - 3);
      ctx.lineTo(a, y + 3);
      ctx.moveTo(a, y);
      ctx.lineTo(b, y);
      ctx.moveTo(b, y - 3);
      ctx.lineTo(b, y + 3);
      ctx.stroke();
    }

    // Setup window: a bracket under the clock, ending at the capture edge.
    const by = top + 8;
    ctx.strokeStyle = ink.line(0.45);
    ctx.beginPath();
    ctx.moveTo(X(capture - SETUP), by - 3);
    ctx.lineTo(X(capture - SETUP), by);
    ctx.lineTo(X(capture), by);
    ctx.lineTo(X(capture), by - 3);
    ctx.stroke();
    ctx.restore();
    const slack = capture - SETUP - worst.edge;
    return pointer.active ? `edge ${capture} · slack ${slack >= 0 ? '+' : ''}${slack.toFixed(2)}` : 'rest';
  },
});
