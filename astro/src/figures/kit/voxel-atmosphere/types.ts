import type { NightKey } from '../../../styles/tokens/palette';
import type { AtmosphereSpec } from './profile';
export interface AtmosphereBlock {
  x: number;
  y: number;
  z: number;
  material: NightKey;
}
export interface AtmosphereWorld {
  spec: AtmosphereSpec;
  heights: Map<string, number>;
  blocks: AtmosphereBlock[];
  props: { kind: string; x: number; y: number; z: number; blocks: AtmosphereBlock[] }[];
  emitters: { x: number; y: number; z: number; kind: string }[];
  landmarks: { kind: string; x: number; z: number; height: number }[];
}
