import { defineTemplate } from '../defineTemplate';
import { camera, project, type Camera, type Vec3 } from '../kit/camera';
import { box, line } from '../kit/draw';
import { ink, mix } from '../kit/ink';
import { smoothstep } from '../kit/motion';
import { between, pick, type Rng } from '../kit/rng';
import { along, tracePath } from '../kit/shapes';

/** A project workflow as isometric stations joined by floor traces: a straight flow, a
 *  loop with a way back, a fan-out that joins again, a line that snakes over two rows. One
 *  job travels the route in the signal, resting at each station while it works; other
 *  work moves faintly on every trace. The pointer picks a station and lights its traces. */

const SHAPES = ['flow', 'loop', 'branch', 'zigzag'] as const;
type Shape = (typeof SHAPES)[number];
const GLYPHS = ['grid', 'bars', 'ring', 'stack', 'plain'] as const;
type Glyph = (typeof GLYPHS)[number];

interface Station {
  x: number;
  z: number;
  h: number;
  glyph: Glyph;
}

interface P {
  shape: Shape;
  stations: Station[];
  edges: [number, number][];
  yaw: number;
  pitch: number;
  pace: number;
}

type S = Record<string, never>;

const HALF = 0.2;

function layout(shape: Shape, rng: Rng): { at: [number, number][]; edges: [number, number][] } {
  if (shape === 'flow') {
    const n = 5 + Math.floor(rng() * 2);
    return { at: Array.from({ length: n }, (_, i) => [i - (n - 1) / 2, (rng() - 0.5) * 0.7]), edges: Array.from({ length: n - 1 }, (_, i) => [i, i + 1]) };
  }
  if (shape === 'loop') {
    const n = 5;
    return { at: Array.from({ length: n }, (_, i) => [Math.cos((i / n) * Math.PI * 2 + Math.PI) * 1.8, Math.sin((i / n) * Math.PI * 2 + Math.PI) * 0.95]), edges: Array.from({ length: n }, (_, i) => [i, (i + 1) % n]) };
  }
  if (shape === 'branch') {
    return { at: [[-2.2, 0], [-1.1, 0], [0, -1], [0, 0], [0, 1], [1.1, 0], [2.2, 0]], edges: [[0, 1], [1, 2], [1, 3], [1, 4], [2, 5], [3, 5], [4, 5], [5, 6]] };
  }
  const at: [number, number][] = [];
  for (let i = 0; i < 8; i++) at.push([(i < 4 ? i : 7 - i) * 1.05 - 1.575, i < 4 ? -0.6 : 0.6]);
  return { at, edges: Array.from({ length: 7 }, (_, i) => [i, i + 1]) };
}

/** The route the job takes through cycle c: every station in order, choosing one arm of a fan. */
function route(p: P, c: number): number[] {
  if (p.shape === 'branch') return [0, 1, 2 + (c % 3), 5, 6];
  if (p.shape === 'loop') return [...p.stations.map((_, i) => i), 0];
  return p.stations.map((_, i) => i);
}

/** A trace runs along x, then along z, on the floor between two stations' bases. */
function trace(a: Station, b: Station): Vec3[] {
  return [[a.x, 0, a.z], [b.x, 0, a.z], [b.x, 0, b.z]];
}

function glyph(ctx: CanvasRenderingContext2D, cam: Camera, s: Station, lit: boolean): void {
  const y = s.h;
  const style = lit ? ink.signal(0.6) : ink.line(0.22);
  const p = (x: number, z: number): ReturnType<typeof project> => project(cam, s.x + x, y, s.z + z);
  const k = HALF * 0.7;
  if (s.glyph === 'grid' || s.glyph === 'bars') {
    for (let i = -1; i <= 1; i++) {
      line(ctx, p(-k, (i * k) / 1.5), p(k, (i * k) / 1.5), style);
      if (s.glyph === 'grid') line(ctx, p((i * k) / 1.5, -k), p((i * k) / 1.5, k), style);
    }
  } else if (s.glyph === 'ring') {
    ctx.strokeStyle = style;
    tracePath(ctx, cam, Array.from({ length: 25 }, (_, i): Vec3 => [s.x + Math.cos((i / 24) * Math.PI * 2) * k, y, s.z + Math.sin((i / 24) * Math.PI * 2) * k]));
    ctx.stroke();
  }
}

export default defineTemplate<P, S>({
  id: 'workflow',
  title: 'Workflow',
  idea: 'A project workflow as isometric stations joined by traces (a flow, a loop, a fan-out, a snake), with one job travelling the route and resting where it is worked on.',
  style: 'trace',
  motion: 'ambient',
  answers: true,
  aspect: 2,
  grammar: (rng) => {
    const shape = pick(rng, SHAPES);
    const { at, edges } = layout(shape, rng);
    const stations = at.map(([x, z]) => ({ x, z, h: between(rng, 0.1, 0.42), glyph: pick(rng, GLYPHS) }));
    return { shape, stations, edges, yaw: between(rng, 0.3, 0.6), pitch: between(rng, 0.5, 0.7), pace: between(rng, 0.45, 0.7) };
  },
  name: (p) => `${p.shape} of ${p.stations.length}`,
  alt: (p) => `Grey isometric stations joined by thin floor traces in a ${p.shape === 'branch' ? 'fan-out that joins again' : p.shape === 'zigzag' ? 'line snaking over two rows' : p.shape === 'loop' ? 'loop with a way back to the start' : 'straight flow'}, a teal job moving from station to station.`,
  setup: () => ({}),
  draw: ({ ctx, w, h, t, pointer, hover, params }) => {
    const cam = camera({ cx: w / 2, cy: h * 0.5, scale: Math.min(w * 0.18, h * 0.4), yaw: params.yaw + Math.sin(t * 0.25) * 0.07, pitch: params.pitch, dist: Infinity });
    const st = params.stations;
    // The job: one route per cycle; on each leg it rests at the station, then moves along the trace.
    const legs = route(params, 0).length - 1;
    const u = t * params.pace;
    const cycle = Math.floor(u / legs);
    const r = route(params, cycle);
    const leg = Math.floor(u) % legs;
    const move = smoothstep(0.35, 1, u % 1);
    const from = r[leg] ?? 0;
    const to = r[leg + 1] ?? 0;
    // A station is lit while the job rests in it and just as it leaves or arrives.
    const busy = move < 0.12 ? from : move > 0.88 ? to : -1;
    // Legs already travelled this cycle stay faintly lit: the route so far.
    const done = new Set(r.slice(0, leg).map((n, i) => `${n}>${r[i + 1] ?? -1}`));
    let picked = -1;
    if (pointer.active && hover > 0.3) {
      let best = Infinity;
      st.forEach((s, i) => {
        const q = project(cam, s.x, s.h / 2, s.z);
        const d = Math.hypot(q[0] - pointer.x * w, q[1] - pointer.y * h);
        if (d < best) {
          best = d;
          picked = i;
        }
      });
    }
    for (const [a, b] of params.edges) {
      const sa = st[a];
      const sb = st[b];
      if (!sa || !sb) continue;
      const pts = trace(sa, sb);
      const touched = a === picked || b === picked;
      ctx.strokeStyle = touched ? ink.signal(0.7) : done.has(`${a}>${b}`) ? ink.signal(0.35) : ink.line(0.32);
      // Traces are dashed and the dashes march toward the next station: work in flight.
      ctx.setLineDash([5, 4]);
      ctx.lineDashOffset = -t * 14;
      tracePath(ctx, cam, pts);
      ctx.stroke();
      ctx.setLineDash([]);
      // Background work: two faint packets on every trace, half a trace apart.
      for (let k = 0; k < 2; k++) {
        const q = along(pts, (t * 0.18 + k / 2 + a * 0.13) % 1);
        const s = project(cam, q[0], 0, q[2]);
        ctx.fillStyle = ink.line(0.45);
        ctx.fillRect(s[0] - 1.5, s[1] - 1.5, 3, 3);
      }
    }
    // The job is drawn under the stations, so it disappears into one as it arrives.
    const sa = st[from];
    const sb = st[to];
    if (sa && sb && move > 0) {
      // The leg in hand is lit up to the job, so its progress reads even in a still.
      const pts = trace(sa, sb);
      ctx.strokeStyle = ink.signal(0.8);
      tracePath(ctx, cam, Array.from({ length: 25 }, (_, k) => along(pts, (k / 24) * move)));
      ctx.stroke();
      const q = along(pts, move);
      const s = project(cam, q[0], 0, q[2]);
      ctx.fillStyle = ink.signal(0.95);
      ctx.fillRect(s[0] - 3, s[1] - 3, 6, 6);
    }
    const order = st.map((s, i) => ({ s, i, d: project(cam, s.x, 0, s.z)[2] })).sort((m, n) => m.d - n.d);
    for (const { s, i } of order) {
      const lit = i === busy || i === picked;
      // The picked station rises off the floor, like a key pressed the wrong way.
      const lift = i === picked ? 0.12 * hover : 0;
      const top = { ...s, h: s.h + lift };
      box(ctx, cam, s.x - HALF, s.z - HALF, s.x + HALF, s.z + HALF, lift, top.h, {
        top: lit ? mix('panelSignal', 'signalLine', 0.5) : mix('panel', 'panel2', 0.8),
        left: mix('ground', 'panel', 0.9),
        right: mix('ground', 'panel', 0.5),
        edge: lit ? ink.signal(0.95) : ink.line(0.5),
        crease: lit ? ink.signal(0.4) : ink.line(0.15),
      });
      if (s.glyph === 'stack') box(ctx, cam, s.x - HALF * 0.6, s.z - HALF * 0.6, s.x + HALF * 0.6, s.z + HALF * 0.6, top.h, top.h + 0.08, { top: mix('panel', 'panel2', 0.9), left: mix('ground', 'panel', 0.9), right: mix('ground', 'panel', 0.5), edge: lit ? ink.signal(0.8) : ink.line(0.4), crease: ink.line(0.12) });
      else glyph(ctx, cam, top, lit);
    }
    return picked >= 0 ? `stage ${picked + 1}` : 'rest';
  },
});
