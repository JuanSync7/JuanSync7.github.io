import { TableDraft, finish } from './tableparts';
import type { RoomPart } from './tableroom';
/** Mirror the whole functional plan, including the window and door, around the central table. */
export function mirroredRoom(parts: RoomPart[]): RoomPart[] {
  return parts.map((part) => {
    const q = new TableDraft();
    for (const surface of part.model.surfaces)
      q.parts[0]?.surfaces.push({
        ...surface,
        points: surface.points.map(([x, y, z]): [number, number, number] => [-x, y, z]).reverse(),
      });
    return {
      ...part,
      side: part.side === 'left' ? 'right' : part.side === 'right' ? 'left' : part.side,
      model: finish(q),
    };
  });
}
