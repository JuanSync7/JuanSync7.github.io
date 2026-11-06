import type { NightKey } from '../../../styles/tokens/palette';

export const BIOMES = [
  'woodland',
  'mushroom',
  'snow',
  'volcanic',
  'oasis',
  'village',
  'rainforest',
  'tundra',
  'desert',
  'plains',
  'frozen',
  'wasteland',
  'city',
  'caves',
] as const;
export type Biome = (typeof BIOMES)[number];
export const LANDFORMS = [
  'island',
  'archipelago',
  'slice',
  'valley',
  'dunes',
  'alps',
  'canyon',
  'caldera',
  'cavern',
] as const;
export type Landform = (typeof LANDFORMS)[number];
export type Material = NightKey;
export interface WorldSpec {
  version: 2;
  layoutSeed: number;
  biome: Biome;
  secondary: Biome | null;
  landform: Landform;
  radius: number;
  stretch: number;
  turn: number;
  density: number;
  relief: number;
  settlementCount: number;
  boatCount: number;
  daylight: 'dawn' | 'noon' | 'sunset';
  sunAngle: number;
  cameraPitch: number;
  wet: boolean;
}
export interface Block {
  x: number;
  y: number;
  z: number;
  material: Material;
}
export interface Recipe {
  id: string;
  seed: number;
  kind: string;
  biome: Biome;
  width: number;
  depth: number;
  height: number;
  variant: number;
  turn: number;
  priority: number;
}
export interface Prop {
  kind: string;
  x: number;
  z: number;
  y: number;
  rx: number;
  rz: number;
  blocks: Block[];
  recipe: Recipe;
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
export interface GenerationReport {
  planned: Record<string, number>;
  placed: Record<string, number>;
  rejected: Record<string, number>;
  omitted: string[];
  attempts: number;
}
export interface World {
  spec: WorldSpec;
  heights: Map<string, number>;
  bottoms: Map<string, number>;
  biomes: Map<string, Biome>;
  ceilings: Map<string, number>;
  roofs: Map<string, number>;
  seabed: Map<string, number>;
  liquids: Map<string, Liquid>;
  landmarks: Landmark[];
  boats: Prop[];
  structures: Prop[];
  blocks: Block[];
  props: Prop[];
  paths: Set<string>;
  emitters: Emitter[];
  report: GenerationReport;
}
export const cell = (x: number, z: number): string => `${x},${z}`;
export const voxel = (x: number, y: number, z: number): string => `${x},${y},${z}`;
export const COLD = new Set<Biome>(['snow', 'tundra', 'frozen']);
export const BUILDINGS = new Set(['cottage', 'tower', 'hut', 'tent', 'ruin']);
export const TREES = new Set(['tree', 'pine', 'palm', 'jungle tree', 'dead tree', 'birch', 'willow', 'bamboo']);
export interface Theme {
  ground: Material;
  leaf: Material;
  roof: Material;
  water: Material;
}
export const THEMES: Record<Biome, Theme> = {
  woodland: { ground: 'worldMoss', leaf: 'worldLeaf', roof: 'worldClay', water: 'worldWater' },
  mushroom: { ground: 'worldMoss', leaf: 'worldLilac', roof: 'worldLilac', water: 'worldWater' },
  snow: { ground: 'worldSnow', leaf: 'signalLine', roof: 'line4', water: 'worldIce' },
  volcanic: { ground: 'line4', leaf: 'worldClay', roof: 'line2', water: 'worldEmber' },
  oasis: { ground: 'worldSand', leaf: 'worldLeaf', roof: 'worldClay', water: 'worldWater' },
  village: { ground: 'worldMoss', leaf: 'worldLeaf', roof: 'worldClay', water: 'worldWater' },
  rainforest: { ground: 'worldMoss', leaf: 'worldLeaf', roof: 'worldWood', water: 'worldWater' },
  tundra: { ground: 'worldMoss', leaf: 'worldMoss', roof: 'worldWood', water: 'worldIce' },
  desert: { ground: 'worldSand', leaf: 'worldMoss', roof: 'worldSand', water: 'worldWater' },
  plains: { ground: 'worldMoss', leaf: 'worldLeaf', roof: 'worldClay', water: 'worldWater' },
  frozen: { ground: 'worldSnow', leaf: 'worldIce', roof: 'worldStone', water: 'worldIce' },
  wasteland: { ground: 'worldEarth', leaf: 'worldWood', roof: 'line4', water: 'worldWater' },
  city: { ground: 'worldMoss', leaf: 'worldLeaf', roof: 'line4', water: 'worldWater' },
  caves: { ground: 'worldStone', leaf: 'worldLilac', roof: 'line3', water: 'worldWater' },
};
