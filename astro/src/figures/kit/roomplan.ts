import { tableModel } from './tableframes';
import type { Bounds } from './tableparts';
import type { TableScene } from './tabletop';

export type RoomSide = 'floor' | 'back' | 'left' | 'right';
export interface RoomPlan {
  half: number;
  back: number;
  front: number;
  floor: number;
  top: number;
  variant: number;
  bounds: Bounds;
}
export function roomPlan(p: TableScene): RoomPlan {
  const table = tableModel(p.theme).bounds;
  const half = p.theme.w / 2 + 1.25,
    back = table.lo[2],
    front = p.theme.d / 2 + 2.3;
  const floor = table.lo[1],
    top = 3.8;
  return {
    half,
    back,
    front,
    floor,
    top,
    variant: p.roomVariant,
    bounds: { lo: [-half - 0.18, floor - 0.18, back - 0.18], hi: [half + 0.18, top + 0.06, front + 0.06] },
  };
}
