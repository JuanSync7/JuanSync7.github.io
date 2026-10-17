import { defineCanvasFigure } from './define';
import { camera, project, type Vec3 } from './kit/camera';
import { shadeMesh } from './kit/draw';
import { icosphere, type Mesh } from './kit/models';
import { follow, smoothstep } from './kit/motion';

/** One low-poly solid breathing between two shapes: a cut crystal (silicon: hard edges,
 *  fixed once made) and a sphere (software: smooth, reshaped at will). It turns slowly; the facet
 *  facing the viewer catches the light. The pointer's x holds it anywhere between. */

interface State {
  base: Mesh;
  morph: number;
}

const LIGHT: Vec3 = [0.45, 0.75, 0.5];

/** Pulls a point on the unit sphere onto the octahedron inside it: the crystal end, a
 *  cut stone with eight flat faces and sharp tips. */
function toCrystal(v: Vec3): Vec3 {
  const m = Math.abs(v[0]) + Math.abs(v[1]) + Math.abs(v[2]) || 1;
  return [v[0] / m, v[1] / m, v[2] / m];
}

export default defineCanvasFigure<State>({
  id: 'facet-morph',
  title: 'Facet morph',
  alt: 'A flat-shaded grey low-poly solid slowly turning and changing between a faceted diamond-shaped crystal and a rounded sphere, with one facet in teal.',
  idea: 'Silicon against software as one solid: a cut crystal that relaxes into a sphere and back, the same facets either way.',
  style: 'lowpoly',
  motion: 'ambient',
  answers: true,
  group: 'cover',
  seed: 610,
  aspect: 2,
  setup: () => ({ base: icosphere(1, 1), morph: 0 }),
  draw: ({ ctx, w, h, t, dt, pointer, hover, still, state }) => {
    const target = pointer.active && hover > 0.3 ? pointer.x : smoothstep(-0.6, 0.6, Math.sin(t * 0.45 - 1.2));
    state.morph = still ? target : follow(state.morph, target, dt, 3);
    const m = state.morph;
    const v = state.base.v.map((p): Vec3 => {
      // Same size either way, so the change reads as shape, not as a zoom.
      const c = toCrystal(p);
      const s = 0.9 * (1 - m) + 0.82 * m;
      return [(c[0] * (1 - m) + p[0] * m) * s, (c[1] * (1 - m) + p[1] * m) * s, (c[2] * (1 - m) + p[2] * m) * s];
    });
    const cam = camera({ cx: w / 2, cy: h / 2, scale: Math.min(w, h) * 0.42, yaw: t * 0.22 + 0.4, pitch: 0.42, dist: 4 });
    // The facet turned most toward the viewer catches the light, like a glint on a cut stone.
    const depth = v.map((p) => project(cam, p[0], p[1], p[2])[2]);
    let glint = 0;
    let best = -Infinity;
    state.base.f.forEach((f, i) => {
      const d = (depth[f[0]] ?? 0) + (depth[f[1]] ?? 0) + (depth[f[2]] ?? 0);
      if (d > best) {
        best = d;
        glint = i;
      }
    });
    shadeMesh(ctx, { v, e: state.base.e, f: state.base.f }, cam, LIGHT, glint);
    return pointer.active ? (m < 0.5 ? 'silicon' : 'software') : 'rest';
  },
});
