import { tableModel } from './tableframes';
import type { Bounds } from './tableparts';
import type { TableScene } from './tabletop';
import { ROOM_METRICS } from './roommetrics';

export type RoomSide = 'floor' | 'ceiling' | 'back' | 'left' | 'right';
export interface RoomPlan {
  half: number;
  back: number;
  front: number;
  floor: number;
  top: number;
  variant: number;
  mirror: number;
  nookZ: number;
  serviceZ: number;
  cookZ: number;
  lampZ: number;
  windowZ: number;
  bounds: Bounds;
}
export function roomPlan(p: TableScene): RoomPlan {
  const table = tableModel(p.theme, p.furnitureVariant).bounds;
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
    mirror: p.layoutVariant === 1 ? -1 : 1,
    nookZ: back + 6.7 + (p.layoutVariant === 2 ? 0.25 : 0),
    serviceZ: back + 5.8 + (p.layoutVariant === 2 ? 0.3 : 0),
    cookZ: back + 7.03,
    lampZ: front - 0.6,
    windowZ: back + 2.3,
    bounds: { lo: [-half - 0.18, floor - 0.18, back - 0.18], hi: [half + 0.18, top + 0.18, front + 0.06] },
  };
}
