import { defineCanvasFigure } from './define';
import { ink } from './kit/ink';

/** A low-poly lattice like a die under glass: a jittered triangle mesh that drifts, bends
 *  away from the pointer and lights around it. A click sends a ring through the mesh. */

interface Node {
  bx: number;
  by: number;
  ph: number;
  amp: number;
  x: number;
  y: number;
  f: number;
}

interface State {
  pts: Node[];
  tris: [number, number, number, number][];
  cx: number;
  cy: number;
}

const CELL = 78;

export default defineCanvasFigure<State>({
  id: 'lattice-field',
  title: 'Lattice field',
  alt: 'A dark triangle mesh fills the frame; the triangles near the pointer bend away from it and light up teal, and a click sends a teal ring outward.',
  idea: 'A die seen through glass: the mesh is the silicon, the pointer is a probe, and the light around it is where the probe is reading.',
  style: 'lowpoly',
  motion: 'ambient',
  answers: true,
  group: 'hero',
  seed: 11,
  aspect: 21 / 10,
  bleed: true,
  setup: ({ w, h, rng }) => {
    const rnd = rng;
    const sy = CELL * 0.86;
    const cols = Math.ceil(w / CELL) + 3;
    const rows = Math.ceil(h / sy) + 3;
    const pts: Node[] = [];
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const bx = (i - 1) * CELL + (j % 2 ? CELL / 2 : 0) + (rnd() - 0.5) * CELL * 0.5;
        const by = (j - 1) * sy + (rnd() - 0.5) * sy * 0.5;
        pts.push({ bx, by, ph: rnd() * 6.283, amp: 3 + rnd() * 6, x: bx, y: by, f: 0 });
      }
    }
    const id = (a: number, b: number): number => b * cols + a;
    const tris: [number, number, number, number][] = [];
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        if (j % 2 === 0) {
          tris.push(
            [id(i, j), id(i + 1, j), id(i, j + 1), rnd()],
            [id(i + 1, j), id(i + 1, j + 1), id(i, j + 1), rnd()],
          );
        } else {
          tris.push(
            [id(i, j), id(i + 1, j + 1), id(i, j + 1), rnd()],
            [id(i, j), id(i + 1, j), id(i + 1, j + 1), rnd()],
          );
        }
      }
    }
    return { pts, tris, cx: w * 0.7, cy: h * 0.45 };
  },
  draw: ({ ctx, w, h, t, dt, pointer, pulses, still, state }) => {
    const tx = pointer.active ? pointer.x * w : w * (0.68 + 0.2 * Math.sin(t * 0.23));
    const ty = pointer.active ? pointer.y * h : h * (0.48 + 0.3 * Math.sin(t * 0.17 + 1.2));
    const k = still ? 1 : 1 - Math.exp(-dt * 4.5);
    state.cx += (tx - state.cx) * k;
    state.cy += (ty - state.cy) * k;
    const R = pointer.active ? 260 : 210;
    for (const p of state.pts) {
      p.x = p.bx + Math.sin(t * 0.5 + p.ph) * p.amp;
      p.y = p.by + Math.cos(t * 0.37 + p.ph * 1.3) * p.amp;
      const dx = p.x - state.cx;
      const dy = p.y - state.cy;
      const d = Math.hypot(dx, dy) || 1;
      let f = Math.max(0, 1 - d / R);
      p.x += (dx / d) * f * f * 24;
      p.y += (dy / d) * f * f * 24;
      for (const q of pulses) {
        const ring = Math.hypot(p.x - q.x * w, p.y - q.y * h);
        f = Math.max(f, Math.max(0, 1 - Math.abs(ring - q.age * 560) / 48) * Math.max(0, 1 - q.age / 1.8));
      }
      p.f = f;
    }
    for (const [a, b, c, shade] of state.tris) {
      const A = state.pts[a];
      const B = state.pts[b];
      const C = state.pts[c];
      if (!A || !B || !C) continue;
      const ff = (A.f + B.f + C.f) / 3;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.lineTo(C.x, C.y);
      ctx.closePath();
      ctx.fillStyle = ink.line(0.008 + shade * 0.024);
      ctx.fill();
      if (ff > 0.01) {
        ctx.fillStyle = ink.signal(ff * 0.2);
        ctx.fill();
      }
      ctx.strokeStyle = ff > 0.01 ? ink.signal(0.06 + ff * 0.62) : ink.line(0.05);
      ctx.stroke();
    }
    for (const p of state.pts) {
      if (p.f <= 0.12) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1 + p.f * 2.4, 0, Math.PI * 2);
      ctx.fillStyle = ink.signal(Math.min(1, p.f * 1.2));
      ctx.fill();
    }
    return pointer.active ? 'probe' : 'rest';
  },
});
