import { defineTemplate } from '../defineTemplate';
import { camera } from '../kit/camera';
import { follow } from '../kit/motion';
import { between, pick } from '../kit/rng';
import { circle, place, strokeWire } from '../kit/shapes';
import { build, FRAME, KINDS, type Kind } from '../kit/wireobjects';

/** Everyday objects as wireframes on a slow turntable, each with the one part that moves
 *  in its own way lit in the signal: a car's wheel turning, a planet's moon in orbit, a
 *  house's lit window, a rocket's flame, a turbine's blade, a satellite's dish. */

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
    yaw0: between(rng, 0, Math.PI * 2),
    pitch: between(rng, 0.22, 0.55),
    turn: (rng() < 0.5 ? -1 : 1) * between(rng, 0.12, 0.26),
    a: rng(),
    b: rng(),
  }),
  name: (p) => p.kind,
  alt: (p) =>
    `A grey wireframe ${p.kind} turning slowly in perspective, nearer edges brighter, with its moving part drawn in teal.`,
  setup: ({ params }) => ({ yaw: params.yaw0 }),
  draw: ({ ctx, w, h, t, dt, pointer, hover, still, params, state }) => {
    const target = params.yaw0 + t * params.turn + (pointer.active ? (pointer.x - 0.5) * 2.4 * hover : 0);
    state.yaw = still ? target : follow(state.yaw, target, dt, 4);
    const [fit, dy, ground] = FRAME[params.kind];
    const cam = camera({
      cx: w / 2,
      cy: h * 0.5,
      scale: Math.min(w * 0.3, h * 0.62) * fit,
      yaw: state.yaw,
      pitch: params.pitch,
      dist: 4,
    });
    const { body, hot } = build(params, t);
    const lift = { at: [0, dy, 0] as const };
    if (ground !== null) strokeWire(ctx, circle([0, ground + dy, 0], 1.25, 'y', 48), cam, { alpha: 0.18 });
    strokeWire(ctx, place(body, lift), cam, { alpha: 0.9, radius: 1.2 });
    strokeWire(ctx, place(hot, lift), cam, { alpha: 0.9, radius: 1.2, signal: true });
    return pointer.active ? `${params.kind} · turn` : 'rest';
  },
});
