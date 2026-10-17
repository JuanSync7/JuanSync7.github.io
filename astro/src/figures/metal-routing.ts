import { defineCanvasFigure } from './define';
import { ink } from './kit/ink';

/** River routing on a via grid: every net runs from a pin on the left to a pin on the right
 *  with one jog, and the jogs are ordered so no two wires ever share a track or cross: a net
 *  heading down jogs before the nets above it, one heading up before the nets below it. The
 *  router lays one net at a time in the signal; the pointer's row picks a net instead. */

interface Net {
  from: number;
  to: number;
  jog: number;
}

interface State {
  nets: Net[];
}

const COLS = 22;
const ROWS = 11;
const NETS = 8;

function pickSorted(rng: () => number, n: number, of: number): number[] {
  const all = Array.from({ length: of }, (_, i) => i);
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [all[i], all[j]] = [all[j] ?? 0, all[i] ?? 0];
  }
  return all.slice(0, n).sort((a, b) => a - b);
}

export default defineCanvasFigure<State>({
  id: 'metal-routing',
  title: 'Metal routing',
  alt: 'A grid of faint via dots with eight wires routed across it in right angles, each from a square pin on the left to one on the right, none crossing; one wire is teal.',
  idea: 'Place and route seen from above: wires are laid pin to pin on the via grid, one net at a time, each jog placed so no wire ever crosses another.',
  style: 'trace',
  motion: 'ambient',
  answers: true,
  group: 'cover',
  seed: 428,
  aspect: 2,
  setup: ({ rng }) => {
    const from = pickSorted(rng, NETS, ROWS);
    const to = pickSorted(rng, NETS, ROWS);
    const nets: Net[] = from.map((f, k) => ({ from: f, to: to[k] ?? f, jog: 0 }));
    // Down-going nets jog bottom-first, up-going nets top-first; columns spread across the
    // middle of the grid in that order, so every vertical crosses only empty rows.
    const order = [...nets.filter((n) => n.to > n.from).reverse(), ...nets.filter((n) => n.to <= n.from)];
    const cols = pickSorted(rng, order.length, COLS - 6).map((c) => c + 3);
    order.forEach((n, i) => {
      n.jog = cols[i] ?? 3;
    });
    return { nets };
  },
  draw: ({ ctx, w, h, t, pointer, hover, state }) => {
    const X = (g: number): number => w * 0.07 + (g * (w * 0.86)) / (COLS - 1);
    const Y = (g: number): number => h * 0.14 + (g * (h * 0.72)) / (ROWS - 1);
    ctx.fillStyle = ink.line(0.14);
    for (let gx = 0; gx < COLS; gx++)
      for (let gy = 0; gy < ROWS; gy++) ctx.fillRect(X(gx) - 0.75, Y(gy) - 0.75, 1.5, 1.5);
    const row = pointer.active ? Math.round(pointer.y * (ROWS + 1) - 1) : -1;
    const chosen = hover > 0.5 ? state.nets.findIndex((n) => n.from === row) : -1;
    const lit = pointer.active ? chosen : Math.floor(t / 2.4) % state.nets.length;
    state.nets.forEach((n, k) => {
      const pts: [number, number][] = [
        [X(0), Y(n.from)],
        [X(n.jog), Y(n.from)],
        [X(n.jog), Y(n.to)],
        [X(COLS - 1), Y(n.to)],
      ];
      const hot = k === lit;
      const total = Math.abs(pts[3][0] - pts[0][0]) + Math.abs(pts[2][1] - pts[1][1]);
      let left = (hot ? Math.min(1, ((t * 0.5) % 1.6) / 1.2) : 1) * total;
      ctx.strokeStyle = hot ? ink.signal(0.9) : ink.line(0.32);
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length && left > 0; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        if (!a || !b) break;
        const len = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
        const f = len === 0 ? 1 : Math.min(1, left / len);
        ctx.lineTo(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f);
        left -= len;
      }
      ctx.stroke();
      // Vias where the wire changes layer, at both ends of the jog.
      if (n.from !== n.to) {
        ctx.strokeStyle = hot ? ink.signal(0.7) : ink.line(0.4);
        for (const p of [pts[1], pts[2]]) ctx.strokeRect(p[0] - 2, p[1] - 2, 4, 4);
      }
      for (const p of [pts[0], pts[3]]) {
        ctx.fillStyle = ink.ground();
        ctx.fillRect(p[0] - 3.5, p[1] - 3.5, 7, 7);
        ctx.strokeStyle = hot ? ink.signal(0.95) : ink.line(0.5);
        ctx.strokeRect(p[0] - 3.5, p[1] - 3.5, 7, 7);
      }
    });
    return pointer.active && chosen >= 0 ? `net ${chosen + 1}` : 'rest';
  },
});
