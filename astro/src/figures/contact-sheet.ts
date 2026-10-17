import { defineCanvasFigure } from './define';
import { camera, project, type Camera } from './kit/camera';
import { ink } from './kit/ink';
import { follow } from './kit/motion';

/** The audit's contact sheet as a carousel of hairline frames, each holding a small drawing
 *  in a different style, turning past the viewer. The frame in front is the one being read,
 *  bordered in the signal. The pointer turns the carousel to a frame; the read-out names the
 *  shot it stands for. */

/** A motif draws polylines in the frame's own coordinates: u across in [-1, 1], v up in
 *  [-0.5, 0.5]. The frame maps them into the carousel. */
type Pen = (pts: readonly (readonly [number, number])[]) => void;
type Motif = (pen: Pen) => void;

const SHOTS = ['rest', 'later', 'answer', 'phone', 'reduced'] as const;

const range = (n: number, f: (i: number) => [number, number]): [number, number][] => Array.from({ length: n }, (_, i) => f(i));

const MOTIFS: Motif[] = [
  (pen) => {
    for (let r = 0; r < 4; r++) pen(range(35, (i) => { const u = -0.85 + i * 0.05; return [u, -0.3 + r * 0.17 + Math.sin(u * 5 + r) * 0.05 * (1 - Math.abs(u))]; }));
  },
  (pen) => {
    for (let i = -6; i <= 6; i++) for (let j = -2; j <= 2; j++) pen([[i * 0.13, j * 0.15], [i * 0.13 + 0.012, j * 0.15]]);
  },
  (pen) => {
    pen(range(9, (i) => [-0.8 + i * 0.2, i % 2 === 0 ? -0.3 : 0.25]));
    pen([[-0.8, -0.3], [0.8, -0.3]]);
  },
  (pen) => pen([[-0.85, -0.35], [-0.45, 0.1], [-0.2, -0.1], [0.15, 0.32], [0.5, -0.05], [0.85, -0.35]]),
  (pen) => pen(range(12, (i) => [-0.8 + Math.floor((i + 1) / 2) * 0.3, 0.3 - Math.floor(i / 2) * 0.12])),
];

interface State {
  turn: number;
}

const STEP = (Math.PI * 2) / SHOTS.length;

function frame(ctx: CanvasRenderingContext2D, cam: Camera, a: number, k: number, front: boolean): void {
  const cx = Math.sin(a) * 1.1;
  const cz = Math.cos(a) * 1.1;
  const ux = Math.cos(a);
  const uz = -Math.sin(a);
  const pt = (u: number, v: number): [number, number] => {
    const p = project(cam, cx + ux * u * 0.5, v * 0.5, cz + uz * u * 0.5);
    return [p[0], p[1]];
  };
  const corners = [pt(-1, -0.5), pt(1, -0.5), pt(1, 0.5), pt(-1, 0.5)];
  ctx.beginPath();
  corners.forEach((c, i) => (i === 0 ? ctx.moveTo(c[0], c[1]) : ctx.lineTo(c[0], c[1])));
  ctx.closePath();
  ctx.fillStyle = ink.ground();
  ctx.fill();
  ctx.strokeStyle = front ? ink.signal(0.95) : ink.line(0.4);
  ctx.stroke();
  ctx.strokeStyle = ink.line(front ? 0.6 : 0.28);
  MOTIFS[k]?.((pts) => {
    ctx.beginPath();
    pts.forEach(([u, v], i) => {
      const p = pt(u, v);
      if (i === 0) ctx.moveTo(p[0], p[1]);
      else ctx.lineTo(p[0], p[1]);
    });
    ctx.stroke();
  });
}

export default defineCanvasFigure<State>({
  id: 'contact-sheet',
  title: 'Contact sheet',
  alt: 'Five thin-outlined rectangular frames standing in a ring and slowly turning, each holding a small line drawing: waves, a dot grid, a zigzag, peaks, a staircase; the front frame is outlined in teal.',
  idea: 'How a figure is checked: every drawing is captured as a set of stills and read like a contact sheet, one frame at a time.',
  style: 'hairline',
  motion: 'ambient',
  answers: true,
  group: 'cover',
  seed: 1017,
  aspect: 2,
  setup: () => ({ turn: 0 }),
  draw: ({ ctx, w, h, t, dt, pointer, hover, still, state }) => {
    const pick = pointer.active && hover > 0.3 ? Math.min(SHOTS.length - 1, Math.floor(pointer.x * SHOTS.length)) : -1;
    const target = pick >= 0 ? -pick * STEP : t * 0.3;
    // Turn the short way round to the picked frame.
    const delta = Math.atan2(Math.sin(target - state.turn), Math.cos(target - state.turn));
    state.turn = still || pick < 0 ? target : follow(state.turn, state.turn + delta, dt, 5);
    const cam = camera({ cx: w / 2, cy: h * 0.5, scale: Math.min(w * 0.27, h * 0.52), yaw: 0, pitch: 0.28, dist: 4 });
    const order = SHOTS.map((_, k) => ({ k, a: state.turn + k * STEP })).sort((p, q) => Math.cos(p.a) - Math.cos(q.a));
    const frontK = order[order.length - 1]?.k ?? 0;
    for (const { k, a } of order) frame(ctx, cam, a, k, k === frontK);
    return pick >= 0 ? SHOTS[frontK] ?? 'rest' : 'rest';
  },
});
