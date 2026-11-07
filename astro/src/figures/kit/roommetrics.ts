import type { ThemeId } from './tablethemes';

/** Model units use a common human scale: about 2.2 units per metre.
 * The legacy tabletop grammar remains local; only this boundary converts it to furniture. */
export interface RoomMetrics {
  x: number;
  z: number;
  prop: number;
  half: number;
  depth: number;
  rearGap: number;
}
export const ROOM_METRICS: Record<ThemeId, RoomMetrics> = {
  dining: { x: 0.64, z: 0.6, prop: 0.6, half: 5.8, depth: 10.8, rearGap: 2.8 },
  work: { x: 0.5, z: 0.46, prop: 0.46, half: 5.4, depth: 9.6, rearGap: 0 },
  computer: { x: 0.52, z: 0.46, prop: 0.46, half: 5.4, depth: 9.6, rearGap: 0 },
  storage: { x: 0.56, z: 0.45, prop: 0.45, half: 5.8, depth: 10.2, rearGap: 0 },
  messy: { x: 0.52, z: 0.46, prop: 0.46, half: 5.5, depth: 9.8, rearGap: 0 },
  study: { x: 0.5, z: 0.44, prop: 0.44, half: 5.4, depth: 9.6, rearGap: 0 },
  kitchen: { x: 0.76, z: 0.44, prop: 0.44, half: 5.7, depth: 10.2, rearGap: 0 },
  bar: { x: 0.68, z: 0.62, prop: 0.58, half: 5.8, depth: 10.2, rearGap: 0 },
  lab: { x: 0.72, z: 0.47, prop: 0.47, half: 6.0, depth: 10.6, rearGap: 0 },
};

export const ROOM_NAMES: Record<ThemeId, string> = {
  dining: 'Dining room',
  work: 'Home office',
  computer: 'Gaming and computer room',
  storage: 'Stock and packing room',
  messy: 'Creative workshop',
  study: 'Reading and study room',
  kitchen: 'Kitchen',
  bar: 'Cocktail lounge',
  lab: 'Research laboratory',
};
