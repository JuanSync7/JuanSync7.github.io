import { defineTemplate } from '../defineTemplate';
import { ASSEMBLIES, type AssemblyKind, type Part } from '../kit/assemblies';
import { camera, project, type Vec3 } from '../kit/camera';
import { ink } from '../kit/ink';
import { clamp, follow, smoothstep } from '../kit/motion';
import { between, pick } from '../kit/rng';
import { place, strokeWire, type Seg } from '../kit/shapes';

/** An exploded view in hairline: a machine (a rocket, a key switch, a camera lens, a chip
 *  package) comes apart along its axis, part after part, holds while a leader line names
 *  each part in turn in the signal, then closes up again. Long machines lie on their side.
 *  The pointer picks a part and pulls the view open. */

const KINDS = Object.keys(ASSEMBLIES) as AssemblyKind[];
const LYING: readonly AssemblyKind[] = ['rocket', 'lens'];
const PERIOD = 12;

interface P {
  kind: AssemblyKind;
  build: number;
  yaw: number;
  pitch: number;
  spread: number;
}

interface S {
  parts: Part[];
  open: number;
  /** Centre and largest extent of the fully exploded machine: the view is fitted to it. */
  mid: Vec3;
  span: number;
}

const add = (a: Vec3, b: Vec3, k: number): Vec3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

function centre(segs: readonly Seg[]): Vec3 {
  let x = 0;
  let y = 0;
  let z = 0;
  for (const [a, b] of segs) {
    x += a[0] + b[0];
    y += a[1] + b[1];
    z += a[2] + b[2];
  }
  const n = Math.max(1, segs.length * 2);
  return [x / n, y / n, z / n];
}

export default defineTemplate<P, S>({
  id: 'anatomy',
  title: 'Anatomy',
  idea: 'An exploded view in hairline: a machine comes apart part by part along its axis, a leader line marks each part in turn, then it closes up again.',
  style: 'hairline',
  motion: 'ambient',
  answers: true,
  aspect: 2,
  grammar: (rng) => ({ kind: pick(rng, KINDS), build: Math.floor(rng() * 1e6), yaw: between(rng, 0.35, 0.9), pitch: between(rng, 0.25, 0.5), spread: between(rng, 0.85, 1.15) }),
  name: (p) => ({ rocket: 'rocket', keySwitch: 'key switch', lens: 'camera lens', chip: 'chip package' })[p.kind],
  alt: (p) => `A ${({ rocket: 'rocket', keySwitch: 'keyboard switch', lens: 'camera lens', chip: 'chip package' })[p.kind]} drawn in thin grey lines, taken apart along its axis with its parts spaced out, one part and its leader line in teal.`,
  setup: ({ rng, params }) => {
    const lying = LYING.includes(params.kind);
    // Long machines are turned onto their side so the explosion runs across the wide frame.
    const turn = (segs: Seg[]): Seg[] => (lying ? place(segs, { roll: -Math.PI / 2 }) : segs);
    const parts = ASSEMBLIES[params.kind](rng).map((p) => {
      const d = turn([[[0, 0, 0], p.dir]])[0]?.[1] ?? p.dir;
      return { ...p, segs: turn(p.segs), dir: d };
    });
    const lo: [number, number, number] = [Infinity, Infinity, Infinity];
    const hi: [number, number, number] = [-Infinity, -Infinity, -Infinity];
    for (const p of parts) for (const seg of p.segs) for (const q of seg) {
      const e = add(q, p.dir, p.gap * params.spread);
      for (let i = 0; i < 3; i++) {
        lo[i] = Math.min(lo[i] ?? 0, e[i] ?? 0);
        hi[i] = Math.max(hi[i] ?? 0, e[i] ?? 0);
      }
    }
    const mid: Vec3 = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
    return { parts, open: 0, mid, span: Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) };
  },
  draw: ({ ctx, w, h, t, dt, pointer, hover, still, params, state }) => {
    const lying = LYING.includes(params.kind);
    // Phase is offset so a still at rest catches the machine apart, not closed.
    const ph = ((t + PERIOD * 0.3) / PERIOD) % 1;
    const cycle = smoothstep(0.02, 0.28, ph) * (1 - smoothstep(0.86, 0.98, ph));
    const target = pointer.active ? Math.max(cycle, hover) : cycle;
    state.open = still ? target : follow(state.open, target, dt, 5);
    const cam = camera({
      cx: w * (lying ? 0.5 : 0.42),
      cy: h * 0.5,
      scale: (lying ? Math.min(w * 0.62, h * 1.5) : h * 0.62) / state.span,
      yaw: params.yaw + Math.sin(t * 0.15) * 0.15,
      pitch: params.pitch,
      dist: 9,
    });
    const n = state.parts.length;
    const placed = state.parts.map((p, i) => {
      // Parts leave one after another: the outermost first, so nothing passes through another.
      const order = Math.abs(i - (n - 1) / 2) / ((n - 1) / 2);
      const e = clamp(state.open * 1.6 - (1 - order) * 0.6, 0, 1);
      const k = smoothstep(0, 1, e) * p.gap * params.spread;
      return { p, segs: p.segs.map(([a, b]): Seg => [add(a, p.dir, k), add(b, p.dir, k)]).map(([a, b]): Seg => [add(a, state.mid, -1), add(b, state.mid, -1)]) };
    });
    let picked = -1;
    if (pointer.active && hover > 0.3) {
      let best = Infinity;
      placed.forEach(({ segs }, i) => {
        const c = centre(segs);
        const s = project(cam, c[0], c[1], c[2]);
        const d = Math.hypot(s[0] - pointer.x * w, s[1] - pointer.y * h);
        if (d < best) {
          best = d;
          picked = i;
        }
      });
    }
    // The picked part slides further out than the rest, like a drawer pulled to read it.
    const pulled = placed[picked];
    if (pulled) pulled.segs = pulled.segs.map(([a, b]): Seg => [add(a, pulled.p.dir, 0.3 * hover), add(b, pulled.p.dir, 0.3 * hover)]);
    const named = picked >= 0 ? picked : state.open > 0.9 ? Math.floor(t * 0.9) % n : -1;
    placed.forEach(({ segs }, i) => strokeWire(ctx, segs, cam, { alpha: i === named ? 1 : 0.85, radius: 1.6, signal: i === named }));
    // Leader lines: from each part out to a column beside the machine, ending in a short tick.
    if (state.open > 0.5) {
      const col = lying ? 0 : w * 0.8;
      placed.forEach(({ segs }, i) => {
        const c = centre(segs);
        const s = project(cam, c[0], c[1], c[2]);
        const y = lying ? (i % 2 ? h * 0.86 : h * 0.14) : s[1];
        const x = lying ? s[0] : col;
        ctx.strokeStyle = i === named ? ink.signal(0.9) : ink.line(0.22 * smoothstep(0.5, 0.9, state.open));
        ctx.beginPath();
        ctx.moveTo(s[0], s[1]);
        ctx.lineTo(x, y);
        if (lying) ctx.lineTo(x + 14, y);
        else ctx.lineTo(x + 18, y);
        ctx.stroke();
      });
    }
    return pointer.active && named >= 0 ? (state.parts[named]?.name ?? 'part') : 'rest';
  },
});
