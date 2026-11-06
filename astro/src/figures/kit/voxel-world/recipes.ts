import { HABITATS } from './catalog';
import { BUILDINGS, TREES, type Biome, type Recipe, type World } from './types';
import { choose, integer, seedFor, stream } from './seeds';

export function recipe(seed: number, id: string, kind: string, biome: Biome): Recipe {
  const objectSeed = seedFor(seed, id),
    rng = stream(objectSeed, 'shape');
  const tree = TREES.has(kind),
    house = BUILDINGS.has(kind),
    tower = kind === 'tower';
  const broad =
    /bush|shrub|patch|clump|cluster|drift|boulder|arch|pillar|planter|fountain|stall/.test(kind) ||
    [
      'rock',
      'agave',
      'barrel cactus',
      'banana plant',
      'tree fern',
      'tree stump',
      'cairn',
      'scree',
      'slag heap',
      'lava vent',
      'hay bale',
      'crate',
      'park bench',
    ].includes(kind);
  return {
    id,
    seed: objectSeed,
    kind,
    biome,
    width: house
      ? integer(rng, 1, tower ? 4 : 3)
      : tree || kind === 'giant mushroom'
        ? integer(rng, 1, 3)
        : broad
          ? integer(rng, 1, 2)
          : 1,
    depth: house
      ? integer(rng, 2, 4)
      : ['bones', 'fallen log', 'wagon', 'minecart', 'rail track', 'sled'].includes(kind)
        ? integer(rng, 2, 4)
        : 1,
    height: tower
      ? integer(rng, 6, 17)
      : house
        ? integer(rng, 3, 6)
        : tree
          ? integer(rng, kind === 'jungle tree' ? 8 : 4, kind === 'jungle tree' ? 13 : 9)
          : integer(rng, 2, 5),
    variant: integer(rng, 0, 3),
    turn: integer(rng, 0, 3),
    priority: house ? 0 : tree || kind === 'giant mushroom' ? 1 : 2,
  };
}

export function population(world: World): Recipe[] {
  const { spec } = world,
    rng = stream(spec.layoutSeed, 'population'),
    recipes: Recipe[] = [];
  const areas = new Map<Biome, number>();
  for (const biome of world.biomes.values()) areas.set(biome, (areas.get(biome) ?? 0) + 1);
  for (let i = 0; i < spec.settlementCount; i++) {
    const biome = spec.biome;
    const kind =
      biome === 'city'
        ? choose(rng, ['tower', 'tower', 'cottage'])
        : biome === 'desert' || biome === 'oasis'
          ? choose(rng, ['tent', 'hut'])
          : biome === 'wasteland'
            ? choose(rng, ['ruin', 'tent'])
            : choose(rng, ['cottage', 'hut', 'tent']);
    recipes.push(recipe(spec.layoutSeed, `settlement/${i}`, kind, biome));
  }
  for (const [biome, area] of areas) {
    const habitat = HABITATS[biome];
    const paletteRng = stream(spec.layoutSeed, `ecology/${biome}/palette`);
    const palette = habitat.details.filter((kind) => !BUILDINGS.has(kind));
    for (let i = palette.length - 1; i > 0; i--) {
      const j = integer(paletteRng, 0, i);
      [palette[i], palette[j]] = [palette[j]!, palette[i]!];
    }
    const selected = palette.slice(0, integer(paletteRng, 4, Math.min(8, palette.length)));
    const count = Math.min(150, Math.floor(area * habitat.treeRate * spec.density * (0.6 + rng() * 0.8)));
    for (let i = 0; i < count; i++)
      recipes.push(recipe(spec.layoutSeed, `vegetation/${biome}/${i}`, choose(rng, habitat.plants), biome));
    const details = Math.min(90, Math.floor(area * (0.012 + rng() * 0.018) * spec.density));
    for (let i = 0; i < details; i++)
      recipes.push(recipe(spec.layoutSeed, `props/${biome}/${i}`, choose(rng, selected), biome));
  }
  return recipes.sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
}
