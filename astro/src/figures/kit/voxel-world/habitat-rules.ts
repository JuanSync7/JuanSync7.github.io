import { BUILDINGS, TREES, cell, type Recipe, type World } from './types';

export const CANOPIES = new Set([...TREES, 'giant mushroom']);
const wetland = new Set(['reeds', 'cattails', 'turtle']);
const living = new Set([
  ...TREES,
  'fern',
  'bush',
  'berry bush',
  'flowering shrub',
  'grass clump',
  'wildflower patch',
  'flower',
  'grass',
  'tree fern',
  'banana plant',
  'orchid',
  'bromeliad',
]);
const street = new Set(['park bench', 'street planter', 'hydrant', 'fountain', 'mailbox', 'street bollard']);
const farm = new Set(['crop patch', 'hay bale', 'scarecrow', 'beehive']);

export function habitatRejection(world: World, r: Recipe, x: number, z: number): string | null {
  const e = world.environment.get(cell(x, z));
  if (!e) return 'missing-habitat';
  if (r.kind === 'frog' && (e.moisture < 0.7 || (e.shade < 0.5 && e.waterDistance > 8))) return 'frog-habitat';
  if (wetland.has(r.kind) || r.kind === 'mangrove') {
    const range = r.kind === 'mangrove' ? 7 : 5,
      ground = world.heights.get(cell(x, z)) ?? 0;
    let shore = false;
    for (let dx = -range; dx <= range; dx++)
      for (let dz = -range; dz <= range; dz++) {
        if (Math.abs(dx) + Math.abs(dz) > range) continue;
        const liquid = world.liquids.get(cell(x + dx, z + dz));
        if (liquid?.kind === 'water' && ground >= liquid.level && ground <= liquid.level + 4) shore = true;
      }
    if (!shore) return 'riparian-elevation';
  }
  if (r.kind === 'mangrove' && e.waterDistance > 7) return 'mangrove-shore';
  if (r.kind === 'bamboo' && e.patch < 0.6) return 'bamboo-patch';
  if (CANOPIES.has(r.kind) && !r.id.startsWith('landmark/') && !r.anchor && e.patch < 0.3) return 'canopy-clearing';
  if (wetland.has(r.kind) && e.waterDistance > 5) return 'riparian-distance';
  if (living.has(r.kind) && !['dead tree', 'pine'].includes(r.kind) && ['ice', 'ash', 'rock'].includes(e.substrate))
    return 'substrate';
  if (TREES.has(r.kind) && e.substrate === 'ice') return 'ice-root';
  if (['fern', 'tree fern', 'orchid', 'bromeliad'].includes(r.kind) && e.moisture < 0.45) return 'moisture';
  const nearbyPlace = (): boolean =>
    world.props.some((p) => BUILDINGS.has(p.kind) && Math.hypot(x - p.x, z - p.z) <= 18);
  if ((street.has(r.kind) || farm.has(r.kind)) && !nearbyPlace()) return 'place-context';
  if (
    !BUILDINGS.has(r.kind) &&
    !r.anchor &&
    ['grass clump', 'wildflower patch', 'berry bush', 'bush', 'fern', 'tree fern', 'heather', 'lichen'].includes(r.kind)
  ) {
    if (e.patch < 0.31 && e.shade < 0.5) return 'open-patch';
  }
  return null;
}
