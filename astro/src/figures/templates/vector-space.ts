import { defineTemplate } from '../defineTemplate';
import { camera, project, type Camera, type Vec3 } from '../kit/camera';
import { ink } from '../kit/ink';
import { follow } from '../kit/motion';
import { noise2, type Noise2 } from '../kit/noise';
import { between, pick } from '../kit/rng';
import { path, strokeWire, type Seg } from '../kit/shapes';

/** 3D vector diagrams on a turning set of axes: embeddings in clusters with a query vector,
 *  a vector field, a cross product, a projection onto a plane, gradient descent on a
 *  surface. The vector that answers the question is the signal. The pointer turns the view. */

const SCENES = ['embed', 'field', 'cross', 'project', 'descent'] as const;
type Scene = (typeof SCENES)[number];

interface P {
  scene: Scene;
  /** A seeded second vector for the cross product and a seeded vector to project. */
  b: Vec3;
  pitch: number;
  yaw0: number;
  turn: number;
}

interface S {
  noise: Noise2;
  points: Vec3[];
  yaw: number;
}

/** An arrow from a to b: the shaft, and a head of two short strokes drawn in screen space. */
function arrow(ctx: CanvasRenderingContext2D, cam: Camera, a: Vec3, b: Vec3, style: string): void {
  const pa = project(cam, a[0], a[1], a[2]);
  const pb = project(cam, b[0], b[1], b[2]);
  const ang = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]);
  // A short shaft gets a small head, so a field of arrows does not read as a field of chevrons.
  const s = Math.min(7, Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) * 0.35);
  ctx.strokeStyle = style;
  ctx.beginPath();
  ctx.moveTo(pa[0], pa[1]);
  ctx.lineTo(pb[0], pb[1]);
  ctx.moveTo(pb[0] - Math.cos(ang - 0.4) * s, pb[1] - Math.sin(ang - 0.4) * s);
  ctx.lineTo(pb[0], pb[1]);
  ctx.lineTo(pb[0] - Math.cos(ang + 0.4) * s, pb[1] - Math.sin(ang + 0.4) * s);
  ctx.stroke();
}

const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

export default defineTemplate<P, S>({
  id: 'vector-space',
  title: 'Vector space',
  idea: 'Linear algebra drawn in 3D on turning axes: embeddings and a query, a vector field, a cross product, a projection, gradient descent, with the answer in the signal.',
  style: 'wireframe',
  motion: 'ambient',
  answers: true,
  aspect: 2,
  grammar: (rng) => ({ scene: pick(rng, SCENES), b: [between(rng, -0.6, 0.6), between(rng, 0.05, 0.5), between(rng, 0.6, 1.0)], pitch: between(rng, 0.25, 0.55), yaw0: between(rng, 0.4, 1.2), turn: (rng() < 0.5 ? -1 : 1) * between(rng, 0.08, 0.16) }),
  name: (p) => ({ embed: 'embeddings', field: 'vector field', cross: 'cross product', project: 'projection', descent: 'gradient descent' })[p.scene],
  alt: (p) => `A 3D diagram on grey axes showing ${({ embed: 'clusters of embedding points with a teal query vector', field: 'a field of small grey arrows with one teal', cross: 'two grey vectors and their teal cross product', project: 'a vector and its teal projection onto a plane', descent: 'a wireframe surface with a teal path stepping downhill' })[p.scene]}.`,
  setup: ({ rng, params }) => {
    const points: Vec3[] = [];
    if (params.scene === 'embed') {
      for (let c = 0; c < 3; c++) {
        const centre: Vec3 = [between(rng, -0.7, 0.7), between(rng, 0.1, 0.8), between(rng, -0.7, 0.7)];
        for (let i = 0; i < 14; i++) points.push([centre[0] + (rng() - 0.5) * 0.3, centre[1] + (rng() - 0.5) * 0.3, centre[2] + (rng() - 0.5) * 0.3]);
      }
    }
    return { noise: noise2(rng), points, yaw: params.yaw0 };
  },
  draw: ({ ctx, w, h, t, dt, pointer, hover, still, params, state }) => {
    const target = params.yaw0 + t * params.turn + (pointer.active ? (pointer.x - 0.5) * 2.4 * hover : 0);
    state.yaw = still ? target : follow(state.yaw, target, dt, 4);
    const cam = camera({ cx: w / 2, cy: h * 0.6, scale: Math.min(w * 0.3, h * 0.6), yaw: state.yaw, pitch: params.pitch, dist: 4 });
    const axis = ink.line(0.35);
    arrow(ctx, cam, [0, 0, 0], [1.1, 0, 0], axis);
    arrow(ctx, cam, [0, 0, 0], [0, 1.1, 0], axis);
    arrow(ctx, cam, [0, 0, 0], [0, 0, 1.1], axis);
    const floor: Seg[] = [];
    for (let k = -4; k <= 4; k++) floor.push([[k * 0.25, 0, -1], [k * 0.25, 0, 1]], [[-1, 0, k * 0.25], [1, 0, k * 0.25]]);
    strokeWire(ctx, floor, cam, { alpha: 0.25 });
    if (params.scene === 'embed') {
      const q: Vec3 = [Math.cos(t * 0.3) * 0.85, 0.7, Math.sin(t * 0.3) * 0.85];
      let best = state.points[0] ?? q;
      let bestCos = -2;
      for (const p of state.points) {
        const c = (p[0] * q[0] + p[1] * q[1] + p[2] * q[2]) / (Math.hypot(...p) * Math.hypot(...q));
        if (c > bestCos) {
          bestCos = c;
          best = p;
        }
        const s = project(cam, p[0], p[1], p[2]);
        ctx.fillStyle = ink.line(0.6);
        ctx.fillRect(s[0] - 2, s[1] - 2, 4, 4);
      }
      // The nearest embedding by cosine is ringed and joined to the origin: the retrieval.
      const nb = project(cam, best[0], best[1], best[2]);
      ctx.strokeStyle = ink.signal(0.9);
      ctx.strokeRect(nb[0] - 5, nb[1] - 5, 10, 10);
      strokeWire(ctx, [[[0, 0, 0], best]], cam, { alpha: 0.5 });
      arrow(ctx, cam, [0, 0, 0], q, ink.signal(0.95));
    } else if (params.scene === 'field') {
      for (let i = -2; i <= 2; i++) for (let j = 0; j <= 2; j++) for (let k = -2; k <= 2; k++) {
        const p: Vec3 = [i * 0.4, 0.2 + j * 0.4, k * 0.4];
        const a = state.noise(p[0] * 1.5 + t * 0.2, p[2] * 1.5 + p[1]) * Math.PI * 2;
        const v: Vec3 = [Math.cos(a) * 0.18, Math.sin(a * 0.7) * 0.08, Math.sin(a) * 0.18];
        arrow(ctx, cam, p, [p[0] + v[0], p[1] + v[1], p[2] + v[2]], i === 0 && j === 1 && k === 0 ? ink.signal(0.95) : ink.line(0.45));
      }
    } else if (params.scene === 'cross') {
      const a: Vec3 = [Math.cos(t * 0.5) * 1.0, 0.15, Math.sin(t * 0.5) * 1.0];
      const b = params.b;
      // Order the pair so the product points up out of the floor rather than through it.
      const up = cross(a, b);
      const c = up[1] >= 0 ? up : cross(b, a);
      strokeWire(ctx, path([[0, 0, 0], a, [a[0] + b[0], a[1] + b[1], a[2] + b[2]], b], true), cam, { alpha: 0.35 });
      arrow(ctx, cam, [0, 0, 0], a, ink.line(0.8));
      arrow(ctx, cam, [0, 0, 0], b, ink.line(0.8));
      arrow(ctx, cam, [0, 0, 0], c, ink.signal(0.95));
    } else if (params.scene === 'project') {
      const v: Vec3 = [params.b[0] + Math.sin(t * 0.4) * 0.2, 0.6 + params.b[1], params.b[2] * 0.6 + Math.cos(t * 0.4) * 0.3];
      const onPlane: Vec3 = [v[0], 0, v[2]];
      strokeWire(ctx, path([v, onPlane]), cam, { alpha: 0.5 });
      arrow(ctx, cam, [0, 0, 0], v, ink.line(0.8));
      arrow(ctx, cam, [0, 0, 0], onPlane, ink.signal(0.95));
    } else {
      const f = (x: number, z: number): number => 0.25 * (x * x + z * z) + 0.12 * Math.sin(x * 3) * Math.cos(z * 3);
      const surf: Seg[] = [];
      for (let i = -6; i <= 6; i++) {
        const pts: Vec3[] = [];
        const qts: Vec3[] = [];
        for (let k = -6; k <= 6; k++) {
          pts.push([i / 6, f(i / 6, k / 6), k / 6]);
          qts.push([k / 6, f(k / 6, i / 6), i / 6]);
        }
        surf.push(...path(pts), ...path(qts));
      }
      strokeWire(ctx, surf, cam, { alpha: 0.6 });
      let x = -0.95;
      let z = 0.9;
      const steps = Math.floor((t * 3) % 24);
      for (let s = 0; s < steps; s++) {
        const e = 0.001;
        const gx = (f(x + e, z) - f(x - e, z)) / (2 * e);
        const gz = (f(x, z + e) - f(x, z - e)) / (2 * e);
        const nx = x - gx * 0.35;
        const nz = z - gz * 0.35;
        arrow(ctx, cam, [x, f(x, z) + 0.02, z], [nx, f(nx, nz) + 0.02, nz], ink.signal(0.9));
        x = nx;
        z = nz;
      }
    }
    return pointer.active ? `${params.scene} · turn` : 'rest';
  },
});
