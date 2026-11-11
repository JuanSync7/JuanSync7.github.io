import type { Box, Pt } from './sketch';

export type BoardKind = 'qfp' | 'bga' | 'power-stage' | 'inductor' | 'passive' | 'crystal' | 'connector' | 'socket';
export interface BoardPad {
  id: string;
  box: Box;
  point: Pt;
  /** An exact attachment to the corresponding macro boundary port, when used. */
  port?: string;
}
export interface BoardFootprint {
  id: string;
  /** ChipComponent containing this physical footprint; the board is not a free canvas. */
  owner: string;
  kind: BoardKind;
  box: Box;
  body: Box;
  pads: BoardPad[];
  pinOne?: Pt;
}
export interface BoardTrace {
  id: string;
  owner: string;
  from: string;
  to: string;
  points: Pt[];
  net: string;
  layer: 'top' | 'bottom';
  width: number;
  clearance: number;
  /** SMD attachment points where this trace actually changes to bottom copper. */
  vias?: Pt[];
}
export interface BoardCircle {
  id: string;
  owner: string;
  kind: 'mount' | 'via' | 'coil' | 'connector-pin';
  center: Pt;
  innerRadius: number;
  outerRadius: number;
}
export interface BoardRepeat {
  id: string;
  owner: string;
  kind: 'pin-row' | 'bga-grid' | 'phase-bank' | 'passive-bank';
  members: string[];
  axis: 'x' | 'y';
  pitch: number;
  rows?: number;
  columns?: number;
}
export interface BoardLayout {
  variant: 'workstation' | 'embedded' | 'instrument';
  phaseCount: number;
  footprints: BoardFootprint[];
  traces: BoardTrace[];
  circles: BoardCircle[];
  repeats: BoardRepeat[];
}
