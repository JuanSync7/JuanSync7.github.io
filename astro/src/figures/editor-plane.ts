import { defineCanvasFigure } from './define';
import { camera, project } from './kit/camera';
import { ink } from './kit/ink';
import { follow } from './kit/motion';

/** A code buffer laid on a plane that runs away to a vanishing point, scrolling toward the
 *  viewer like a crawl. Lines are bars by indent and length; the cursor line is the signal.
 *  The pointer slows the scroll and lights the line under it. */

interface Line {
  indent: number;
  len: number;
}

interface State {
  lines: Line[];
  speed: number;
  scroll: number;
}

const ROWS = 40;

export default defineCanvasFigure<State>({
  id: 'editor-plane',
  title: 'Editor plane',
  alt: 'Horizontal grey bars of code laid on a floor that recedes to a vanishing point, scrolling slowly toward the viewer; one bar is teal.',
  idea: 'A vim buffer seen as a floor: code scrolls up out of the distance and the cursor line stays lit, the way you read a file you know by its shape.',
  style: 'perspective',
  motion: 'ambient',
  answers: true,
  group: 'cover',
  seed: 318,
  aspect: 2,
  setup: ({ rng }) => {
    let indent = 0;
    const lines: Line[] = [];
    for (let i = 0; i < ROWS; i++) {
      if (rng() < 0.25) indent = Math.max(0, Math.min(3, indent + (rng() < 0.5 ? -1 : 1)));
      lines.push({ indent, len: rng() < 0.12 ? 0 : 0.15 + rng() * 0.55 });
    }
    return { lines, speed: 1, scroll: 0 };
  },
  draw: ({ ctx, w, h, dt, pointer, hover, still, state }) => {
    state.speed = still ? 1 : follow(state.speed, 1 - hover * 0.85, dt, 4);
    state.scroll += dt * 0.9 * state.speed;
    const cam = camera({ cx: w / 2, cy: h * 0.2, scale: h * 0.9, yaw: 0, pitch: 0.42, dist: 1.9 });
    const rowGap = 0.11;
    const off = state.scroll % rowGap;
    let read = 'rest';
    const hoverRow = pointer.active ? pointer.y : -1;
    for (let r = 0; r < ROWS; r++) {
      const z = 1.2 - r * rowGap + off;
      if (z < -2.9) continue;
      const lineIx = (r + Math.floor(state.scroll / rowGap)) % ROWS;
      const ln = state.lines[lineIx];
      if (!ln || ln.len === 0) continue;
      const x0 = -0.9 + ln.indent * 0.12;
      const a = project(cam, x0, -0.6, z);
      const b = project(cam, x0 + ln.len * 1.8, -0.6, z);
      if (a[1] > h + 4 || a[1] < 0) continue;
      const fade = Math.max(0, Math.min(1, (z + 2.9) / 3));
      const cursor = r === 9;
      const under = pointer.active && Math.abs(a[1] / h - hoverRow) < 0.03;
      if (under) read = `line ${lineIx + 1}`;
      const thick = Math.max(1, (b[1] - project(cam, x0, -0.6, z - rowGap * 0.45)[1]) * 0.6);
      ctx.fillStyle = cursor ? ink.signal(0.9) : under ? ink.line(0.7) : ink.line(0.08 + fade * 0.35);
      ctx.fillRect(a[0], a[1] - thick, b[0] - a[0], thick);
    }
    const v = project(cam, 0, -0.6, -40);
    ctx.strokeStyle = ink.line(0.08);
    for (const x of [-1, 1]) {
      const near = project(cam, x, -0.6, 1.3);
      ctx.beginPath();
      ctx.moveTo(near[0], near[1]);
      ctx.lineTo(v[0], v[1]);
      ctx.stroke();
    }
    return read;
  },
});
