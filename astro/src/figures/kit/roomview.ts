import { camera, project, type Camera, type Vec3 } from './camera';
import { corners } from './tableparts';
import { roomPlan, type RoomSide } from './roomplan';
import type { TableScene } from './tabletop';

export interface RoomControls {
  angle: number;
  view: 'eye' | 'isometric';
  zoom: number;
}
export interface RoomView {
  position: Vec3;
  target: Vec3;
  projection: Camera;
  height: number;
  controls: RoomControls;
}
export function roomControls(data: unknown): RoomControls {
  const controls: RoomControls = { angle: 0, view: 'eye', zoom: 1 };
  if (typeof data !== 'object' || data === null) return controls;
  if ('angle' in data && typeof data.angle === 'number' && Number.isFinite(data.angle))
    controls.angle = Math.max(-90, Math.min(90, data.angle));
  if ('view' in data && data.view === 'isometric') controls.view = 'isometric';
  if ('zoom' in data && typeof data.zoom === 'number' && Number.isFinite(data.zoom))
    controls.zoom = Math.max(0.8, Math.min(1.6, data.zoom));
  return controls;
}
export function roomView(p: TableScene, w: number, h: number, data?: unknown): RoomView {
  const r = roomPlan(p),
    controls = roomControls(data),
    yaw = (controls.angle * Math.PI) / 180;
  const target: Vec3 = [0, (r.floor + r.top) / 2, (r.back + r.front) / 2];
  let dist = 16,
    pitch = 0,
    height = 1;
  const aspect = w / h,
    points = corners(r.bounds);
  if (controls.view === 'isometric') {
    pitch = Math.atan(1 / Math.sqrt(2));
    const parallel = camera({ cx: 0, cy: 0, scale: 1, dist: Infinity, yaw, pitch });
    const projected = points.map((q) => project(parallel, q[0], q[1] - target[1], q[2] - target[2]));
    height =
      Math.max(...projected.map((q) => Math.max(Math.abs(q[1]) / 0.44, Math.abs(q[0]) / (aspect * 0.45)))) /
      controls.zoom;
    dist = 32;
  } else {
    for (; dist < 55; dist += 0.25) {
      pitch = Math.asin((p.eye - target[1]) / dist);
      const view = camera({
        cx: aspect / 2,
        cy: 0.5,
        yaw,
        pitch,
        dist,
        scale: 1 / (2 * Math.tan(Math.PI / 12) * dist),
      });
      const fits = points.every((q) => {
        const at = project(view, q[0], q[1] - target[1], q[2] - target[2]);
        return at[0] > aspect * 0.05 && at[0] < aspect * 0.95 && at[1] > 0.06 && at[1] < 0.94;
      });
      if (fits) break;
    }
    dist /= controls.zoom;
    pitch = Math.asin((p.eye - target[1]) / dist);
    height = 2 * Math.tan(Math.PI / 12) * dist;
  }
  const projection = camera({
    cx: w / 2,
    cy: h / 2,
    yaw,
    pitch,
    dist: controls.view === 'isometric' ? Infinity : dist,
    scale: h / height,
  });
  return {
    position: [
      Math.sin(yaw) * Math.cos(pitch) * dist,
      target[1] + Math.sin(pitch) * dist,
      target[2] + Math.cos(yaw) * Math.cos(pitch) * dist,
    ],
    target,
    projection,
    height,
    controls,
  };
}
export function roomProject(v: RoomView, point: Vec3) {
  return project(v.projection, point[0] - v.target[0], point[1] - v.target[1], point[2] - v.target[2]);
}
export function roomVisible(p: TableScene, side: RoomSide, v: RoomView): boolean {
  const r = roomPlan(p);
  if (side === 'left') return v.position[0] >= -r.half;
  if (side === 'right') return v.position[0] <= r.half;
  return true;
}
