import policy from './policy.json';
import { mulberry32, type Rng } from '../rng';

/** Stream identities are stable names, never offsets in a shared random sequence. */
export function seedFor(seed: number, stage: string): number {
  let hash = (seed >>> 0) ^ 2166136261;
  for (let i = 0; i < stage.length; i++) hash = Math.imul(hash ^ stage.charCodeAt(i), 16777619);
  return hash >>> 0;
}
export const stream = (seed: number, stage: string): Rng =>
  mulberry32(seedFor(seed, `voxel/${policy.version}/${stage}`));
export const integer = (rng: Rng, min: number, max: number): number => min + Math.floor(rng() * (max - min + 1));
export function choose<T>(rng: Rng, values: readonly T[]): T {
  const value = values[Math.floor(rng() * values.length)];
  if (value === undefined) throw new Error('Cannot choose from an empty catalog');
  return value;
}
