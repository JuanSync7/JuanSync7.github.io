import { FLOOR, weightedKind } from './abundance';
import { DIMENSIONS } from './dimensions';
import { HABITATS } from './catalog';
import { BUILDINGS, TREES, type Biome, type Recipe, type World } from './types';
import policy from './policy.json';
import { choose, integer, seedFor, stream } from './seeds';

export function recipe(seed: number, id: string, kind: string, biome: Biome): Recipe {
  const objectSeed = seedFor(seed, id),
    rng = stream(objectSeed, 'shape');
  const tree = TREES.has(kind),
    house = BUILDINGS.has(kind),
    tower = kind === 'tower',
    profile = DIMENSIONS[kind];
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
    width: profile
      ? integer(rng, ...profile.width)
      : house
        ? integer(rng, 1, tower ? 4 : 3)
        : tree || kind === 'giant mushroom'
          ? integer(rng, 1, 3)
          : broad
            ? integer(rng, 1, 2)
            : 1,
    depth: profile
      ? integer(rng, ...profile.depth)
      : house
        ? integer(rng, 2, 4)
        : ['bones', 'fallen log', 'wagon', 'minecart', 'rail track', 'sled'].includes(kind)
          ? integer(rng, 2, 4)
          : 1,
    height: profile
      ? integer(rng, ...profile.height)
      : tower
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
    const choices =
      biome === 'city'
        ? ['tower', 'townhouse', 'townhouse', 'workshop', 'clock tower']
        : biome === 'village'
          ? ['cottage', 'workshop', 'greenhouse', 'windmill', 'hut']
          : biome === 'desert' || biome === 'oasis'
            ? ['tent', 'hut', 'sandstone shrine']
            : biome === 'wasteland'
              ? ['ruin', 'ruined gateway', 'tent']
              : biome === 'volcanic'
                ? ['forge', 'ruin', 'watchtower']
                : biome === 'rainforest'
                  ? ['hut', 'jungle shrine', 'watchtower']
                  : biome === 'plains'
                    ? ['cottage', 'windmill', 'greenhouse']
                    : ['cottage', 'hut', 'tent', 'watchtower'];
    const kind = choose(rng, choices);
    recipes.push(recipe(spec.layoutSeed, `settlement/${i}`, kind, biome));
  }
  const budgets = [...areas].map(([biome, area]) => {
    const local = stream(spec.layoutSeed, `population/${biome}/counts`);
    return {
      biome,
      area,
      trees: area * HABITATS[biome].treeRate * spec.density * (0.7 + local() * 0.6),
      details: area * (0.035 + local() * 0.025) * spec.density,
    };
  });
  const treeScale = Math.min(
    1,
    policy.maxCanopy /
      Math.max(
        1,
        budgets.reduce((n, b) => n + b.trees, 0),
      ),
  );
  const detailScale = Math.min(
    1,
    policy.maxDressing /
      Math.max(
        1,
        budgets.reduce((n, b) => n + b.details, 0),
      ),
  );
  for (const { biome, trees, details } of budgets) {
    const habitat = HABITATS[biome],
      paletteRng = stream(spec.layoutSeed, `ecology/${biome}/palette`);
    const palette = habitat.details.filter((kind) => !BUILDINGS.has(kind));
    for (let i = palette.length - 1; i > 0; i--) {
      const j = integer(paletteRng, 0, i);
      [palette[i], palette[j]] = [palette[j]!, palette[i]!];
    }
    const selected = [
      ...new Set([
        ...FLOOR[biome],
        ...palette.slice(0, integer(paletteRng, Math.min(6, palette.length), Math.min(11, palette.length))),
      ]),
    ];
    for (let i = 0; i < Math.floor(trees * treeScale); i++) {
      const kind = biome === 'rainforest' && rng() < 0.65 ? 'jungle tree' : choose(rng, habitat.plants);
      recipes.push(recipe(spec.layoutSeed, `vegetation/${biome}/${i}`, kind, biome));
    }
    for (let i = 0; i < Math.floor(details * detailScale); i++)
      recipes.push(recipe(spec.layoutSeed, `props/${biome}/${i}`, weightedKind(rng, selected), biome));
  }
  const canopySize = (r: Recipe): number => (r.kind === 'bamboo' ? 0 : r.width * r.height);
  return recipes.sort(
    (a, b) =>
      a.priority - b.priority || (a.priority === 1 ? canopySize(b) - canopySize(a) : 0) || a.id.localeCompare(b.id),
  );
}
