import { defineTemplate } from '../defineTemplate';
import { project, type Camera, type ScreenPoint, type Vec3 } from '../kit/camera';
import { bodyOf, type District } from '../kit/city';
import { rotors, turning } from '../kit/citylife';
import { hubLevel } from '../kit/hub';
import { DAM_BOARD, hydro } from '../kit/hydro';
import { ink } from '../kit/ink';
import { island, size, type Island } from '../kit/islands';
import { library } from '../kit/library';
import { follow } from '../kit/motion';
import { outlines } from '../kit/outlines';
import { separate } from '../kit/separate';
import { between, mulberry32, pick } from '../kit/rng';
import { along } from '../kit/shapes';
import { MODELS, onLoop } from '../kit/traffic';

/** One board of the home page's archipelago, drawn on its own as a wireframe district in
 *  parallel projection: a housing street, a datacentre, the library by its lake, an open-pit
 *  mine, a smelting line, the car line, a press shop, the power station, the geothermal
 *  field, the dam, the exchange or the airport. Solids hide what stands behind them; teal
 *  flows along the pipes and power lines; vehicles drive the roads. The pointer turns the
 *  board. */

const BOARDS = [
  ['hub', 5, 'housing'],
  ['hub', 1, 'datacentre'],
  ['hub', 3, 'library'],
  ['mine', 2, 'open pit'],
  ['mine', 1, 'smelting line'],
  ['foundry', 1, 'car line'],
  ['foundry', 0, 'press shop'],
  ['energy', 2, 'power station'],
  ['energy', 1, 'geothermal field'],
  ['energy', 0, 'dam'],
  ['exchange', 1, 'exchange'],
  ['airport', 0, 'airport'],
] as const;
type Board = (typeof BOARDS)[number];

interface P {
  board: Board;
  salt: number;
  yaw: number;
  pitch: number;
}
interface Piece {
  segs: number[];
  /** Footprint centre, for back-to-front order; and whether it is a solid that hides. */
  at: Vec3;
  solid: boolean;
  /** The district's landmark, its tallest part: the one outlined in the signal. */
  mark: boolean;
}
interface S {
  city: District;
  pieces: Piece[];
  w: number;
  d: number;
  yaw: number;
}

/** The convex hull of projected points (monotone chain), to fill a solid's silhouette. */
function hull(pts: ScreenPoint[]): ScreenPoint[] {
  const s = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: ScreenPoint, a: ScreenPoint, b: ScreenPoint): number =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list: ScreenPoint[]): ScreenPoint[] => {
    const out: ScreenPoint[] = [];
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2] ?? p, out[out.length - 1] ?? p, p) <= 0) out.pop();
      out.push(p);
    }
    return out.slice(0, -1);
  };
  return [...half(s), ...half([...s].reverse())];
}

export default defineTemplate<P, S>({
  id: 'district',
  title: 'District',
  idea: 'One working district of the archipelago on its own board, drawn in wireframe: housing, a datacentre, a mine, a smelting line, a car line, a power station, geothermal wells, a dam, an exchange or an airport, with its pipes and roads alive.',
  style: 'wireframe',
  motion: 'ambient',
  answers: true,
  aspect: 2,
  grammar: (rng) => ({
    board: pick(rng, BOARDS),
    salt: Math.floor(rng() * 1e6),
    yaw: between(rng, 0.45, 1.1) * (rng() > 0.5 ? 1 : -1),
    pitch: between(rng, 0.5, 0.72),
  }),
  name: (p) => p.board[2],
  alt: (p) =>
    `A wireframe ${p.board[2]} on a thin board, seen from above at an angle, its buildings outlined in grey with teal flowing along its pipes and lines, and small vehicles moving on its roads.`,
  setup: ({ params }) => {
    const [kind, k] = params.board;
    const rng = mulberry32(params.salt);
    // The library and the dam have boards of their own, richer than their levels in the stack.
    const name = params.board[2];
    const city =
      name === 'library'
        ? library(rng)
        : name === 'dam'
          ? hydro(rng)
          : kind === 'hub'
            ? hubLevel(k, rng)
            : island(kind as Island, k, rng);
    const [w, d] = name === 'dam' ? DAM_BOARD : kind === 'hub' ? [2.5, 1.5] : size(kind as Island, k);
    // Nothing stands in anything else unless it is meant to.
    const parts = separate(city.parts, w, d, city.landmark);
    const mark = city.landmark
      ? parts.find((p) => p.x === city.landmark?.x && p.kind === city.landmark?.kind)
      : undefined;
    const top = Math.max(...parts.map((p) => (p.y ?? 0) + p.h));
    const pieces = parts.map((p) => ({
      mark: mark ? p === mark : (p.y ?? 0) + p.h === top,
      segs: outlines([p]),
      at: [p.x, p.y ?? 0, p.z] as Vec3,
      solid: bodyOf(p.kind) !== null,
    }));
    return { city: { ...city, parts }, pieces, w, d, yaw: params.yaw };
  },
  draw: ({ ctx, w, h, t, dt, pointer, hover, still, params, state }) => {
    const target = params.yaw + (pointer.active ? (pointer.x - 0.5) * 1.2 * hover : Math.sin(t * 0.15) * 0.12);
    state.yaw = still ? target : follow(state.yaw, target, dt, 3);
    const scale = Math.min(w / (state.w * 1.02), h / (state.d * 1.25));
    const cam: Camera = { yaw: state.yaw, pitch: params.pitch, dist: Infinity, scale, cx: w / 2, cy: h * 0.55 };
    const P = (x: number, y: number, z: number): ScreenPoint => project(cam, x, y, z);
    const stroke = (segs: readonly number[], style: string): void => {
      ctx.strokeStyle = style;
      ctx.beginPath();
      for (let i = 0; i < segs.length; i += 6) {
        const a = P(segs[i] ?? 0, segs[i + 1] ?? 0, segs[i + 2] ?? 0);
        const b = P(segs[i + 3] ?? 0, segs[i + 4] ?? 0, segs[i + 5] ?? 0);
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
      }
      ctx.stroke();
    };
    // The board: a plate, its traces painted on it.
    const [hw, hd] = [state.w / 2, state.d / 2];
    const corners = [P(-hw, 0, -hd), P(hw, 0, -hd), P(hw, 0, hd), P(-hw, 0, hd)];
    ctx.fillStyle = ink.panel(0.6);
    ctx.beginPath();
    corners.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ink.line(0.35);
    ctx.stroke();
    stroke(
      state.city.traces.flatMap(([a, b, c, d]) => [a, 0, b, c, 0, d]),
      ink.line(0.14),
    );
    // Parts back to front; a solid's silhouette is filled first, so it hides what is behind.
    const order = state.pieces
      .map((p) => ({ p, depth: P(p.at[0], p.at[1], p.at[2])[2] }))
      .sort((a, b) => a.depth - b.depth);
    for (const { p } of order) {
      if (p.solid) {
        const pts: ScreenPoint[] = [];
        for (let i = 0; i < p.segs.length; i += 3) pts.push(P(p.segs[i] ?? 0, p.segs[i + 1] ?? 0, p.segs[i + 2] ?? 0));
        ctx.fillStyle = ink.ground();
        ctx.beginPath();
        hull(pts).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.fill();
      }
      stroke(p.segs, p.mark ? ink.signal(0.9) : ink.line(0.7));
    }
    stroke(rotors(state.city.parts, t), ink.line(0.55));
    stroke(turning(state.city.parts, t, state.yaw), ink.line(0.7));
    // Teal flow: the pipes and lines, a pulse running along each.
    const pipes = state.city.pipes ?? [];
    stroke(
      pipes.flatMap((q) => q.slice(1).flatMap((b, i) => [...(q[i] ?? b), ...b])),
      ink.signal(0.55),
    );
    ctx.fillStyle = ink.signal(0.95);
    pipes.forEach((q, i) => {
      const [x, y] = P(...along(q, (t * 0.3 + i * 0.37) % 1));
      ctx.fillRect(Math.round(x) - 1.5, Math.round(y) - 1.5, 3, 3);
    });
    // Vehicles on the roads, in the same wire as the buildings.
    for (const loop of state.city.roads ?? [])
      for (let n = 0; n < 2; n++) {
        const [at, heading] = onLoop(loop, (t * 0.05 + n / 2) % 1);
        const m = MODELS[params.board[0] === 'mine' ? 'hauler' : 'car'];
        const [c, s] = [Math.cos(heading), Math.sin(heading)];
        const k = 0.07;
        const segs = m.map((v, i) =>
          i % 3 === 0
            ? at[0] + (v * c - (m[i + 2] ?? 0) * s) * k
            : i % 3 === 1
              ? at[1] + v * k
              : at[2] + ((m[i - 2] ?? 0) * s + v * c) * k,
        );
        stroke(segs, ink.soft(0.85));
      }
    return pointer.active ? params.board[2] : 'rest';
  },
});
