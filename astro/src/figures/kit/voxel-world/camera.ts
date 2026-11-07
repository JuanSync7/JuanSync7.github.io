import { Box3, PerspectiveCamera, Vector3 } from 'three';
import type { World } from './types';

export function worldBounds(world: World): Box3 {
  const box = new Box3();
  for (const b of world.blocks) box.expandByPoint(new Vector3(b.x, b.y, b.z));
  for (const boat of world.boats)
    for (const b of boat.blocks) box.expandByPoint(new Vector3(boat.x + b.x, boat.y + b.y, boat.z + b.z));
  return box.expandByScalar(0.8);
}

export function frameWorld(
  camera: PerspectiveCamera,
  bounds: Box3,
  yaw: number,
  pitch: number,
  zoom: number,
  aspect: number,
): void {
  const center = bounds.getCenter(new Vector3()),
    vertical = Math.tan((camera.fov * Math.PI) / 360),
    horizontal = vertical * aspect;
  const outward = new Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
  const right = new Vector3(Math.cos(yaw), 0, -Math.sin(yaw)),
    up = new Vector3().crossVectors(outward, right);
  let distance = 1;
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) {
        const p = new Vector3(x, y, z).sub(center),
          depth = p.dot(outward);
        distance = Math.max(
          distance,
          Math.abs(p.dot(right)) / horizontal + depth,
          Math.abs(p.dot(up)) / vertical + depth,
        );
      }
  camera.aspect = aspect;
  camera.position.copy(center).addScaledVector(outward, (distance * 1.12) / zoom);
  camera.lookAt(center);
  camera.updateProjectionMatrix();
}
