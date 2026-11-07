import type { Recipe } from './types';

/** The approach starts outside the complete rotated shape, including stairs and eaves. */
export function entrance(r: Recipe, rx: number, rz: number): [number, number] {
  return r.turn === 0 ? [0, rz + 1] : r.turn === 1 ? [-rx - 1, 0] : r.turn === 2 ? [0, -rz - 1] : [rx + 1, 0];
}
