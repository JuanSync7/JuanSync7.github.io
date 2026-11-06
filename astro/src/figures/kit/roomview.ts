import { camera, project, type Camera, type Vec3 } from './camera';
import { corners } from './tableparts';
import { roomPlan, type RoomSide } from './roomplan';
import { tabletop, type TableScene } from './tabletop';
import { roomModels } from './tableroom';

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
  fov: number;
  offset: readonly [number, number];
  controls: RoomControls;
}
export function roomControls(data: unknown): RoomControls {
  const controls: RoomControls = { angle: 90, view: 'eye', zoom: 1 };
  if (typeof data !== 'object' || data === null) return controls;
  if ('angle' in data && typeof data.angle === 'number' && Number.isFinite(data.angle))
    controls.angle = Math.max(0, Math.min(180, data.angle));
  if ('view' in data && data.view === 'isometric') controls.view = 'isometric';
  if ('zoom' in data && typeof data.zoom === 'number' && Number.isFinite(data.zoom))
    controls.zoom = Math.max(0.8, Math.min(1.6, data.zoom));
  return controls;
}
export function roomView(p: TableScene, w: number, h: number, data?: unknown): RoomView {
  const r = roomPlan(p),
    controls = roomControls(data),
    arc = ((controls.angle - 90) * Math.PI) / 180;
  const target: Vec3 = controls.view === 'isometric' ? [0, (r.floor + r.top) / 2, r.front] : [0, 0.45, 0.3];
  // The semicircle belongs to the entrance, so its ends meet the side-wall starts.
  const x = Math.sin(arc) * r.half,
    z = r.front + Math.cos(arc) * r.half;
  const horizontal = Math.hypot(x, z - target[2]),
    yaw = Math.atan2(x, z - target[2]);
  const pitch = controls.view === 'isometric' ? Math.atan(1 / Math.sqrt(2)) : Math.atan2(p.eye - target[1], horizontal);
  const dist = horizontal / Math.cos(pitch),
    aspect = w / h;
  let height: number;
  let offset: [number, number] = [0, 0];
  if (controls.view === 'isometric') {
    const parallel = camera({ cx: 0, cy: 0, scale: 1, dist: Infinity, yaw, pitch });
    const points = corners(r.bounds).map((q) => project(parallel, q[0], q[1] - target[1], q[2] - target[2]));
    const xs = points.map((q) => q[0]),
      ys = points.map((q) => -q[1]);
    offset = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
    height = Math.max((Math.max(...ys) - Math.min(...ys)) / 0.9, (Math.max(...xs) - Math.min(...xs)) / (aspect * 0.92));
  } else {
    const view = camera({ cx: 0, cy: 0, scale: 1, dist, yaw, pitch });
    const bounds = [
      tabletop(p).bounds,
      ...p.items.map((it) => it.bounds),
      ...roomModels(p)
        .filter((s) => s.mount === 'floor' && visibleSide(controls, s.side, s.mount))
        .map((s) => s.model.bounds),
      { lo: [-r.half, r.floor, r.back] as Vec3, hi: [r.half, r.top, r.back + 0.6] as Vec3 },
    ];
    const points = bounds.flatMap(corners).map((q) => project(view, q[0], q[1] - target[1], q[2] - target[2]));
    height = Math.max(
      2 * Math.tan(Math.PI / 8) * dist,
      ...points.map((q) => Math.max(Math.abs(q[1]) / 0.43, Math.abs(q[0]) / (aspect * 0.44))),
    );
  }
  height /= controls.zoom;
  const projection = camera({
    cx: w / 2 - (offset[0] * h) / height,
    cy: h / 2 + (offset[1] * h) / height,
    yaw,
    pitch,
    dist: controls.view === 'isometric' ? Infinity : dist,
    scale: h / height,
  });
  return {
    position: [x, target[1] + Math.tan(pitch) * horizontal, z],
    target,
    projection,
    height,
    offset,
    fov: (2 * Math.atan(height / (2 * dist)) * 180) / Math.PI,
    controls,
  };
}
export function roomProject(v: RoomView, point: Vec3) {
  return project(v.projection, point[0] - v.target[0], point[1] - v.target[1], point[2] - v.target[2]);
}
function visibleSide(controls: RoomControls, side: RoomSide, mount?: 'floor' | 'wall'): boolean {
  const cut = controls.view === 'isometric' && mount !== 'floor' ? 85 : 35;
  if (side === 'left') return controls.angle > cut;
  if (side === 'right') return controls.angle < 180 - cut;
  return true;
}
export function roomVisible(_p: TableScene, side: RoomSide, v: RoomView, mount?: 'floor' | 'wall'): boolean {
  return visibleSide(v.controls, side, mount);
}
