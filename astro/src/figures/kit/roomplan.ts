import { tableModel } from './tableframes';
import type { Bounds } from './tableparts';
import type { TableScene } from './tabletop';
import { ROOM_METRICS } from './roommetrics';

export type RoomSide = 'floor' | 'back' | 'left' | 'right';
export interface RoomPlan {
  half: number;
  back: number;
  front: number;
  floor: number;
  top: number;
  variant: number;
  nookZ: number;
  serviceZ: number;
  lampZ: number;
  windowZ: number;
  bounds: Bounds;
}
export function roomPlan(p: TableScene): RoomPlan {
  const table = tableModel(p.theme).bounds;
  const m = ROOM_METRICS[p.theme.id];
  const half = m.half,
    back = table.lo[2] - m.rearGap,
    front = back + m.depth;
  const floor = table.lo[1],
    top = floor + 6.3;
  return {
    half,
    back,
    front,
    floor,
    top,
    variant: p.roomVariant,
    nookZ: back + 6.7,
    serviceZ: back + 5.8,
    lampZ: front - 0.6,
    windowZ: back + 2.3,
    bounds: { lo: [-half - 0.18, floor - 0.18, back - 0.18], hi: [half + 0.18, top + 0.06, front + 0.06] },
  };
}
