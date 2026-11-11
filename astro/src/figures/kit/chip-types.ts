import type { Box, Pt } from './sketch';
import type { GateContact, GateLayout, GateTerminal, GateWire } from './gates';
import type { MatchedFingers } from './analog';
import type { BoardLayout } from './chip-board-types';
import type { ChipDieLayout, ChipPackagingLayout } from './chip-package-types';

export type ChipSide = 'n' | 'e' | 's' | 'w';
export interface ChipPort {
  id: string;
  point: Pt;
  side: ChipSide;
}
export interface ChipComponent {
  id: string;
  kind: string;
  box: Box;
  ports: ChipPort[];
  selected: boolean;
  parent?: string;
  side?: ChipSide;
  pinGroups?: string[][];
}
export interface ChipNet {
  id: string;
  from: string;
  to: string;
  points: Pt[];
  layer: 'metal-hv' | 'bond-wire';
  signal: string;
  vias: Pt[];
}
export interface ChipPlan {
  type: 'chip';
  level: string;
  era: string;
  components: ChipComponent[];
  nets: ChipNet[];
  boundary: Box;
  unitCount: number;
  lanes: number;
  cacheBanks: number;
  driveStrength: number;
  gates?: GateLayout[];
  supplyWires?: GateWire[];
  supplyContacts?: GateContact[];
  supplyPins?: GateTerminal[];
  matches?: MatchedFingers[];
  childPadMap?: { childId: string; parentId: string; side: ChipSide }[];
  board?: BoardLayout;
  package?: ChipPackagingLayout;
  dieLayout?: ChipDieLayout;
  /** Board terminals reserved before routing, including later connections. */
  routePorts?: string[];
}
