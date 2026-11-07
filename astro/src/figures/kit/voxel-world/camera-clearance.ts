import { Box3, PerspectiveCamera, Ray, Vector3 } from 'three';
import { frameWorld } from './camera';
import type { solidVolume } from './volume';

type Solidity = ReturnType<typeof solidVolume>;
const offsets = [
  [0, 0, 0],
  [0.65, 0, 0],
  [-0.65, 0, 0],
  [0, 0.65, 0],
  [0, -0.65, 0],
  [0, 0, 0.65],
  [0, 0, -0.65],
];

function eyeBlocked(camera: PerspectiveCamera, volume: Solidity): boolean {
  return offsets.some(([x = 0, y = 0, z = 0]) =>
    volume.solid(
      Math.round(camera.position.x + x),
      Math.round(camera.position.y + y),
      Math.round(camera.position.z + z),
    ),
  );
}

/** Only test foreground outside the destination: the place's own geometry is its subject. */
function rayBlocked(camera: PerspectiveCamera, bounds: Box3, volume: Solidity, center: Vector3): boolean {
  const direction = camera.position.clone().sub(center).normalize();
  const exit = new Ray(center, direction).intersectBox(bounds, new Vector3());
  if (!exit) return false;
  const distance = center.distanceTo(camera.position),
    start = center.distanceTo(exit) + 0.8;
  if (start >= distance) return false;
  const point = center.clone().addScaledVector(direction, start),
    cell = point.toArray().map((value) => Math.floor(value + 0.5)),
    steps = direction.toArray().map(Math.sign),
    deltas = direction.toArray().map((value) => (value === 0 ? Infinity : Math.abs(1 / value))),
    next = direction
      .toArray()
      .map((value, i) =>
        value === 0 ? Infinity : ((cell[i] ?? 0) + (steps[i] ?? 0) * 0.5 - point.getComponent(i)) / value,
      );
  // Exact voxel traversal: fixed-distance samples can miss a grazing foreground corner.
  for (let visited = 0; visited < 2048; visited++) {
    if (volume.solid(cell[0] ?? 0, cell[1] ?? 0, cell[2] ?? 0)) return true;
    const crossing = Math.min(...next);
    if (crossing > distance - start) return false;
    for (let i = 0; i < 3; i++)
      if ((next[i] ?? Infinity) <= crossing + 1e-10) {
        cell[i] = (cell[i] ?? 0) + (steps[i] ?? 0);
        next[i] = (next[i] ?? Infinity) + (deltas[i] ?? Infinity);
      }
  }
  throw new Error('VXL-CAMERA: ray traversal exceeded finite world budget');
}

/** Preserve yaw; lift a focused view over foreground terrain before retreating from solid geometry. */
export function frameTerrain(
  camera: PerspectiveCamera,
  bounds: Box3,
  yaw: number,
  pitch: number,
  zoom: number,
  aspect: number,
  volume: Solidity,
  focused: boolean,
): void {
  frameWorld(camera, bounds, yaw, pitch, zoom, aspect);
  if (focused) {
    const targets = [bounds.getCenter(new Vector3())];
    // A clear center ray can still leave most of a place behind a foreground peak.
    for (const x of [0.15, 0.85])
      for (const y of [0.3, 0.7])
        for (const z of [0.15, 0.85])
          targets.push(
            new Vector3(
              bounds.min.x + (bounds.max.x - bounds.min.x) * x,
              bounds.min.y + (bounds.max.y - bounds.min.y) * y,
              bounds.min.z + (bounds.max.z - bounds.min.z) * z,
            ),
          );
    const score = (): number =>
      eyeBlocked(camera, volume)
        ? 1000
        : targets.reduce((sum, target) => sum + Number(rayBlocked(camera, bounds, volume, target)), 0);
    let bestScore = score(),
      bestPitch = pitch;
    for (let lift = pitch + 0.12; bestScore > 0 && lift <= 1.45; lift += 0.12) {
      frameWorld(camera, bounds, yaw, lift, zoom, aspect);
      const candidate = score();
      if (candidate < bestScore) {
        bestScore = candidate;
        bestPitch = lift;
      }
      if (candidate > 0) continue;
      let lower = lift - 0.12,
        upper = lift;
      // Refine the first clear angle so slow orbit does not jump in seven-degree steps.
      for (let i = 0; i < 6; i++) {
        const middle = (lower + upper) / 2;
        frameWorld(camera, bounds, yaw, middle, zoom, aspect);
        if (score() > 0) lower = middle;
        else upper = middle;
      }
      bestPitch = upper;
      break;
    }
    // A roof can hide every option; prefer the requested angle on equal scores.
    frameWorld(camera, bounds, yaw, bestPitch, zoom, aspect);
  }
  if (!eyeBlocked(camera, volume)) return;
  const center = bounds.getCenter(new Vector3()),
    direction = camera.position.clone().sub(center).normalize();
  // A user can turn behind a cave wall. Keep the eye outside it without inventing a new yaw.
  for (let attempt = 0; eyeBlocked(camera, volume) && attempt < 256; attempt++)
    camera.position.addScaledVector(direction, 1);
  camera.lookAt(center);
}
