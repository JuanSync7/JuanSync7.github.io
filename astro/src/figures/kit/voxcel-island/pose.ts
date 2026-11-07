import { Box3, PerspectiveCamera, Vector3 } from 'three';
import type { FrameInput } from '../../types';
import { frameTerrain } from '../voxel-world/camera-clearance';
import { orbitPhase, orbitState } from '../voxel-world/pose';
import { viewOf } from '../voxel-world/view';
import { solidVolume } from '../voxel-world/volume';
import type { World } from './types';

/** Keep the original island geometry, with the same safe camera controls as the world viewer. */
export function buildIslandPose(world: World) {
  const bounds = new Box3();
  for (const b of world.blocks) bounds.expandByPoint(new Vector3(b.x, b.y, b.z));
  for (const [key, liquid] of world.liquids) {
    const [x = 0, z = 0] = key.split(',').map(Number);
    bounds.expandByPoint(new Vector3(x, liquid.bottom, z));
    bounds.expandByPoint(new Vector3(x, liquid.level + 0.2, z));
  }
  for (const boat of world.boats)
    for (const b of boat.blocks) bounds.expandByPoint(new Vector3(boat.x + b.x, boat.y + b.y, boat.z + b.z));
  bounds.expandByScalar(1);
  return { bounds, volume: solidVolume(world.blocks), orbit: orbitState(), key: '' };
}

export type IslandPose = ReturnType<typeof buildIslandPose>;

export function updateIslandPose(
  camera: PerspectiveCamera,
  pose: IslandPose,
  world: World,
  frame: FrameInput & { w: number; h: number },
): void {
  const view = viewOf(frame.data),
    yaw =
      Math.PI / 4 -
      world.spec.turn -
      view.turn -
      orbitPhase(pose.orbit, frame.t, view.orbit, frame.still) -
      (frame.pointer.x - 0.5) * frame.hover * 0.3;
  const key = `${yaw},${view.pitch},${view.zoom},${view.panX},${view.panY},${frame.w / frame.h}`;
  if (key === pose.key) return;
  const bounds = pose.bounds.clone(),
    shift = new Vector3(
      Math.cos(yaw) * view.panX + Math.sin(yaw) * view.panY,
      0,
      -Math.sin(yaw) * view.panX + Math.cos(yaw) * view.panY,
    ).multiplyScalar(world.spec.radius * 0.8);
  bounds.translate(shift);
  camera.fov = 30;
  camera.near = 0.5;
  camera.far = 500;
  frameTerrain(camera, bounds, yaw, view.pitch, view.zoom, frame.w / frame.h, pose.volume, false);
  camera.updateMatrixWorld();
  pose.key = key;
}
