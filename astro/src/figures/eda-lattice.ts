import { defineCanvasFigure } from './define';
import { camera, project } from './kit/camera';
import { strokeMesh } from './kit/draw';
import { ink } from './kit/ink';
import { lattice, type Mesh } from './kit/models';
import { follow } from './kit/motion';

/** A design as a wireframe lattice turning in space, and one net traced through it corner
 *  to corner in the signal, the way a script walks a netlist graph. The pointer turns the
 *  lattice by hand. */

const N = 5;

interface State {
  mesh: Mesh;
  path: number[];
  yaw: number;
  pitch: number;
}

const idOf = (a: number, b: number, c: number): number => (a * N + b) * N + c;

export default defineCanvasFigure<State>({
  id: 'eda-lattice',
  title: 'EDA lattice',
  alt: 'A cube of evenly spaced grey wireframe nodes and edges seen in perspective and slowly turning, with one teal path stepping along its edges from one corner to the opposite corner.',
  idea: 'EDA scripting as graph walking: the design is a lattice of nodes, and the script traces one net through it, one hop at a time.',
  style: 'wireframe',
  motion: 'ambient',
  answers: true,
  group: 'cover',
  seed: 3141,
  aspect: 2,
  setup: ({ rng }) => {
    const at = [0, 0, 0];
    const path = [idOf(0, 0, 0)];
    while (at[0] !== N - 1 || at[1] !== N - 1 || at[2] !== N - 1) {
      const open = [0, 1, 2].filter((k) => (at[k] ?? 0) < N - 1);
      const k = open[Math.floor(rng() * open.length)] ?? 0;
      at[k] = (at[k] ?? 0) + 1;
      path.push(idOf(at[0] ?? 0, at[1] ?? 0, at[2] ?? 0));
    }
    return { mesh: lattice(N, 0.62), path, yaw: 0.6, pitch: 0.42 };
  },
  draw: ({ ctx, w, h, t, dt, pointer, hover, still, state }) => {
    const ty = pointer.active ? (pointer.x - 0.5) * 3 : 0.6 + t * 0.2;
    const tp = pointer.active ? 0.15 + pointer.y * 0.7 : 0.42;
    const rate = pointer.active ? 6 * hover + 0.5 : 50;
    state.yaw = still ? ty : follow(state.yaw, ty, dt, rate);
    state.pitch = still ? tp : follow(state.pitch, tp, dt, 4);
    const cam = camera({
      cx: w / 2,
      cy: h / 2,
      scale: Math.min(w, h) * 0.5,
      yaw: state.yaw,
      pitch: state.pitch,
      dist: 3.6,
    });
    strokeMesh(ctx, state.mesh, cam, { alpha: 0.85, hot: 0, radius: 1.1 });
    const hops = state.path.length - 1;
    const shown = Math.min(hops, (t * 4) % (hops + 6));
    ctx.strokeStyle = ink.signal(0.95);
    ctx.beginPath();
    for (let i = 0; i <= Math.floor(shown); i++) {
      const v = state.mesh.v[state.path[i] ?? 0];
      if (!v) continue;
      const p = project(cam, v[0], v[1], v[2]);
      if (i === 0) ctx.moveTo(p[0], p[1]);
      else ctx.lineTo(p[0], p[1]);
    }
    const a = state.mesh.v[state.path[Math.floor(shown)] ?? 0];
    const b = state.mesh.v[state.path[Math.min(hops, Math.floor(shown) + 1)] ?? 0];
    if (a && b) {
      const f = shown - Math.floor(shown);
      const p = project(cam, a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f);
      ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();
    for (const k of [0, hops]) {
      const v = state.mesh.v[state.path[k] ?? 0];
      if (!v) continue;
      const p = project(cam, v[0], v[1], v[2]);
      ctx.strokeStyle = ink.signal(0.95);
      ctx.strokeRect(p[0] - 3, p[1] - 3, 6, 6);
    }
    return pointer.active ? 'orbit' : 'rest';
  },
});
