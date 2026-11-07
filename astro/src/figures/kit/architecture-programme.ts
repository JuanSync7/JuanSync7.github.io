import { PIECES } from './furniture';
import { Layout } from './layout';
import { Piece } from './piece';
import { inset, type Box, type Pt, type Sketch } from './sketch';
import type { ArchitecturePlan, PlanRoom } from './architecture-plan';

export interface MeetingIsland {
  center: Pt;
  seats: number;
  bounds: Box;
  tabletop: Box;
}

export interface MeetingWingProgramme {
  bounds: Box;
  aisles: Box[];
  islands: MeetingIsland[];
  screen: Box;
  unitsPerMeter: number;
}

/** A large wing is a collaborative training room, with repeated table groups and
 * circulation, rather than a single conference table stranded in an enormous bay. */
export function planMeetingWing(room: PlanRoom, model: ArchitecturePlan): MeetingWingProgramme {
  const m = model.unitsPerMeter;
  const bounds = inset(room.bounds, 0.5 * m);
  const [x0, y0, x1, y1] = bounds;
  const cy = (y0 + y1) / 2;
  // The side lane takes the full entrance width and serves the cross aisle. A chair
  // can never close the only route from a table group back to the corridor.
  const laneEnd = Math.min(x1, Math.max(x0 + 1.5 * m, room.door.hinge[0] + room.door.width + 0.9 * m));
  const aisles: Box[] = [
    [x0, y0, laneEnd, y1],
    [x0, cy - 0.75 * m, x1, cy + 0.75 * m],
  ];
  const left = laneEnd + 0.6 * m;
  const right = x1 - 0.6 * m;
  const width = right - left;
  const cols = Math.max(0, Math.min(4, Math.floor(width / (3.12 * m))));
  const islands: MeetingIsland[] = [];
  for (const [top, bottom] of [
    [y0 + 0.6 * m, cy - 0.75 * m],
    [cy + 0.75 * m, y1 - 0.6 * m],
  ]) {
    const height = bottom - top;
    const rows = Math.max(0, Math.min(3, Math.floor(height / (3.04 * m))));
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < cols; col++) {
        const [x, y] = [left + ((col + 0.5) * width) / cols, top + ((row + 0.5) * height) / rows];
        islands.push({
          center: [x, y],
          seats: 6,
          bounds: [x - 0.96 * m, y - 0.92 * m, x + 0.96 * m, y + 0.92 * m],
          tabletop: [x - 0.96 * m, y - 0.45 * m, x + 0.96 * m, y + 0.45 * m],
        });
      }
  }
  const cx = (left + right) / 2;
  const far = room.door.inward > 0 ? y1 - 0.14 * m : y0 + 0.14 * m;
  const half = Math.max(0, Math.min(1.2 * m, width / 3));
  return {
    bounds,
    aisles,
    islands,
    screen: [cx - half, far - 0.04 * m, cx + half, far + 0.04 * m],
    unitsPerMeter: m,
  };
}

export function furnishMeetingWing(S: Sketch, room: PlanRoom, model: ArchitecturePlan): Layout {
  const programme = planMeetingWing(room, model);
  const L = new Layout(S, programme.bounds, [room.door.clearance, ...programme.aisles]);
  for (const island of programme.islands)
    L.put((B) => PIECES.table(new Piece(B, ...island.center, 0, model.unitsPerMeter, true), island.seats));
  if (programme.screen[2] > programme.screen[0]) L.put((B) => B.rect(programme.screen, 1), false);
  return L;
}
