import { cell, type World } from './types';

/** Shared displacement keeps water, foam and moored boats on the same swell. */
export function swell(x: number, z: number, time: number): number {
  return Math.sin(x * 0.28 + z * 0.19 - time * 1.4) * 0.11 + Math.sin(z * 0.45 - time * 1.8) * 0.04;
}
export function boatClearance(world: World, x: number, z: number): boolean {
  if (world.structures.some((s) => Math.abs(s.x - x) <= s.rx + 1 && Math.abs(s.z - z) <= s.rz + 1)) return false;
  return !world.boats.some((b) => Math.abs(b.x - x) <= b.rx + 1 && Math.abs(b.z - z) <= b.rz + 1);
}
export function shoreCell(world: World, x: number, z: number): boolean {
  return [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ].some(([dx = 0, dz = 0]) => world.heights.has(cell(x + dx, z + dz)));
}
