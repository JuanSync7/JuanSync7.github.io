import type { Gate } from './gates';
import type { Box, Pt } from './sketch';

export type GateLayer = 'poly' | 'm1' | 'm2';
export interface GateWire {
  net: string;
  layer: GateLayer;
  points: Pt[];
}
export interface GateContact {
  net: string;
  point: Pt;
  layers: GateLayer[];
  size: number;
}
export interface GateTerminal {
  net: string;
  point: Pt;
  layer: GateLayer;
}
export interface GateFet {
  type: 'p' | 'n' | 'd';
  input: number;
  control: string;
  left: GateTerminal;
  right: GateTerminal;
  gate: Pt;
}
export interface GateLayout {
  gate: Gate;
  bounds: Box;
  fets: GateFet[];
  strips: Box[];
  wires: GateWire[];
  contacts: GateContact[];
  pins: GateTerminal[];
}
