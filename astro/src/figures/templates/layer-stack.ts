import { defineTemplate } from '../defineTemplate';
import { camera, project, type Camera } from '../kit/camera';
import { ink, mix } from '../kit/ink';
import { clamp, follow } from '../kit/motion';
import { between, pick } from '../kit/rng';

/** Exploded stacks in hairline 3D: slabs of a chosen footprint (square, round, hexagon,
 *  octagon) lifted apart, each carrying its own pattern (a grid, a ball array, traces,
 *  rings, a die cluster). The stack breathes open and shut; one layer at a time is the
 *  signal. The pointer's height picks the layer. */

const SHAPES = { square: 4, hexagon: 6, octagon: 8, round: 40 } as const;
type Shape = keyof typeof SHAPES;
const MOTIFS = ['grid', 'balls', 'traces', 'rings', 'dies', 'plain'] as const;
type Motif = (typeof MOTIFS)[number];

interface Layer {
  r: number;
  th: number;
  motif: Motif;
}

interface P {
  shape: Shape;
  layers: Layer[];
  yaw: number;
  pitch: number;
}

interface S {
  open: number;
}

function footprint(shape: Shape, r: number): [number, number][] {
  const n = SHAPES[shape];
  const off = shape === 'square' ? Math.PI / 4 : 0;
  return Array.from({ length: n }, (_, i) => {
    const a = off + (i / n) * Math.PI * 2;
    return [
      Math.cos(a) * r * (shape === 'square' ? Math.SQRT2 : 1),
      Math.sin(a) * r * (shape === 'square' ? Math.SQRT2 : 1),
    ];
  });
}

function slab(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  fp: [number, number][],
  y0: number,
  y1: number,
  lit: boolean,
  motif: Motif,
  r: number,
): void {
  const B = fp.map(([x, z]) => project(cam, x, y0, z));
  const T = fp.map(([x, z]) => project(cam, x, y1, z));
  const sides = fp.map((_, i) => {
    const j = (i + 1) % fp.length;
    return { q: [B[i], B[j], T[j], T[i]], depth: ((B[i]?.[2] ?? 0) + (B[j]?.[2] ?? 0)) / 2 };
  });
  sides.sort((a, b) => a.depth - b.depth);
  for (const { q } of sides) {
    ctx.beginPath();
    q.forEach((p, k) => p && (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
    ctx.fillStyle = mix('ground', 'panel', 0.7);
    ctx.fill();
    ctx.strokeStyle = lit ? ink.signal(0.35) : ink.line(0.14);
    ctx.stroke();
  }
  ctx.beginPath();
  T.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  // The named layer keeps its grey face: its outline and pattern carry the signal, so a
  // wide layer does not flood the drawing with teal.
  ctx.fillStyle = mix('panel', 'panel2', 0.8);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = lit ? ink.signal(0.4) : ink.line(0.13);
  const seg = (x0: number, z0: number, x1: number, z1: number): void => {
    const a = project(cam, x0, y1, z0);
    const b = project(cam, x1, y1, z1);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  };
  const R = r * 1.45;
  if (motif === 'grid')
    for (let k = -4; k <= 4; k++) {
      seg((k / 4) * R, -R, (k / 4) * R, R);
      seg(-R, (k / 4) * R, R, (k / 4) * R);
    }
  if (motif === 'balls')
    for (let a = -5; a <= 5; a++)
      for (let b = -5; b <= 5; b++) {
        const p = project(cam, (a / 5) * r * 0.9, y1, (b / 5) * r * 0.9);
        ctx.beginPath();
        ctx.ellipse(p[0], p[1], 1.6, 1, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
  if (motif === 'traces')
    for (let k = -3; k <= 3; k++) {
      const z = (k / 3) * r * 0.8;
      seg(-R, z, (k % 2) * r * 0.3, z);
      seg((k % 2) * r * 0.3, z, (k % 2) * r * 0.3 + 0.12, z + 0.12);
      seg((k % 2) * r * 0.3 + 0.12, z + 0.12, R, z + 0.12);
    }
  if (motif === 'rings')
    for (let k = 1; k <= 4; k++) {
      const pts = Array.from({ length: 41 }, (_, i) =>
        project(
          cam,
          Math.cos((i / 40) * Math.PI * 2) * r * k * 0.22,
          y1,
          Math.sin((i / 40) * Math.PI * 2) * r * k * 0.22,
        ),
      );
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.stroke();
    }
  if (motif === 'dies')
    for (let a = -1; a <= 1; a++)
      for (let b = -1; b <= 1; b++) {
        const c = [
          [-0.12, -0.12],
          [0.12, -0.12],
          [0.12, 0.12],
          [-0.12, 0.12],
        ].map(([u, v]) => project(cam, a * r * 0.55 + (u ?? 0) * r, y1, b * r * 0.55 + (v ?? 0) * r));
        ctx.beginPath();
        c.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
        ctx.closePath();
        ctx.stroke();
      }
  ctx.restore();
  ctx.beginPath();
  T.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  ctx.strokeStyle = lit ? ink.signal(0.95) : ink.line(0.5);
  ctx.stroke();
}

export default defineTemplate<P, S>({
  id: 'layer-stack',
  title: 'Layer stack',
  idea: 'A thing built in layers, drawn exploded in hairline 3D: slabs lifted apart, each with its own pattern, breathing open and shut while one layer is named.',
  style: 'hairline',
  motion: 'ambient',
  answers: true,
  aspect: 2,
  grammar: (rng) => {
    const shape = pick(rng, Object.keys(SHAPES) as Shape[]);
    const n = 3 + Math.floor(rng() * 4);
    const layers: Layer[] = Array.from({ length: n }, (_, i) => ({
      r: (0.55 + rng() * 0.45) * (i === n - 1 ? 0.8 : 1),
      th: 0.03 + rng() * 0.06,
      motif: pick(rng, MOTIFS),
    }));
    return { shape, layers, yaw: between(rng, 0.45, 1.1), pitch: between(rng, 0.45, 0.7) };
  },
  name: (p) => `${p.layers.length}-layer ${p.shape}`,
  alt: (p) =>
    `A hairline drawing of ${p.layers.length} ${p.shape} slabs stacked and lifted apart in 3D, each patterned, one outlined in teal.`,
  setup: () => ({ open: 0 }),
  draw: ({ ctx, w, h, t, dt, pointer, hover, still, params, state }) => {
    const n = params.layers.length;
    const breathe = 0.5 + 0.5 * Math.sin(t * 0.7);
    const target = pointer.active ? 1 : breathe;
    state.open = still ? target : follow(state.open, target, dt, 3);
    const pick =
      pointer.active && hover > 0.3
        ? clamp(Math.floor((1 - pointer.y) * n), 0, n - 1)
        : n - 1 - (Math.floor(t / 2.2) % n);
    const span = 0.9;
    const cam = camera({
      cx: w / 2,
      cy: h * 0.46,
      scale: Math.min(w * 0.26, h * 0.46),
      yaw: params.yaw + Math.sin(t * 0.15) * 0.1,
      pitch: params.pitch,
      dist: 5,
    });
    let y = -span / 2;
    params.layers.forEach((l, i) => {
      const gap = (span / n) * (0.25 + 0.75 * state.open);
      const fp = footprint(params.shape, l.r);
      slab(ctx, cam, fp, y, y + l.th, i === pick, l.motif, l.r);
      y += l.th + gap;
    });
    return pointer.active ? `layer ${pick + 1} · ${params.layers[pick]?.motif ?? ''}` : 'rest';
  },
});
