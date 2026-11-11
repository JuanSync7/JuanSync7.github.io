import type { Box, Pt } from './sketch';

export interface ChipContactField {
  id: string;
  owner: string;
  kind: 'microbump' | 'tsv' | 'c4';
  /** This is an exposed base/cutaway patch, not an opaque die's full hidden underside. */
  box: Box;
  origin: Pt;
  pitch: Pt;
  rows: number;
  cols: number;
  radius: number;
  sites: { row: number; col: number; point: Pt }[];
}

export interface ChipPackagingLayout {
  variant: 'single-logic' | 'paired-logic' | 'chiplet-io';
  layers: { id: string; kind: 'substrate' | 'interposer' | 'underfill'; bounds: Box; owner?: string }[];
  bumpFields: ChipContactField[];
  stacks: { owner: string; dieCount: number; base: Box; top: Box; section: Box; tsvField: string }[];
  fineLinks: {
    id: string;
    owner: string;
    fromPort: string;
    toField: string;
    toSite: { row: number; col: number };
    points: Pt[];
  }[];
}

export interface ChipDieLayout {
  variant: 'six-core' | 'four-core' | 'paired-columns';
  coreIds: string[];
  selectedId: string;
  /** Units repeat on the declared physical pitch; mirrored columns face their shared channels. */
  groups: { ids: string[]; pitch: Pt; tile: Pt; mirrorX: boolean }[];
}
