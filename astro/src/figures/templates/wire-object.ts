import { defineTemplate } from '../defineTemplate';
import { camera, type Vec3 } from '../kit/camera';
import { follow } from '../kit/motion';
import { between, pick } from '../kit/rng';
import { box, circle, cylinder, extrude, globe, path, place, strokeWire, type Seg } from '../kit/shapes';

/** Everyday objects as wireframes on a slow turntable, each with the one part that moves
 *  in its own way lit in the signal: a car's wheel turning, a planet's moon in orbit, a
 *  house's lit window, a rocket's flame, a turbine's blade, a satellite's dish. */

const KINDS = ['car', 'planet', 'house', 'rocket', 'turbine', 'satellite'] as const;
type Kind = (typeof KINDS)[number];

interface P {
  kind: Kind;
  yaw0: number;
  pitch: number;
  turn: number;
  /** Proportions: length, storeys, ring tilt, fins or blades; read per kind. */
  a: number;
  b: number;
}

interface S {
  yaw: number;
}

const TAU = Math.PI * 2;

/** Per kind: scale to fit the frame, the lift that centres it, and the height of its ground
 *  ring (null for things that float). Tall objects shrink so nothing leaves the frame. */
const FRAME: Record<Kind, readonly [number, number, number | null]> = {
  car: [1.05, -0.45, -0.04],
  planet: [0.78, 0, null],
  house: [0.95, -0.1, -0.5],
  rocket: [0.58, 0.05, null],
  turbine: [0.52, -0.27, -0.95],
  satellite: [0.92, -0.2, null],
};

/** The object at time t: its body, and the one part that carries the signal. */
function build(p: P, t: number): { body: Seg[]; hot: Seg[] } {
  switch (p.kind) {
    case 'car': {
      const L = 0.85 + p.a * 0.25;
      const body = extrude([[-L, 0.15], [L, 0.15], [L, 0.45], [L * 0.6, 0.5], [L * 0.32, 0.82], [-L * 0.4, 0.82], [-L * 0.68, 0.5], [-L, 0.45]], -0.42, 0.42);
      const wheel = (x: number, z: number): Seg[] => {
        const c: Vec3 = [x, 0.15, z];
        const spin = -t * 4;
        return [...circle(c, 0.19, 'z', 16), ...[0, 1, 2].map((k): Seg => {
          const a = spin + (k * TAU) / 3;
          return [c, [x + Math.cos(a) * 0.19, 0.15 + Math.sin(a) * 0.19, z]];
        })];
      };
      return { body: [...body, ...wheel(-L * 0.6, 0.44), ...wheel(L * 0.6, -0.44), ...wheel(-L * 0.6, -0.44)], hot: wheel(L * 0.6, 0.44) };
    }
    case 'planet': {
      const r = 0.62;
      const ring = place([...circle([0, 0, 0], 0.9, 'y', 48), ...circle([0, 0, 0], 1.08, 'y', 48)], { roll: 0.25 + p.a * 0.35 });
      const m = t * 0.6;
      const moon = place(globe([Math.cos(m) * 1.35, 0, Math.sin(m) * 1.35], 0.1, 3, 4), { roll: 0.25 + p.a * 0.35 });
      return { body: [...globe([0, 0, 0], r, 7, 12), ...ring], hot: moon };
    }
    case 'house': {
      const H = 0.55 + Math.round(p.b * 2) * 0.32;
      const walls = box(-0.7, -0.5, -0.5, 0.7, H - 0.5, 0.5);
      const top = H - 0.5;
      const roof = [...path([[-0.78, top, -0.56], [0, top + 0.45, -0.56], [0.78, top, -0.56]]), ...path([[-0.78, top, 0.56], [0, top + 0.45, 0.56], [0.78, top, 0.56]]), ...path([[0, top + 0.45, -0.56], [0, top + 0.45, 0.56]])];
      const win = (x: number, y: number): Seg[] => [...path([[x - 0.1, y - 0.1, 0.5], [x + 0.1, y - 0.1, 0.5], [x + 0.1, y + 0.1, 0.5], [x - 0.1, y + 0.1, 0.5]], true), ...path([[x, y - 0.1, 0.5], [x, y + 0.1, 0.5]])];
      const door = path([[-0.12, -0.5, 0.5], [-0.12, -0.12, 0.5], [0.12, -0.12, 0.5], [0.12, -0.5, 0.5]]);
      const windows = [win(-0.42, -0.2), win(0.42, -0.2), ...(H > 0.9 ? [win(-0.42, 0.2), win(0.42, 0.2)] : [])];
      const lit = windows.splice(Math.floor(t / 2.5) % windows.length, 1)[0] ?? [];
      return { body: [...walls, ...roof, ...door, ...box(0.32, top + 0.1, -0.2, 0.46, top + 0.42, -0.06), ...windows.flat()], hot: lit };
    }
    case 'rocket': {
      const fins = 3 + Math.round(p.a);
      const hull = cylinder([0, -0.55, 0], 0.22, 1.05, 10, 4);
      const nose = Array.from({ length: 10 }, (_, i): Seg => {
        const a = (i / 10) * TAU;
        return [[Math.cos(a) * 0.22, 0.5, Math.sin(a) * 0.22], [0, 0.95, 0]];
      });
      const finSegs = Array.from({ length: fins }, (_, k) => {
        const a = (k / fins) * TAU;
        const o = (r: number, y: number): Vec3 => [Math.cos(a) * r, y, Math.sin(a) * r];
        return path([o(0.22, -0.2), o(0.48, -0.62), o(0.22, -0.55)]);
      }).flat();
      const flame = Array.from({ length: 7 }, (_, i): Seg => {
        const a = (i / 7) * TAU;
        const len = 0.25 + 0.2 * Math.abs(Math.sin(t * 9 + i * 1.7));
        return [[Math.cos(a) * 0.12, -0.58, Math.sin(a) * 0.12], [Math.cos(a) * 0.04, -0.58 - len, Math.sin(a) * 0.04]];
      });
      return { body: [...hull, ...nose, ...finSegs], hot: flame };
    }
    case 'turbine': {
      const blades = 3 + Math.round(p.a);
      const hub: Vec3 = [0, 0.62, 0.12];
      const spin = t * (1.2 + p.b);
      const blade = (k: number): Seg[] => {
        const a = spin + (k * TAU) / blades;
        const q = (r: number, w: number): Vec3 => [hub[0] + Math.cos(a) * r - Math.sin(a) * w, hub[1] + Math.sin(a) * r + Math.cos(a) * w, hub[2]];
        return path([q(0.05, 0), q(0.3, 0.06), q(0.85, 0.01), q(0.85, -0.01), q(0.3, -0.03)], true);
      };
      const body = [...cylinder([0, -0.95, 0], 0.07, 1.55, 8, 3, 0.035), ...box(-0.08, 0.56, -0.22, 0.08, 0.68, 0.1), ...circle(hub, 0.05, 'z', 10)];
      return { body: [...body, ...Array.from({ length: blades - 1 }, (_, k) => blade(k + 1)).flat()], hot: blade(0) };
    }
    case 'satellite': {
      const span = 0.9 + p.a * 0.4;
      const panel = (s: number): Seg[] => {
        const x0 = s * 0.3;
        const x1 = s * span;
        const lines = [...path([[x0, -0.18, 0], [x1, -0.18, 0], [x1, 0.18, 0], [x0, 0.18, 0]], true)];
        for (let i = 1; i < 4; i++) lines.push([[x0 + ((x1 - x0) * i) / 4, -0.18, 0], [x0 + ((x1 - x0) * i) / 4, 0.18, 0]]);
        return [...lines, [[s * 0.22, 0, 0], [x0, 0, 0]]];
      };
      const dish = [...circle([0, 0.55, 0], 0.26, 'y', 16), ...Array.from({ length: 8 }, (_, i): Seg => [[Math.cos((i / 8) * TAU) * 0.26, 0.55, Math.sin((i / 8) * TAU) * 0.26], [0, 0.32, 0]]), [[0, 0.32, 0], [0, 0.75, 0]] as Seg];
      return { body: [...box(-0.22, -0.3, -0.22, 0.22, 0.3, 0.22), ...panel(1), ...panel(-1)], hot: place(dish, { yaw: Math.sin(t * 0.7) * 0.6 }) };
    }
  }
}

export default defineTemplate<P, S>({
  id: 'wire-object',
  title: 'Wire object',
  idea: 'An everyday object drawn as a wireframe on a slow turntable, its one moving part (a wheel, a moon, a blade, a flame) lit in the signal.',
  style: 'wireframe',
  motion: 'ambient',
  answers: true,
  aspect: 2,
  grammar: (rng) => ({
    kind: pick(rng, KINDS),
    yaw0: between(rng, 0, TAU),
    pitch: between(rng, 0.22, 0.55),
    turn: (rng() < 0.5 ? -1 : 1) * between(rng, 0.12, 0.26),
    a: rng(),
    b: rng(),
  }),
  name: (p) => p.kind,
  alt: (p) => `A grey wireframe ${p.kind} turning slowly in perspective, nearer edges brighter, with its moving part drawn in teal.`,
  setup: ({ params }) => ({ yaw: params.yaw0 }),
  draw: ({ ctx, w, h, t, dt, pointer, hover, still, params, state }) => {
    const target = params.yaw0 + t * params.turn + (pointer.active ? (pointer.x - 0.5) * 2.4 * hover : 0);
    state.yaw = still ? target : follow(state.yaw, target, dt, 4);
    const [fit, dy, ground] = FRAME[params.kind];
    const cam = camera({ cx: w / 2, cy: h * 0.5, scale: Math.min(w * 0.3, h * 0.62) * fit, yaw: state.yaw, pitch: params.pitch, dist: 4 });
    const { body, hot } = build(params, t);
    const lift = { at: [0, dy, 0] as const };
    if (ground !== null) strokeWire(ctx, circle([0, ground + dy, 0], 1.25, 'y', 48), cam, { alpha: 0.18 });
    strokeWire(ctx, place(body, lift), cam, { alpha: 0.9, radius: 1.2 });
    strokeWire(ctx, place(hot, lift), cam, { alpha: 0.9, radius: 1.2, signal: true });
    return pointer.active ? `${params.kind} · turn` : 'rest';
  },
});
