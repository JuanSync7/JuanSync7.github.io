import { noise2 } from '../noise';
import { stream } from './seeds';
import type { Biome, WorldSpec } from './types';

export function climate(spec: WorldSpec) {
  const rng = stream(spec.layoutSeed, 'climate'),
    noise = noise2(rng);
  const angle = rng() * Math.PI * 2,
    offset = (rng() - 0.5) * spec.radius * 0.35;
  function weight(x: number, z: number): number {
    if (!spec.secondary) return 0;
    const distance = x * Math.cos(angle) + z * Math.sin(angle) - offset + noise(x * 0.06, z * 0.06) * spec.radius * 0.3;
    const t = Math.max(0, Math.min(1, 0.5 + distance / (spec.radius * 0.65)));
    return t * t * (3 - 2 * t);
  }
  const biomeAt = (x: number, z: number): Biome =>
    weight(x, z) >= 0.5 && spec.secondary ? spec.secondary : spec.biome;
  return { weight, biomeAt };
}
