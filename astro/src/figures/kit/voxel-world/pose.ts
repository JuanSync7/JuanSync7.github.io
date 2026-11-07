import { Box3, Vector3 } from 'three';
import type { World } from './types';
import type { CameraView } from './view';

export interface OrbitState {
  phase: number;
  time: number;
  running: boolean;
}
export const orbitState = (): OrbitState => ({ phase: 0, time: NaN, running: true });

/** Preserve the current azimuth when orbit is paused or resumed. Frozen renders stay reproducible. */
export function orbitPhase(state: OrbitState, t: number, running: boolean, still: boolean): number {
  if (still) state.phase = running ? t * 0.045 : 0;
  else if (!Number.isFinite(state.time)) state.phase = running ? t * 0.045 : 0;
  else if (running && state.running) state.phase += Math.max(0, t - state.time) * 0.045;
  state.time = t;
  state.running = running;
  return state.phase;
}

export function viewBounds(world: World, whole: Box3, view: CameraView, yaw: number): Box3 {
  const point = world.points.find((p) => p.id === view.focus);
  const box = point ? new Box3(new Vector3(...point.min), new Vector3(...point.max)) : whole.clone();
  const center = box.getCenter(new Vector3()),
    size = box.getSize(new Vector3());
  const extent = Math.max(12, size.x, size.z),
    half = new Vector3(Math.max(6, size.x / 2), Math.max(6, size.y / 2), Math.max(6, size.z / 2));
  center.x += (Math.cos(yaw) * view.panX + Math.sin(yaw) * view.panY) * world.spec.radius * 0.8;
  center.z += (-Math.sin(yaw) * view.panX + Math.cos(yaw) * view.panY) * world.spec.radius * 0.8;
  // A close view still has enough room to read its immediate surroundings.
  if (point) half.y = Math.max(half.y, extent * 0.2);
  return box.set(center.clone().sub(half), center.clone().add(half));
}
