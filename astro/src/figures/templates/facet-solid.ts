import { defineTemplate } from '../defineTemplate';
import { camera, project, type Vec3 } from '../kit/camera';
import { shadeMesh } from '../kit/draw';
import { icosphere, type Mesh } from '../kit/models';
import { follow } from '../kit/motion';
import { noise2 } from '../kit/noise';
import { between, pick } from '../kit/rng';

/** Low-poly solids, flat-shaded and turning: a geodesic ball, a tall crystal, a cut gem, a
 *  rough rock, a cluster of crystals. Each is bent a little by noise so no two are alike;
 *  the facet facing the viewer catches the light. The pointer turns it by hand. */

const KINDS = ['ball', 'crystal', 'gem', 'rock', 'cluster'] as const;
type Kind = (typeof KINDS)[number];

interface P {
  kind: Kind;
  bend: number;
  stretch: number;
  count: number;
  pitch: number;
  turn: number;
}

interface S {
  mesh: Mesh;
  yaw: number;
}

const LIGHT: Vec3 = [0.4, 0.8, 0.45];

/** A double pyramid of n sides: the shape of a cut gem or, stretched, a crystal. */
function bipyramid(n: number, r: number, top: number, bottom: number): Mesh {
  const v: Vec3[] = [[0, top, 0], [0, -bottom, 0]];
  for (let i = 0; i < n; i++) v.push([Math.cos((i / n) * Math.PI * 2) * r, 0, Math.sin((i / n) * Math.PI * 2) * r]);
  const f: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = 2 + i;
    const b = 2 + ((i + 1) % n);
    f.push([0, b, a], [1, a, b]);
  }
  return { v, e: [], f };
}

function merge(parts: Mesh[]): Mesh {
  const v: Vec3[] = [];
  const f: [number, number, number][] = [];
  for (const m of parts) {
    const o = v.length;
    v.push(...m.v);
    f.push(...m.f.map(([a, b, c]): [number, number, number] => [a + o, b + o, c + o]));
  }
  return { v, e: [], f };
}

function shift(m: Mesh, d: Vec3, tilt: number): Mesh {
  const c = Math.cos(tilt);
  const s = Math.sin(tilt);
  return { ...m, v: m.v.map(([x, y, z]): Vec3 => [x * c - y * s + d[0], x * s + y * c + d[1], z + d[2]]) };
}

export default defineTemplate<P, S>({
  id: 'facet-solid',
  title: 'Facet solid',
  idea: 'A low-poly solid (a ball, a crystal, a gem, a rock, a cluster) bent a little by noise and turning slowly, its nearest facet catching the light.',
  style: 'lowpoly',
  motion: 'ambient',
  answers: true,
  aspect: 2,
  grammar: (rng) => ({ kind: pick(rng, KINDS), bend: between(rng, 0.04, 0.16), stretch: between(rng, 0.8, 1.5), count: 3 + Math.floor(rng() * 3), pitch: between(rng, 0.2, 0.6), turn: (rng() < 0.5 ? -1 : 1) * between(rng, 0.15, 0.3) }),
  name: (p) => p.kind,
  alt: (p) => `A flat-shaded grey low-poly ${p.kind === 'cluster' ? 'cluster of crystals' : p.kind} turning slowly, one facet teal.`,
  setup: ({ rng, params }) => {
    const n = noise2(rng);
    let mesh: Mesh;
    if (params.kind === 'ball') mesh = icosphere(1, 0.8);
    else if (params.kind === 'rock') mesh = icosphere(1, 0.75);
    else if (params.kind === 'gem') mesh = bipyramid(8, 0.8, 0.35, 0.75);
    else if (params.kind === 'crystal') mesh = bipyramid(6, 0.38, 0.9 * params.stretch, 0.5);
    else mesh = merge(Array.from({ length: params.count }, (_, i) => shift(bipyramid(6, 0.2 + rng() * 0.12, 0.5 + rng() * 0.5, 0.25), [(i - (params.count - 1) / 2) * 0.28, -0.2, (rng() - 0.5) * 0.3], (i - (params.count - 1) / 2) * 0.35)));
    const amount = params.kind === 'rock' ? params.bend * 2.5 : params.bend;
    mesh = { ...mesh, v: mesh.v.map(([x, y, z]): Vec3 => {
      const k = 1 + n(x * 2.1 + 3, y * 2.1 + z) * amount;
      return [x * k, y * k, z * k];
    }) };
    return { mesh, yaw: 0.5 };
  },
  draw: ({ ctx, w, h, t, dt, pointer, hover, still, params, state }) => {
    const target = 0.5 + t * params.turn + (pointer.active ? (pointer.x - 0.5) * 3 * hover : 0);
    state.yaw = still ? target : follow(state.yaw, target, dt, 4);
    const cam = camera({ cx: w / 2, cy: h * 0.5, scale: Math.min(w, h) * 0.4, yaw: state.yaw, pitch: params.pitch, dist: 4 });
    // The facet turned most toward the viewer catches the light, like a glint on a cut stone.
    const depth = state.mesh.v.map((p) => project(cam, p[0], p[1], p[2])[2]);
    let glint = 0;
    let best = -Infinity;
    state.mesh.f.forEach((f, i) => {
      const d = (depth[f[0]] ?? 0) + (depth[f[1]] ?? 0) + (depth[f[2]] ?? 0);
      if (d > best) {
        best = d;
        glint = i;
      }
    });
    shadeMesh(ctx, state.mesh, cam, LIGHT, glint);
    return pointer.active ? `${params.kind} · turn` : 'rest';
  },
});
