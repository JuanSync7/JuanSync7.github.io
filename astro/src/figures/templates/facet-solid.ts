import { defineTemplate } from '../defineTemplate';
import { camera, project, type Vec3 } from '../kit/camera';
import { shadeMesh } from '../kit/draw';
import { crystal, settle, stone, type Crystal, type Stone } from '../kit/facets';
import type { Mesh } from '../kit/models';
import { follow } from '../kit/motion';
import { between } from '../kit/rng';

/** Low-poly solids, flat-shaded and turning, of two families drawn from one seed. A crystal
 *  is a cut stone: any number of sides from four to twelve, its crown and pavilion of any
 *  length, its facets at uneven angles, a flat table or a point on top, a tip that leans.
 *  A stone is a rock: rings and segments in any number, stretched round, oval or oblong,
 *  dented in or bulging out by noise, and split flat where it fractured. The facet facing the
 *  viewer catches the light. The pointer turns it by hand. */

type P = (Crystal | Stone) & { pitch: number; turn: number; tilt: Vec3 };

interface S {
  mesh: Mesh;
  yaw: number;
}

const LIGHT: Vec3 = [0.4, 0.8, 0.45];

export default defineTemplate<P, S>({
  id: 'facet-solid',
  title: 'Facet solid',
  idea: 'A low-poly solid drawn from a seed, a cut crystal or a rough stone, its sides, lengths, angles and dents all chosen by the grammar, turning slowly, its nearest facet catching the light.',
  style: 'lowpoly',
  motion: 'ambient',
  answers: true,
  aspect: 2,
  grammar: (rng) => {
    const look = { pitch: between(rng, 0.2, 0.6), turn: (rng() < 0.5 ? -1 : 1) * between(rng, 0.15, 0.3) };
    const tilt: Vec3 = [between(rng, -0.35, 0.35), 0, between(rng, -0.35, 0.35)];
    if (rng() < 0.5)
      return {
        kind: 'crystal',
        sides: 4 + Math.floor(rng() * 9),
        r: between(rng, 0.35, 0.85),
        crown: between(rng, 0.15, 1.1),
        pavilion: between(rng, 0.3, 1.1),
        table: rng() < 0.45 ? between(rng, 0.3, 0.65) : 0,
        band: rng() < 0.5 ? between(rng, 0.03, 0.14) : 0.01,
        jitter: between(rng, 0, 0.6),
        lean: [between(rng, -0.18, 0.18), between(rng, -0.18, 0.18)],
        ...look,
        tilt,
      };
    const oblong = rng();
    return {
      kind: 'stone',
      rings: 2 + Math.floor(rng() * 6),
      segs: 5 + Math.floor(rng() * 8),
      axes: [between(rng, 0.8, 1.4) + (oblong > 0.6 ? 0.5 : 0), between(rng, 0.55, 1.1), between(rng, 0.6, 1.1)],
      dent: between(rng, 0.1, 0.45),
      cuts: Math.floor(rng() * 4),
      jitter: between(rng, 0.1, 0.8),
      ...look,
      tilt: [tilt[0] * 2, 0, tilt[2] * 2],
    };
  },
  name: (p) =>
    p.kind === 'crystal'
      ? `${p.sides}-sided ${p.table > 0 ? 'table-cut' : 'pointed'} crystal`
      : `${p.axes[0] > 1.5 ? 'oblong' : Math.abs(p.axes[0] - p.axes[1]) > 0.35 ? 'oval' : 'round'} stone`,
  alt: (p) =>
    p.kind === 'crystal'
      ? `A flat-shaded grey ${p.sides}-sided crystal with ${p.table > 0 ? 'a flat table' : 'a point'} on top, turning slowly, one facet teal.`
      : `A flat-shaded grey rough stone with ${(p.rings + 1) * p.segs} facets${p.cuts ? ' and flat fractured faces' : ''}, turning slowly, one facet teal.`,
  setup: ({ rng, params }) => {
    const mesh = settle(params.kind === 'crystal' ? crystal(params, rng) : stone(params, rng), params.tilt);
    return { mesh, yaw: 0.5 };
  },
  draw: ({ ctx, w, h, t, dt, pointer, hover, still, params, state }) => {
    const target = 0.5 + t * params.turn + (pointer.active ? (pointer.x - 0.5) * 3 * hover : 0);
    state.yaw = still ? target : follow(state.yaw, target, dt, 4);
    const cam = camera({
      cx: w / 2,
      cy: h * 0.5,
      scale: Math.min(w, h) * 0.4,
      yaw: state.yaw,
      pitch: params.pitch,
      dist: 4,
    });
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
