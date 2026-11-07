import type { Box, Pt } from './sketch';

export interface MapRoad {
  id: string;
  points: Pt[];
  width: number;
  bridge: boolean;
}
export interface MapBuilding {
  bounds: Box;
  entry: Pt;
  access: Pt[];
  kind: 'terrace' | 'court' | 'slab' | 'house';
}
export interface MapBlock {
  bounds: Box;
  kind: 'selected' | 'residential' | 'courtyard' | 'park' | 'civic';
  buildings: MapBuilding[];
}
export interface MapRiver {
  banks: [Pt[], Pt[]];
  corridor: Box;
}
export interface UrbanPlan {
  kind: 'city' | 'district';
  selected: Box;
  roads: MapRoad[];
  intersections: Pt[];
  blocks: MapBlock[];
  river: MapRiver | null;
}
export interface Contour {
  elevation: number;
  points: Pt[];
}
export interface RegionTown {
  bounds: Box;
  entry: Pt;
  streets: Pt[][];
  buildings: Box[];
}
export interface RegionPlan {
  kind: 'region';
  selected: Box;
  contours: Contour[];
  coast: Pt[][];
  river: MapRiver;
  towns: RegionTown[];
  roads: MapRoad[];
  railway: MapRoad;
  station: { platform: Pt[]; access: Pt[] };
  elevation: (x: number, y: number) => number;
  landDirection: number;
}
