import { orderSolids } from './depth';
import { visibleStrokes } from './occlusion';
import type { Camera, Vec3 } from '../camera';
import type { HardwareModel, HardwareOptions, Surface } from './types';

export interface ProjectedSurface {
  solid: number;
  points: [number, number][];
  depths: number[];
  area: number;
  face: boolean;
  outline: boolean;
  depth: number;
  top: boolean;
  part: number;
}
interface Solid {
  id: number;
  part: number;
  surfaces: Surface[];
  lo: number[];
  hi: number[];
}
interface ProjectedSolid {
  surfaces: ProjectedSurface[];
  lo: number[];
  hi: number[];
  depth: number;
}
const CACHE = new WeakMap<HardwareModel, Solid[]>();
const POSES = new WeakMap<Solid, Map<string, ProjectedSurface[]>>();
function prepare(model: HardwareModel): Solid[] {
  const cached = CACHE.get(model);
  if (cached) return cached;
  const solids: Solid[] = [];
  model.parts.forEach((part, index) => {
    const groups = new Map<number, Solid>();
    for (const surface of part.surfaces) {
      let solid = groups.get(surface.solid);
      if (!solid) {
        solid = {
          id: surface.solid,
          part: index,
          surfaces: [],
          lo: [Infinity, Infinity, Infinity],
          hi: [-Infinity, -Infinity, -Infinity],
        };
        groups.set(surface.solid, solid);
        solids.push(solid);
      }
      solid.surfaces.push(surface);
      for (const point of surface.points)
        for (let axis = 0; axis < 3; axis++) {
          solid.lo[axis] = Math.min(solid.lo[axis] ?? Infinity, point[axis] ?? 0);
          solid.hi[axis] = Math.max(solid.hi[axis] ?? -Infinity, point[axis] ?? 0);
        }
    }
  });
  for (const solid of solids) {
    const strokes = solid.surfaces.filter((s) => !s.face);
    const faces = solid.surfaces.filter((s) => s.face);
    if (faces.length) {
      solid.lo = [0, 1, 2].map((axis) => Math.min(...faces.flatMap((s) => s.points.map((p) => p[axis] ?? 0))));
      solid.hi = [0, 1, 2].map((axis) => Math.max(...faces.flatMap((s) => s.points.map((p) => p[axis] ?? 0))));
    }
    for (const stroke of strokes) {
      const host = solids
        .filter(
          (candidate) =>
            candidate.part === solid.part &&
            candidate.surfaces.some((s) => s.face) &&
            stroke.points.every((p) =>
              [0, 1, 2].every(
                (axis) =>
                  (p[axis] ?? 0) >= (candidate.lo[axis] ?? 0) - 0.006 &&
                  (p[axis] ?? 0) <= (candidate.hi[axis] ?? 0) + 0.006,
              ),
            ),
        )
        .sort(
          (a, b) =>
            ((a.hi[0] ?? 0) - (a.lo[0] ?? 0)) * ((a.hi[2] ?? 0) - (a.lo[2] ?? 0)) -
            ((b.hi[0] ?? 0) - (b.lo[0] ?? 0)) * ((b.hi[2] ?? 0) - (b.lo[2] ?? 0)),
        )[0];
      if (host && host !== solid) {
        solid.surfaces = solid.surfaces.filter((s) => s !== stroke);
        host.surfaces.push(stroke);
      }
    }
  }
  CACHE.set(model, solids);
  return solids;
}
const areaOf = (points: [number, number][]): number =>
  points.reduce((sum, a, i) => {
    const b = points[(i + 1) % points.length] ?? a;
    return sum + a[0] * b[1] - b[0] * a[1];
  }, 0) / 2;
/** The camera basis is computed once; model geometry and solid bounds are prepared once. */
export function hardwareScene(model: HardwareModel, o: HardwareOptions, cam: Camera): ProjectedSurface[] {
  const cy = Math.cos(cam.yaw),
    sy = Math.sin(cam.yaw),
    cp = Math.cos(cam.pitch),
    sp = Math.sin(cam.pitch);
  const point = ([x, y, z]: Vec3): [number, number, number] => {
    const zz = x * sy + z * cy;
    return [x * cy - z * sy, zz * sp - y * cp, y * sp + zz * cp];
  };
  const selected = o.pick < 0 ? model.parts.length - 1 : o.pick;
  const poseKey = `${o.mode}:${o.detail}:${cam.yaw.toFixed(4)}:${cam.pitch.toFixed(4)}`;
  const groups: ProjectedSolid[] = [];
  for (const solid of prepare(model)) {
    if (o.isolate && solid.part !== selected) continue;
    if (model.parts[solid.part]?.hiddenWhenClosed && o.mode === 'isometric' && o.open < 0.08 && !o.isolate) continue;
    const direction = model.parts[solid.part]?.explode ?? [0, solid.part * 0.4, 0];
    const offset: Vec3 = [
      direction[0] * o.open,
      direction[1] * o.open + (solid.part === o.pick ? (o.lift ?? 0) : 0),
      direction[2] * o.open,
    ];
    const at = point(offset);
    const poses = POSES.get(solid) ?? new Map<string, ProjectedSurface[]>();
    POSES.set(solid, poses);
    let local = poses.get(poseKey);
    if (!local) {
      const raw: ProjectedSurface[] = [];
      for (const s of solid.surfaces) {
        if (s.detail && !o.detail) continue;
        const projected = s.points.map((p) => point(p));
        const points = projected.map((p): [number, number] => [p[0], p[1]]);
        raw.push({
          solid: solid.id,
          points,
          depths: projected.map((p) => p[2]),
          area: s.face ? areaOf(points) : 0,
          face: s.face,
          outline: s.outline !== false,
          part: solid.part,
          top: s.points.every((p) => Math.abs(p[1] - (s.points[0]?.[1] ?? 0)) < 0.00001),
          depth: projected.reduce((sum, p) => sum + p[2], 0) / projected.length,
        });
      }
      // Local visibility is invariant under a solid's explosion or hover translation.
      local = o.mode === 'wireframe' ? raw : visibleStrokes(raw);
      poses.set(poseKey, local);
      if (poses.size > 8) poses.delete(poses.keys().next().value!);
    }
    const surfaces = local.map(
      (s): ProjectedSurface => ({
        ...s,
        points: s.points.map(([x, y]) => [x + at[0], y + at[1]]),
        depths: s.depths.map((d) => d + at[2]),
        depth: s.depth + at[2],
      }),
    );
    if (!surfaces.length) continue;
    const centre: Vec3 = [
      ((solid.lo[0] ?? 0) + (solid.hi[0] ?? 0)) / 2,
      ((solid.lo[1] ?? 0) + (solid.hi[1] ?? 0)) / 2,
      ((solid.lo[2] ?? 0) + (solid.hi[2] ?? 0)) / 2,
    ];
    groups.push({
      surfaces,
      depth: point(centre)[2] + at[2],
      lo: solid.lo.map((v, i) => v + (offset[i] ?? 0)),
      hi: solid.hi.map((v, i) => v + (offset[i] ?? 0)),
    });
  }
  return orderSolids(groups).flatMap((group) =>
    group.surfaces.sort((a, b) => Number(b.face) - Number(a.face) || a.depth - b.depth),
  );
}
