import { defineTemplate } from '../defineTemplate';
import { camera, project } from '../kit/camera';
import { ink } from '../kit/ink';
import { follow } from '../kit/motion';
import { noise2, type Noise2 } from '../kit/noise';
import { between, pick } from '../kit/rng';

/** A noise field drawn as lines and seen from one of several angles: ridges stacked face
 *  on, a plane seen from above, rings round a centre, lines wrapped round a turning
 *  cylinder, ridges running on the diagonal. The field rolls slowly; one line is the
 *  signal. The pointer raises the field where it is. */

const VIEWS = ['front', 'above', 'polar', 'cylinder', 'diagonal'] as const;
type View = (typeof VIEWS)[number];

interface P {
  view: View;
  lines: number;
  amp: number;
  freq: number;
  speed: number;
}

interface S {
  noise: Noise2;
  lift: number;
}

type Pt3 = [number, number, number];

/** Line k of the field at time t, as 3D points: u runs along the line, v across lines. */
function fieldLine(p: P, s: S, k: number, t: number, bump: (x: number, z: number) => number): Pt3[] {
  const v = k / (p.lines - 1);
  const pts: Pt3[] = [];
  const steps = 70;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const env = Math.sin(u * Math.PI) ** 1.5;
    const height = (x: number, z: number): number => (s.noise(x * p.freq + t * p.speed, z * p.freq) * 0.7 + s.noise(x * p.freq * 3, z * p.freq * 3 - t * p.speed) * 0.3) * p.amp * (1 + bump(x, z));
    if (p.view === 'polar') {
      const a = u * Math.PI * 2;
      const r = 0.15 + v * 0.95;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      pts.push([x, Math.max(0, height(x, z)) * (1 - v * 0.3), z]);
    } else if (p.view === 'cylinder') {
      const a = u * Math.PI * 2 + t * 0.25;
      const y = -0.8 + v * 1.6;
      const r = 0.55 + height(Math.cos(a) * 1.5, y * 1.5) * 0.9;
      pts.push([Math.cos(a) * r, y, Math.sin(a) * r]);
    } else {
      const x = -1.3 + u * 2.6;
      const z = -1 + v * 2;
      // Seen from above, height reads only if it is large: lift the plane harder there.
      pts.push([x, height(x, z) * env * (p.view === 'above' ? 2.2 : 1), z]);
    }
  }
  return pts;
}

export default defineTemplate<P, S>({
  id: 'ridge-field',
  title: 'Ridge field',
  idea: 'A rolling noise field drawn as lines, seen face on, from above, as rings, wrapped on a cylinder or on the diagonal: the same signal read from different angles.',
  style: 'field',
  motion: 'ambient',
  answers: true,
  bleed: true,
  aspect: 2,
  grammar: (rng) => {
    const view = pick(rng, VIEWS);
    return { view, lines: view === 'polar' ? 14 + Math.floor(rng() * 8) : 16 + Math.floor(rng() * 14), amp: between(rng, 0.18, 0.34), freq: between(rng, 0.9, 2.2), speed: between(rng, 0.12, 0.3) };
  },
  name: (p) => `${p.view} ridges`,
  alt: (p) => `Grey lines displaced by a rolling noise field, seen ${p.view === 'polar' ? 'as rings round a centre' : p.view === 'cylinder' ? 'wrapped round a turning cylinder' : p.view === 'above' ? 'from above' : `from the ${p.view}`}, one line teal.`,
  setup: ({ rng }) => ({ noise: noise2(rng), lift: 0 }),
  draw: ({ ctx, w, h, t, dt, pointer, hover, still, params, state }) => {
    const target = pointer.active ? hover : 0;
    state.lift = still ? target : follow(state.lift, target, dt, 4);
    const px = (pointer.x - 0.5) * 2.6;
    const bump = (x: number): number => state.lift * 1.6 * Math.exp(-((x - px) ** 2) * 3);
    const view = params.view;
    const cam = camera({
      cx: w / 2,
      cy: h * (view === 'above' || view === 'polar' ? 0.52 : view === 'cylinder' ? 0.5 : 0.6),
      scale: Math.min(w * 0.36, h * 0.72) * (view === 'cylinder' ? 0.78 : 1),
      yaw: view === 'diagonal' ? 0.78 : view === 'cylinder' ? 0 : 0,
      pitch: view === 'above' ? 0.8 : view === 'polar' ? 0.7 : view === 'cylinder' ? 0.3 : 0.32,
      dist: 4,
    });
    const lit = Math.floor(t * 1.5) % params.lines;
    // Face-on ridges hide the ones behind them: draw far to near, each filled with ground.
    const occlude = view === 'front' || view === 'diagonal';
    const order = Array.from({ length: params.lines }, (_, k) => k);
    for (const k of order) {
      const pts = fieldLine(params, state, k, t, bump).map((q) => project(cam, q[0], q[1], q[2]));
      const first = pts[0];
      const last = pts[pts.length - 1];
      if (!first || !last) continue;
      const near = view === 'cylinder' ? 0.6 : 0.35 + 0.65 * (k / (params.lines - 1));
      if (occlude) {
        ctx.beginPath();
        pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
        ctx.lineTo(last[0], h);
        ctx.lineTo(first[0], h);
        ctx.closePath();
        ctx.fillStyle = ink.ground();
        ctx.fill();
      }
      ctx.strokeStyle = k === lit ? ink.signal(0.9) : ink.line(0.12 + near * 0.5);
      ctx.beginPath();
      pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
      ctx.stroke();
    }
    return pointer.active ? `${view} · lift` : 'rest';
  },
});
