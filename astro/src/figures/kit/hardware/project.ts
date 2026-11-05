import { camera, projectV, type Camera, type Vec3 } from '../camera';
import { ink, mix } from '../ink';
import { VIEWS, type HardwareModel, type HardwareOptions } from './types';

export interface HardwarePath {
  d: string;
  closed: boolean;
  points: [number, number][];
  fill: string;
  stroke: string;
  part: number;
}
interface ProjectedSurface {
  solid: number;
  points: [number, number][];
  depth: number;
  area: number;
  face: boolean;
  part: number;
  top: boolean;
}
export interface HardwareDrawing {
  paths: HardwarePath[];
  centres: [number, number][];
}

export function hardwareCamera(view: HardwareOptions['view']): Camera {
  const [yaw, pitch] = VIEWS[view];
  return camera({ yaw, pitch, dist: Infinity, scale: 1, cx: 0, cy: 0 });
}
const polygonArea = (points: [number, number][]): number =>
  points.reduce((area, a, i) => {
    const b = points[(i + 1) % points.length] ?? a;
    return area + a[0] * b[1] - b[0] * a[1];
  }, 0) / 2;
const pathData = (points: [number, number][], close: boolean): string =>
  points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join('') + (close ? 'Z' : '');

/** Every view fits the complete assembly. Camera interpolation is owned by the figure clock. */
export function hardwareDrawing(
  model: HardwareModel,
  options: HardwareOptions,
  w: number,
  h: number,
  pose: Camera = hardwareCamera(options.view),
  vector = true,
): HardwareDrawing {
  const surfaces: ProjectedSurface[] = [];
  const centres: [number, number][] = [];
  const bounds: [number, number][] = [];
  const cam = { ...pose, cx: 0, cy: 0, scale: 1 };
  const volumes = new Map<number, { lo: number[]; hi: number[] }>();
  model.parts.forEach((part, index) => {
    const offset = index * options.open * 0.5 + (index === options.pick ? (options.lift ?? 0) : 0);
    const all: [number, number][] = [];
    part.surfaces.forEach((s) => {
      if (s.face) {
        const volume = volumes.get(s.solid) ?? {
          lo: [Infinity, Infinity, Infinity],
          hi: [-Infinity, -Infinity, -Infinity],
        };
        for (const point of s.points)
          for (let axis = 0; axis < 3; axis++) {
            volume.lo[axis] = Math.min(volume.lo[axis] ?? Infinity, point[axis] ?? 0);
            volume.hi[axis] = Math.max(volume.hi[axis] ?? -Infinity, point[axis] ?? 0);
          }
        volumes.set(s.solid, volume);
      }
      const projected = s.points.map(([x, y, z]) => projectV(cam, [x, y + offset, z]));
      const points = projected.map((q): [number, number] => [q[0], q[1]]);
      const area = s.face ? polygonArea(points) : 0;
      const top = s.points.every((p) => Math.abs(p[1] - (s.points[0]?.[1] ?? 0)) < 0.00001);
      surfaces.push({
        solid: s.solid,
        points,
        area,
        face: s.face,
        part: index,
        top,
        depth: projected.reduce((sum, p) => sum + p[2], 0) / projected.length,
      });
      all.push(...points);
      bounds.push(...points);
    });
    centres.push([
      all.reduce((sum, p) => sum + p[0], 0) / all.length,
      all.reduce((sum, p) => sum + p[1], 0) / all.length,
    ]);
  });
  const minX = Math.min(...bounds.map((p) => p[0])),
    maxX = Math.max(...bounds.map((p) => p[0]));
  const minY = Math.min(...bounds.map((p) => p[1])),
    maxY = Math.max(...bounds.map((p) => p[1]));
  const scale = Math.min((w * 0.76) / (maxX - minX || 1), (h * 0.76) / (maxY - minY || 1));
  const fit = ([x, y]: readonly number[]): [number, number] => [
    w / 2 + ((x ?? 0) - (minX + maxX) / 2) * scale,
    h / 2 + ((y ?? 0) - (minY + maxY) / 2) * scale,
  ];
  const selected = options.pick < 0 ? model.parts.length - 1 : options.pick;
  const signal = surfaces
    .filter((s) => s.part === selected && s.area > 0)
    .sort((a, b) => b.area - a.area || b.depth - a.depth)[0];
  const nearDepth = Math.max(...surfaces.map((s) => s.depth));
  const farDepth = Math.min(...surfaces.map((s) => s.depth));
  const wire = options.mode === 'wireframe';
  const solids = new Map<number, { total: number; count: number }>();
  for (const surface of surfaces) {
    if (!surface.face) continue;
    const group = solids.get(surface.solid) ?? { total: 0, count: 0 };
    group.total += surface.depth;
    group.count++;
    solids.set(surface.solid, group);
  }
  const depthOf = (s: ProjectedSurface): number => {
    const group = solids.get(s.solid);
    return group ? group.total / group.count : s.depth;
  };
  const order = (a: ProjectedSurface, b: ProjectedSurface): number => {
    if (a.part !== b.part) return a.part - b.part;
    if (a.solid !== b.solid) {
      const va = volumes.get(a.solid),
        vb = volumes.get(b.solid);
      if (
        va &&
        vb &&
        [0, 2].every(
          (axis) =>
            Math.min(va.hi[axis] ?? 0, vb.hi[axis] ?? 0) - Math.max(va.lo[axis] ?? 0, vb.lo[axis] ?? 0) > 0.00001,
        )
      ) {
        if ((va.hi[1] ?? 0) <= (vb.lo[1] ?? 0) + 0.00001) return -1;
        if ((vb.hi[1] ?? 0) <= (va.lo[1] ?? 0) + 0.00001) return 1;
      }
      return depthOf(a) - depthOf(b) || a.solid - b.solid;
    }
    return Number(b.face) - Number(a.face) || a.depth - b.depth;
  };
  const paths = surfaces
    .sort(order)
    .filter((s) => !s.face || s.area > 0.00001 || wire)
    .map((s): HardwarePath => {
      const points = s.points.map(fit);
      const far = s.face && s.area <= 0;
      const near = (s.depth - farDepth) / (nearDepth - farDepth || 1);
      const alpha = far ? 0.1 : s.face ? 0.28 + near * 0.3 : 0.18 + near * 0.18;
      return {
        points,
        part: s.part,
        d: vector ? pathData(points, s.face) : '',
        closed: s.face,
        fill: s.face && !wire ? mix('ground', s.top ? 'panel2' : 'panel', s.top ? 1 : 0.7) : 'none',
        stroke: s === signal ? ink.signal(0.95) : ink.line(alpha),
      };
    });
  return { paths, centres: centres.map(fit) };
}

export function paintHardware(ctx: CanvasRenderingContext2D, drawing: HardwareDrawing): void {
  for (const p of drawing.paths) {
    ctx.beginPath();
    p.points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (p.closed) ctx.closePath();
    if (p.fill !== 'none') {
      ctx.fillStyle = p.fill;
      ctx.fill();
    }
    ctx.strokeStyle = p.stroke;
    ctx.stroke();
  }
}
export function nearestPart(drawing: HardwareDrawing, point: Vec3): number {
  let picked = 0,
    distance = Infinity;
  drawing.centres.forEach(([x, y], i) => {
    const d = Math.hypot(x - point[0], y - point[1]);
    if (d < distance) {
      picked = i;
      distance = d;
    }
  });
  return picked;
}
