import { ANIMALS } from './animals';
import type { Biome } from './types';

export const FLOOR: Record<Biome, string[]> = {
  woodland: ['fern', 'grass clump', 'leaf litter', 'moss carpet', 'wildflower patch'],
  rainforest: ['fern', 'leaf litter', 'moss carpet', 'tree fern', 'bromeliad'],
  mushroom: ['moss carpet', 'lichen', 'mushroom', 'spore cluster', 'cup mushroom'],
  snow: ['snow tuft', 'snowdrift', 'frost shrub', 'pinecone'],
  tundra: ['lichen', 'cotton grass', 'dwarf shrub', 'heather', 'snow tuft'],
  frozen: ['snow tuft', 'snowdrift', 'scree', 'frost shrub'],
  desert: ['dry grass', 'dead bush', 'agave', 'scree', 'barrel cactus'],
  oasis: ['dry grass', 'agave', 'flowering shrub', 'grass clump'],
  volcanic: ['scree', 'slag heap', 'obsidian shard', 'sulfur mound'],
  wasteland: ['dry grass', 'dead bush', 'scree', 'scrap heap'],
  plains: ['grass clump', 'wildflower patch', 'dry grass', 'dwarf shrub'],
  village: ['grass clump', 'wildflower patch', 'flowering shrub', 'berry bush'],
  city: ['grass clump', 'flowering shrub', 'wildflower patch'],
  caves: ['scree', 'lichen', 'mushroom', 'crystal cluster'],
};
export const DRAPED = new Set([
  'moss carpet',
  'leaf litter',
  'dry grass',
  'cotton grass',
  'dwarf shrub',
  'frost shrub',
  'lichen',
  'grass clump',
  'wildflower patch',
  'heather',
  'scree',
  'snow tuft',
]);
const landmarks = new Set([
  'giant fossil',
  'ice arch',
  'standing stones',
  'crystal geode',
  'sandstone arch',
  'sandstone pillar',
  'ice spire',
  'basalt spire',
]);
const supplies = new Set([
  'woodpile',
  'tool rack',
  'crate stack',
  'supply chest',
  'watering trough',
  'water urn',
  'barrel',
  'wagon',
  'market stall',
  'well',
  'hay bale',
  'campfire',
  'sled',
  'broken sled',
  'rail track',
  'minecart',
  'fence segment',
  'signpost',
  'cauldron',
  'lantern',
]);
/** Scale occurrence by ecological role: a fossil is a discovery, not every tenth plant. */
export function abundance(kind: string): number {
  if (landmarks.has(kind)) return 0.06;
  if ((ANIMALS as readonly string[]).includes(kind)) return 0.35;
  if (supplies.has(kind)) return 0.18;
  if (DRAPED.has(kind)) return 5;
  if (/fern|bush|shrub|mushroom|agave|cactus|bromeliad|orchid/.test(kind)) return 2;
  return 0.7;
}
export function weightedKind(rng: () => number, choices: string[]): string {
  if (!choices.length) throw new Error('VXL-CONTENT: empty ecological community');
  let cursor = rng() * choices.reduce((sum, kind) => sum + abundance(kind), 0);
  for (const kind of choices) {
    cursor -= abundance(kind);
    if (cursor <= 0) return kind;
  }
  return choices[choices.length - 1]!;
}
