import type { Biome, Material } from './types';

export type Substrate = 'soil' | 'sand' | 'rock' | 'snow' | 'ice' | 'ash' | 'built';
export interface Environment {
  moisture: number;
  patch: number;
  slope: number;
  waterDistance: number;
  shade: number;
  substrate: Substrate;
}
export interface PlacementAnchor {
  parent: string;
  x: number;
  z: number;
  radius: number;
  minimum: number;
}
export interface InterestPoint {
  id: string;
  label: string;
  biome: Biome;
  category: 'landscape' | 'habitat' | 'place';
  center: [number, number, number];
  min: [number, number, number];
  max: [number, number, number];
  members: string[];
}
export interface PlaceGroup {
  id: string;
  label: string;
  biome: Biome;
  parent: string;
  expected: string[];
  radius: number;
}
export interface WorldInfo {
  layoutSeed: number;
  points: InterestPoint[];
  objects: number;
  terrainArea: number;
}
export interface EcologyMaps {
  environment: Map<string, Environment>;
  surface: Map<string, Material>;
}
