import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';
import type { Vec3 } from './camera';
import type { District, Part } from './city';
import type { Sketch, Tier, V3 } from './drawing/monoline';
import { frameOf, solidOf } from './districtsolids';
import { facade } from './districtfacades';
import { movers } from './districtmovers';
import type { Terrain } from './terrain';
import { MODELS } from './traffic';

/** A district (`kit/city.ts`) as a "3D isometric hidden-line drawing, monoline" (R-FIG-28): the
 *  board a slab, every part its solid (`kit/hardsurface.ts`, the same solids the hard-surface
 *  boards use) turned and stood where the district put it, so a building hides what stands
 *  behind it and its lines are its folds and, for this one camera, its silhouette. A building's
 *  face carries its windows and doors as line detail (`kit/districtfacades.ts`). The ground's
 *  streets are faint lines a hair above the board; pipes and power lines are soft lines with the
 *  flow running along them; vehicles are moving sets the figure drives round the roads. */

/** How thick the board is, under the ground at y = 0. */
const SLAB = 0.03;
/** Lines on a surface stand this far proud of it, so the surface never hides them. */
const PROUD = 0.0015;
/** A vehicle's size: the traffic model's units to the board's. */
const CAR = 0.07;

/** A part's own triangles as one solid in the sketch, in the part's frame. */
function solid(k: Sketch, p: Part, tier: Tier): void {
  const tris = solidOf(p);
  if (!tris.length) return;
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(tris, 3));
  k.mesh(g, { tier });
}

const v3 = (p: Vec3): V3 => [p[0], p[1], p[2]];

/** A vehicle on a road loop: where it starts (clear of every part), its phase, its kind. */
export interface Ride {
  loop: Vec3[];
  phase: number;
  start: Vec3;
  model: 'car' | 'hauler';
}

/** A district laid out for drawing (`kit/districtscene.ts`): its parts settled, the object each
 *  belongs to, its lines unhooked from any pylon left out, and where its vehicles start. */
export interface Plan {
  city: District;
  objects: string[];
  w: number;
  d: number;
  mark?: Part;
  rides: Ride[];
  /** What the layout left out, for the check to judge (`npm run figures:district`). */
  left: Part[];
  /** The rock and mountains as one ground surface (`kit/terrain.ts`), part of the board. */
  terrain?: Terrain;
}

/** A vehicle from the traffic model's own box at `CAR` the size, nose along +x: a body, a cabin. */
function vehicle(k: Sketch, model: Ride['model']): void {
  const m = MODELS[model];
  let [x0, x1, y1, z1] = [Infinity, -Infinity, 0, 0];
  for (let i = 0; i < m.length; i += 3) {
    [x0, x1] = [Math.min(x0, m[i] ?? 0), Math.max(x1, m[i] ?? 0)];
    [y1, z1] = [Math.max(y1, m[i + 1] ?? 0), Math.max(z1, Math.abs(m[i + 2] ?? 0))];
  }
  const [a, b, h, s] = [x0 * CAR, x1 * CAR, y1 * CAR, z1 * CAR];
  const deck = h * (model === 'hauler' ? 0.45 : 0.5);
  k.box(a, h * 0.12, -s, b, deck, s);
  const cab = model === 'hauler' ? [b - (b - a) * 0.3, b] : [a + (b - a) * 0.25, a + (b - a) * 0.7];
  k.box(cab[0] ?? a, deck, -s * 0.85, cab[1] ?? b, h, s * 0.85);
}

/** Draws a planned district into `k`. Its landmark is drawn in the signal. */
export function districtSketch(k: Sketch, plan: Plan): void {
  const { city, objects, w, d, mark, rides, terrain } = plan;
  const [hw, hd] = [w / 2, d / 2];
  k.object('board', () => {
    k.box(-hw, -SLAB, -hd, hw, 0, hd);
    terrain?.draw(k, SLAB, PROUD);
  });
  for (const [x0, z0, x1, z1] of city.traces)
    k.line(
      [
        [x0, PROUD, z0],
        [x1, PROUD, z1],
      ],
      'faint',
    );
  city.parts.forEach((p, i) => {
    k.object(objects[i] ?? p.kind, () =>
      k.frame(frameOf(p), () => {
        solid(k, p, p === mark ? 'hot' : 'edge');
        facade(k, p, PROUD);
      }),
    );
  });
  for (const pipe of city.pipes ?? []) k.line(pipe.map(v3), 'soft');
  rides.forEach((r, i) => k.moving(`ride-${i}`, v3(r.start), () => vehicle(k, r.model)));
  movers(k, plan);
}

/** The camera for a seed: `yaw` round the vertical from the board's front, `pitch` above it. */
export const lookFrom = (yaw: number, pitch: number): Vector3 =>
  new Vector3(Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch), Math.cos(pitch) * Math.cos(yaw));
