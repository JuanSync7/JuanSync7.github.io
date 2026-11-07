import { BIOMES, type Biome, type WorldSpec } from './types';
import { HABITATS } from './catalog';
import policy from './policy.json';
import { choose, integer, stream } from './seeds';

export function planWorld(seed: number, biomeOverride?: Biome): WorldSpec {
  if (!Number.isInteger(seed) || seed < 0 || seed > 999_999_999)
    throw new Error('Seed must be an integer from 0 to 999999999');
  const rng = stream(seed, 'plan'),
    settlement = stream(seed, 'settlement'),
    ambience = stream(seed, 'ambience');
  const biome = biomeOverride ?? choose(rng, BIOMES);
  const habitat = HABITATS[biome];
  const secondary = rng() < 0.67 ? choose(rng, habitat.neighbours) : null;
  const landform = choose(rng, habitat.forms);
  const settlementCount =
    biome === 'city'
      ? integer(settlement, 12, 28)
      : biome === 'village'
        ? integer(settlement, 2, 7)
        : settlement() < 0.6 || biome === 'frozen' || biome === 'caves'
          ? 0
          : integer(settlement, 1, 4);
  return {
    version: 3,
    layoutSeed: seed >>> 0,
    biome,
    secondary,
    landform,
    radius: integer(rng, policy.radiusMin, policy.radiusMax),
    stretch: 0.75 + rng() * 0.42,
    turn: (rng() - 0.5) * 1.1,
    density: 0.6 + rng() * 0.4,
    relief: 0.75 + rng() * 0.5,
    settlementCount,
    boatCount: integer(stream(seed, 'boats/count'), 0, 4),
    daylight: choose(ambience, ['dawn', 'noon', 'sunset'] as const),
    sunAngle: ambience() * Math.PI * 2,
    cameraPitch: biome === 'caves' ? 0.48 : 0.6 + ambience() * 0.16,
    wet: biome === 'rainforest' || biome === 'oasis' || rng() < 0.42,
  };
}
