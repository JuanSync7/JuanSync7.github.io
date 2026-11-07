import { TableDraft, finish } from './tableparts';
import type { RoomPart } from './tableroom';
import type { RoomSide } from './roomplan';

export interface RoomPose {
  x: number;
  y: number;
  z: number;
  turn?: number;
  scale?: number;
}
/** One owned model, transformed once. Geometry bounds are measured after the transform. */
export function placedRoomPart(
  label: string,
  side: RoomSide,
  mount: 'floor' | 'wall',
  build: (q: TableDraft) => void,
  pose: RoomPose,
  support = false,
): RoomPart {
  const q = new TableDraft();
  build(q);
  const c = Math.cos(pose.turn ?? 0),
    s = Math.sin(pose.turn ?? 0),
    k = pose.scale ?? 1;
  for (const surface of q.parts[0]?.surfaces ?? [])
    surface.points = surface.points.map(([x, y, z]) => [
      pose.x + k * (x * c + z * s),
      pose.y + k * y,
      pose.z + k * (-x * s + z * c),
    ]);
  return { label, side, mount, interactive: true, support, model: finish(q) };
}
