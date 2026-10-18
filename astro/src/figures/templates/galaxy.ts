import { defineTemplate, type TemplateFrame } from '../defineTemplate';
import { drawField, drawGalaxy, field, galaxy, type Galaxy, type Kind, type Pt, type Star } from '../kit/cosmos';
import { disc, drawHole, lens, type Disc } from '../kit/hole';
import { follow } from '../kit/motion';
import { drawGas, gas, type Gas } from '../kit/nebula';
import { drawNova, nova, type Nova } from '../kit/nova';
import { between, pick } from '../kit/rng';

/** Space in points and grey gas, from the seed: one great spiral (barred or not, its arms,
 *  knots and dust seeded) with small galaxies behind it; a deep field of galaxies big and
 *  small at every tilt; a nebula of warped gas with stars born in it; a black hole in the
 *  heart of a galaxy, its disc and the far side bent over the shadow, the galaxy behind
 *  lensed round it; a supernova blowing out its shell over and over. One mark is the
 *  signal. The pointer tips the view or picks what is under it. */

const FORMS = ['spiral', 'universe', 'nebula', 'blackhole', 'supernova'] as const;
type Form = (typeof FORMS)[number];
const ALT: Record<Form, string> = {
  universe:
    "A deep field of {n} galaxies of every size and tilt in grey points on the dark, slowly turning, one galaxy's core teal.",
  nebula:
    'A grey nebula of folded gas and dark dust lanes with stars over and inside it, one young star teal with its spikes.',
  blackhole:
    'A black hole in a field of stars: a grey accretion disc crossing in front of the dark shadow, its far side arching over the top, with a teal hot spot orbiting.',
  supernova:
    'A supernova remnant: a clumpy grey shell expanding and thinning with ejecta fingers past it, a teal pulsar sweeping its beams at the centre.',
  spiral:
    'A great spiral galaxy in grey points, its arms, knots and dust lanes slowly turning, smaller galaxies behind it, its core teal.',
};

interface P {
  form: Form;
  /** How many galaxies in a deep field. */
  count: number;
}
interface Placed {
  g: Galaxy;
  x: number;
  y: number;
  size: number;
  depth: number;
}
interface S {
  main: Galaxy;
  others: Placed[];
  stars: Star[];
  gas: Gas | null;
  disc: Disc | null;
  nova: Nova | null;
  /** Bright stars born in the gas, with the one in the signal first. */
  young: Pt[];
  tilt: number;
}

export default defineTemplate<P, S>({
  id: 'galaxy',
  title: 'Galaxy',
  idea: 'Space from the seed: a great spiral, a deep field of galaxies big and small, a nebula of grey gas with young stars, a black hole bending the galaxy behind it, a supernova blowing out its shell.',
  style: 'perspective',
  motion: 'ambient',
  answers: true,
  aspect: 2,
  grammar: (rng) => ({ form: pick(rng, FORMS), count: 14 + Math.floor(rng() * 24) }),
  name: (p) => (p.form === 'blackhole' ? 'black hole' : p.form === 'universe' ? 'deep field' : p.form),
  alt: (p) => ALT[p.form].replace('{n}', String(p.count)),
  setup: ({ rng, params }) => {
    const sizes = Array.from({ length: params.form === 'universe' ? params.count : 7 }, () =>
      Math.exp(between(rng, -3.4, params.form === 'universe' ? -0.9 : -2.2)),
    );
    const others = sizes
      .sort((a, b) => a - b)
      .map((size) => ({
        g: galaxy(rng, Math.round(120 + size * 2600)),
        x: between(rng, -1.9, 1.9),
        y: between(rng, -0.9, 0.9),
        size,
        depth: between(rng, 0.2, 1),
      }));
    let g: Gas | null = null;
    const young: Pt[] = [];
    if (params.form === 'nebula') {
      g = gas(rng);
      for (let k = 0; k < 400 && young.length < 26; k++) {
        const [u, v] = [rng(), rng()];
        if (g.at(u, v) > 0.35 + rng() * 0.3) young.push([u, v]);
      }
    }
    const kind: Kind | undefined =
      params.form === 'spiral'
        ? pick(rng, ['spiral', 'spiral', 'barred'] as const)
        : params.form === 'blackhole'
          ? 'spiral'
          : undefined;
    const main = galaxy(rng, params.form === 'spiral' ? 4200 : 2400, kind);
    if (params.form === 'spiral') main.tilt = between(rng, 0.25, 1.1);
    if (params.form === 'blackhole') main.tilt = between(rng, 0.2, 0.7);
    return {
      main,
      others,
      stars: field(rng, params.form === 'nebula' ? 420 : 260, 4.2, 2.2),
      gas: g,
      disc: params.form === 'blackhole' ? disc(rng) : null,
      nova: params.form === 'supernova' ? nova(rng) : null,
      young,
      tilt: main.tilt,
    };
  },
  draw: (f) => {
    // The pointer pans the view a little, as if leaning to look: every form answers it.
    const { ctx, w, h, pointer, hover } = f;
    const [px, py] = pointer.active ? [(pointer.x - 0.5) * hover, (pointer.y - 0.5) * hover] : [0, 0];
    ctx.save();
    ctx.translate(-px * w * 0.08, -py * h * 0.08);
    const read = scene(f);
    ctx.restore();
    return read;
  },
});

function scene({ ctx, w, h, t, dt, pointer, hover, still, params, state }: TemplateFrame<P, S>): string {
  const U = Math.min(w / 4.2, h / 2.2);
  const flat: (s: number, dx?: number, dy?: number) => (x: number, y: number) => Pt =
    (s, dx = 0, dy = 0) =>
    (x, y) => [w / 2 + (dx + x * s) * U, h / 2 + (dy + y * s) * U];
  const drift = (d: number): number => Math.sin(t * 0.04) * 0.08 * d;
  if (params.form !== 'blackhole') drawField(ctx, state.stars, t, flat(1, drift(0.2)));
  if (params.form === 'spiral' || params.form === 'universe') {
    const main = params.form === 'spiral';
    const target = main && pointer.active ? state.main.tilt + (0.5 - pointer.y) * 0.8 * hover : state.main.tilt;
    state.tilt = still ? target : follow(state.tilt, target, dt, 3);
    let hit = -1;
    state.others.forEach((o, i) => {
      if (main && o.size > 0.12) return;
      const at: Pt = [o.x + drift(o.depth), o.y];
      if (
        pointer.active &&
        Math.hypot(at[0] * U + w / 2 - pointer.x * w, at[1] * U + h / 2 - pointer.y * h) < Math.max(12, o.size * U)
      )
        hit = i;
      drawGalaxy(ctx, o.g, t, flat(o.size, at[0], at[1]), {
        alpha: main ? 0.6 : 0.5 + o.depth * 0.5,
        size: o.size * U,
        hot: !main && i === state.others.length - 1,
      });
    });
    if (main) {
      const g = { ...state.main, tilt: state.tilt };
      drawGalaxy(ctx, g, t, flat(0.95), { alpha: 1, size: 0.95 * U, hot: true });
      return pointer.active ? `${state.main.kind} · tilt` : 'rest';
    }
    return hit >= 0 ? (state.others[hit]?.g.kind ?? 'rest') : 'rest';
  }
  if (params.form === 'nebula' && state.gas) {
    drawGas(ctx, state.gas, state.young, w, h, (k) => drift(k) * U * 2, t);
    return pointer.active ? `${state.gas.shape} nebula` : 'rest';
  }
  if (params.form === 'blackhole' && state.disc) {
    const s = Math.min(w, h) * 0.075;
    const [cx, cy] = [w / 2, h / 2];
    const bend =
      (k: number, dx = 0) =>
      (x: number, y: number): Pt | null => {
        const p = lens((dx + x * k) * U, y * k * U, s * 2.6, s);
        return p ? [cx + p[0], cy + p[1]] : null;
      };
    drawField(ctx, state.stars, t, bend(1, drift(0.2)), 0.9);
    drawGalaxy(ctx, state.main, t * 0.4, bend(1.3), { alpha: 0.55, size: 1.3 * U });
    drawHole(ctx, state.disc, cx, cy, s, t);
    const r = pointer.active ? Math.hypot(pointer.x * w - cx, pointer.y * h - cy) / s : 99;
    return r < 1.1
      ? 'event horizon'
      : r < state.disc.outer
        ? 'accretion disc'
        : pointer.active
          ? 'host galaxy'
          : 'rest';
  }
  if (state.nova) {
    drawGalaxy(ctx, state.main, t * 0.3, flat(1.6, -0.6, 0.2), { alpha: 0.25, size: 1.6 * U });
    drawNova(ctx, state.nova, w / 2 + U * 0.3, h / 2, Math.min(w, h) * 0.38, t);
  }
  return pointer.active ? 'remnant' : 'rest';
}
