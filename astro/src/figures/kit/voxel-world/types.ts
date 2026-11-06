import type { NightKey } from '../../../styles/tokens/palette';

export const BIOMES = ['woodland', 'mushroom', 'snow', 'volcanic', 'oasis', 'village'] as const;
export type Biome = (typeof BIOMES)[number];
export type Material = NightKey;
export interface WorldSpec {
  biome: Biome;
  radius: number;
  stretch: number;
  turn: number;
  density: number;
  anchor: number;
}
export interface Block {
  x: number;
  y: number;
  z: number;
  material: Material;
}
export interface Prop {
  kind: string;
  x: number;
  z: number;
  y: number;
  rx: number;
  rz: number;
  blocks: Block[];
}
export interface Emitter {
  x: number;
  y: number;
  z: number;
  kind: 'smoke' | 'fire' | 'magic';
}
export interface Liquid {
  level: number;
  bottom: number;
  kind: 'water' | 'ice' | 'lava';
}
export interface Landmark {
  kind: string;
  x: number;
  z: number;
  height: number;
}
export interface World {
  spec: WorldSpec;
  heights: Map<string, number>;
  seabed: Map<string, number>;
  liquids: Map<string, Liquid>;
  landmarks: Landmark[];
  boats: Prop[];
  structures: Prop[];
  blocks: Block[];
  props: Prop[];
  emitters: Emitter[];
}
export const cell = (x: number, z: number): string => `${x},${z}`;
export const voxel = (x: number, y: number, z: number): string => `${x},${y},${z}`;
export const THEMES: Record<Biome, { ground: Material; leaf: Material; roof: Material; water: Material }> = {
  woodland: { ground: 'worldMoss', leaf: 'worldLeaf', roof: 'worldClay', water: 'worldWater' },
  mushroom: { ground: 'worldMoss', leaf: 'worldLilac', roof: 'worldLilac', water: 'worldWater' },
  snow: { ground: 'worldSnow', leaf: 'signalLine', roof: 'line4', water: 'worldIce' },
  volcanic: { ground: 'line4', leaf: 'worldClay', roof: 'line2', water: 'worldEmber' },
  oasis: { ground: 'worldSand', leaf: 'worldLeaf', roof: 'worldClay', water: 'worldWater' },
  village: { ground: 'worldMoss', leaf: 'worldLeaf', roof: 'worldClay', water: 'worldWater' },
};
