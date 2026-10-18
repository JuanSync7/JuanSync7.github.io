import { defineTemplate } from '../defineTemplate';
import { camera, project, type Camera, type Vec3 } from '../kit/camera';
import { box, line } from '../kit/draw';
import { graph, trace, walk, type Edge, type Station } from '../kit/flows';
import { ink, mix } from '../kit/ink';
import { smoothstep } from '../kit/motion';
import { between } from '../kit/rng';
import { along, tracePath } from '../kit/shapes';

/** A workflow as a seeded graph of isometric stations joined by floor traces: how many
 *  stations, where they stand, which are joined (one join mostly, now and then up to five),
 *  what each station is and how tall, all drawn from the seed. One job walks the graph in
 *  the signal, resting at each station while it works and lighting it; the rest of the work
 *  moves faintly along the traces at its own pace and in its own direction. The pointer
 *  picks a station and lights its traces. */

interface P {
  stations: Station[];
  edges: Edge[];
  route: number[];
  yaw: number;
  pitch: number;
  pace: number;
}

type S = Record<string, never>;

/** What sits on a station: a mark on its top, a second storey, pins, a roof. */
function glyph(ctx: CanvasRenderingContext2D, cam: Camera, s: Station, top: number, lit: boolean): void {
  const style = lit ? ink.signal(0.6) : ink.line(0.24);
  const p = (x: number, y: number, z: number): ReturnType<typeof project> => project(cam, s.x + x, y, s.z + z);
  const k = s.r * 0.7;
  const face = {
    top: mix('panel', 'panel2', 0.9),
    left: mix('ground', 'panel', 0.9),
    right: mix('ground', 'panel', 0.5),
  };
  const edge = { edge: lit ? ink.signal(0.8) : ink.line(0.4), crease: ink.line(0.12) };
  if (s.glyph === 'grid' || s.glyph === 'bars')
    for (let i = -1; i <= 1; i++) {
      line(ctx, p(-k, top, (i * k) / 1.5), p(k, top, (i * k) / 1.5), style);
      if (s.glyph === 'grid') line(ctx, p((i * k) / 1.5, top, -k), p((i * k) / 1.5, top, k), style);
    }
  else if (s.glyph === 'ring' || s.glyph === 'dish') {
    ctx.strokeStyle = style;
    const ring = (y: number, rad: number): Vec3[] =>
      Array.from(
        { length: 25 },
        (_, i): Vec3 => [s.x + Math.cos((i / 24) * Math.PI * 2) * rad, y, s.z + Math.sin((i / 24) * Math.PI * 2) * rad],
      );
    tracePath(ctx, cam, ring(top, k));
    ctx.stroke();
    if (s.glyph === 'dish') {
      line(ctx, p(0, top, 0), p(0, top + 0.18, 0), style);
      tracePath(ctx, cam, ring(top + 0.18, k * 0.45));
      ctx.stroke();
    }
  } else if (s.glyph === 'stack' || s.glyph === 'tower') {
    const [f, h] = s.glyph === 'stack' ? [0.6, 0.08] : [0.42, 0.3];
    box(ctx, cam, s.x - s.r * f, s.z - s.r * f, s.x + s.r * f, s.z + s.r * f, top, top + h, { ...face, ...edge });
  } else if (s.glyph === 'chip')
    for (let i = -2; i <= 2; i++) {
      const u = (i / 2.5) * s.r;
      line(ctx, p(s.r, top * 0.5, u), p(s.r + 0.06, top * 0.5, u), style);
      line(ctx, p(u, top * 0.5, s.r), p(u, top * 0.5, s.r + 0.06), style);
    }
  else if (s.glyph === 'server')
    for (let y = 0.05; y < top - 0.02; y += 0.05) line(ctx, p(s.r, y, -k), p(s.r, y, k), style);
  else if (s.glyph === 'gable') {
    const ridge = top + s.r * 0.6;
    for (const x of [-s.r, s.r]) {
      line(ctx, p(x, top, -s.r), p(x, ridge, 0), style);
      line(ctx, p(x, ridge, 0), p(x, top, s.r), style);
    }
    line(ctx, p(-s.r, ridge, 0), p(s.r, ridge, 0), style);
  }
}

export default defineTemplate<P, S>({
  id: 'workflow',
  title: 'Workflow',
  idea: 'A project workflow as a seeded graph of isometric stations joined by traces, different in size, shape and wiring every seed, with one job walking the graph and resting where it is worked on.',
  style: 'trace',
  motion: 'ambient',
  answers: true,
  aspect: 2,
  grammar: (rng) => {
    const { stations, edges } = graph(rng, 5 + Math.floor(rng() * 7));
    return {
      stations,
      edges,
      route: walk(edges, 48, rng),
      yaw: between(rng, 0.3, 0.6),
      pitch: between(rng, 0.5, 0.72),
      pace: between(rng, 0.35, 0.9),
    };
  },
  name: (p) => `${p.stations.length} stations, ${p.edges.length} joins`,
  alt: (p) =>
    `${p.stations.length} grey isometric stations of different shapes and heights, joined by ${p.edges.length} thin floor traces with faint work moving along them, and one teal job travelling from station to station.`,
  setup: () => ({}),
  draw: ({ ctx, w, h, t, pointer, hover, params }) => {
    const cam = camera({
      cx: w / 2,
      cy: h * 0.5,
      scale: Math.min(w * 0.17, h * 0.36),
      yaw: params.yaw + Math.sin(t * 0.25) * 0.07,
      pitch: params.pitch,
      dist: Infinity,
    });
    const st = params.stations;
    // The job: one leg of its walk per beat; it rests at the station, then moves along.
    const legs = params.route.length - 1;
    const u = t * params.pace;
    const leg = Math.floor(u) % legs;
    const move = smoothstep(0.35, 1, u % 1);
    const [from, to] = [params.route[leg] ?? 0, params.route[leg + 1] ?? 0];
    // A station is always lit: the one the job is leaving until it reaches the next, so a
    // still where the job hides behind a tall station still says where the work is.
    const busy = move > 0.88 ? to : from;
    const path = (a: number, b: number): Vec3[] => {
      const e = params.edges.find((d) => (d.a === a && d.b === b) || (d.a === b && d.b === a));
      const [sa, sb] = [st[a], st[b]];
      if (!e || !sa || !sb) return [];
      return e.a === a ? trace(sa, sb, e.xFirst) : trace(sb, sa, e.xFirst).reverse();
    };
    let picked = -1;
    if (pointer.active && hover > 0.3) {
      let best = Infinity;
      st.forEach((s, i) => {
        const q = project(cam, s.x, s.h / 2, s.z);
        const d = Math.hypot(q[0] - pointer.x * w, q[1] - pointer.y * h);
        if (d < best) [best, picked] = [d, i];
      });
    }
    for (const e of params.edges) {
      const pts = path(e.a, e.b);
      if (!pts.length) continue;
      ctx.strokeStyle = e.a === picked || e.b === picked ? ink.signal(0.7) : ink.line(0.3);
      tracePath(ctx, cam, pts);
      ctx.stroke();
      // Background work: its own number of packets, pace and direction on every trace.
      for (let k = 0; k < e.packets; k++) {
        const q = along(pts, (((t * e.speed + k / e.packets) % 1) + 1) % 1);
        const s = project(cam, q[0], 0, q[2]);
        ctx.fillStyle = ink.line(0.45);
        ctx.fillRect(s[0] - 1.5, s[1] - 1.5, 3, 3);
      }
    }
    // The job is drawn under the stations, so it disappears into one as it arrives; the leg
    // in hand is lit up to it, so its progress reads even in a still.
    const pts = path(from, to);
    if (pts.length && move > 0) {
      ctx.strokeStyle = ink.signal(0.8);
      tracePath(
        ctx,
        cam,
        Array.from({ length: 25 }, (_, k) => along(pts, (k / 24) * move)),
      );
      ctx.stroke();
      const s = project(cam, ...along(pts, move));
      ctx.fillStyle = ink.signal(0.95);
      ctx.fillRect(s[0] - 3, s[1] - 3, 6, 6);
    }
    const order = st.map((s, i) => ({ s, i, d: project(cam, s.x, 0, s.z)[2] })).sort((m, n) => m.d - n.d);
    for (const { s, i } of order) {
      const lit = i === busy || i === picked;
      // The picked station rises off the floor, like a key pressed the wrong way.
      const lift = i === picked ? 0.12 * hover : 0;
      box(ctx, cam, s.x - s.r, s.z - s.r, s.x + s.r, s.z + s.r, lift, s.h + lift, {
        top: lit ? mix('panelSignal', 'signalLine', 0.5) : mix('panel', 'panel2', 0.8),
        left: mix('ground', 'panel', 0.9),
        right: mix('ground', 'panel', 0.5),
        edge: lit ? ink.signal(0.95) : ink.line(0.5),
        crease: lit ? ink.signal(0.4) : ink.line(0.15),
      });
      glyph(ctx, cam, s, s.h + lift, lit);
    }
    return picked >= 0 ? `stage ${picked + 1}` : 'rest';
  },
});
