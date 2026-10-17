import { defineTemplate } from '../defineTemplate';
import { camera, project, type Camera } from '../kit/camera';
import { ink } from '../kit/ink';
import { follow } from '../kit/motion';
import { noise2, type Noise2 } from '../kit/noise';
import { between, pick } from '../kit/rng';
import { MOTIFS, motif, type Motif } from '../kit/patterns';

/** Hairline cards in space, each carrying a different drawn pattern (Truchet tiles, moiré,
 *  flow lines, an L-system plant, a Hilbert curve, nested squares, waves, a dot field),
 *  arranged as a carousel, a fan, a deck or a tilted grid. The card in front is the signal;
 *  the pointer brings another forward. */

const LAYOUTS = ['carousel', 'fan', 'deck', 'grid'] as const;
type Layout = (typeof LAYOUTS)[number];

interface P {
  layout: Layout;
  motifs: Motif[];
  seeds: number[];
  pitch: number;
}

interface S {
  noise: Noise2;
  turn: number;
}

function card(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  c: readonly [number, number, number],
  yaw: number,
  tilt: number,
  front: boolean,
  m: Motif,
  seed: number,
  noise: Noise2,
): void {
  const ux = Math.cos(yaw);
  const uz = -Math.sin(yaw);
  const pt = (u: number, v: number): [number, number] => {
    const y = v * Math.cos(tilt);
    const back = v * Math.sin(tilt);
    const p = project(
      cam,
      c[0] + ux * u * 0.5 - Math.sin(yaw) * back * 0.5,
      c[1] + y * 0.5,
      c[2] + uz * u * 0.5 - Math.cos(yaw) * back * 0.5,
    );
    return [p[0], p[1]];
  };
  const corners = [pt(-1, -0.5), pt(1, -0.5), pt(1, 0.5), pt(-1, 0.5)];
  ctx.beginPath();
  corners.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = ink.ground();
  ctx.fill();
  ctx.strokeStyle = front ? ink.signal(0.95) : ink.line(0.4);
  ctx.stroke();
  ctx.strokeStyle = ink.line(front ? 0.55 : 0.25);
  motif(
    m,
    (pts) => {
      ctx.beginPath();
      pts.forEach(([u, v], i) => {
        const [x, y] = pt(u * 0.92, v * 0.88);
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      });
      ctx.stroke();
    },
    seed,
    noise,
  );
}

export default defineTemplate<P, S>({
  id: 'pattern-cards',
  title: 'Pattern cards',
  idea: 'A set of drawings shown as cards in space (a carousel, a fan, a deck, a grid), each card a different pattern, one brought forward at a time.',
  style: 'hairline',
  motion: 'ambient',
  answers: true,
  aspect: 2,
  grammar: (rng) => {
    const layout = pick(rng, LAYOUTS);
    const n = layout === 'grid' ? 6 : 5;
    // Draw without replacement, so no two cards on one sheet carry the same pattern.
    const pool: Motif[] = [...MOTIFS];
    const motifs = Array.from({ length: n }, () => pool.splice(Math.floor(rng() * pool.length), 1)[0] ?? 'dots');
    return { layout, motifs, seeds: motifs.map(() => Math.floor(rng() * 1000)), pitch: between(rng, 0.15, 0.4) };
  },
  name: (p) => `${p.layout} of ${p.motifs.length}`,
  alt: (p) =>
    `Thin-outlined cards arranged as a ${p.layout}, each holding a small line pattern (${p.motifs.join(', ')}), the front card outlined in teal.`,
  setup: ({ rng }) => ({ noise: noise2(rng), turn: 0 }),
  draw: ({ ctx, w, h, t, dt, pointer, hover, still, params, state }) => {
    const n = params.motifs.length;
    const pickK = pointer.active && hover > 0.3 ? Math.min(n - 1, Math.floor(pointer.x * n)) : -1;
    const target = pickK >= 0 ? pickK : (t * 0.35) % n;
    state.turn = still || pickK < 0 ? target : follow(state.turn, target, dt, 5);
    const cam = camera({
      cx: w / 2,
      cy: h / 2,
      scale: Math.min(w * 0.27, h * 0.52),
      yaw: 0,
      pitch: params.pitch,
      dist: 4,
    });
    const items = params.motifs.map((m, k) => {
      const rel = (((k - state.turn) % n) + n) % n;
      let c: [number, number, number] = [0, 0, 0];
      let yaw = 0;
      let tilt = 0;
      if (params.layout === 'carousel') {
        const a = (rel / n) * Math.PI * 2;
        c = [Math.sin(a) * 1.1, 0, Math.cos(a) * 1.1];
        yaw = a;
      } else if (params.layout === 'fan') {
        const a = ((rel - (n - 1) / 2) / n) * 1.6;
        c = [Math.sin(a) * 0.9, -Math.cos(a) * 0.3 + 0.2, Math.cos(a) * 0.4 - rel * 0.05];
        yaw = a * 0.6;
      } else if (params.layout === 'deck') {
        c = [rel * 0.18 - 0.35, rel * 0.08, -rel * 0.35];
        yaw = 0.35;
      } else {
        const gx = k % 3;
        const gy = Math.floor(k / 3);
        c = [(gx - 1) * 1.08, (0.5 - gy) * 0.6, 0];
        // Each card in the grid rocks a little on its own phase, so the sheet is never still.
        tilt = 0.5 + Math.sin(t * 0.7 + k * 1.3) * 0.12;
        yaw = Math.sin(t * 0.5 + k * 0.9) * 0.08;
      }
      return { m, k, c, yaw, tilt, rel };
    });
    items.sort((a, b) => project(cam, a.c[0], a.c[1], a.c[2])[2] - project(cam, b.c[0], b.c[1], b.c[2])[2]);
    const frontK = params.layout === 'grid' ? Math.floor(state.turn) % n : (items[items.length - 1]?.k ?? 0);
    for (const it of items)
      card(ctx, cam, it.c, it.yaw, it.tilt, it.k === frontK, it.m, params.seeds[it.k] ?? 1, state.noise);
    return pointer.active ? `${params.motifs[frontK] ?? ''}` : 'rest';
  },
});
