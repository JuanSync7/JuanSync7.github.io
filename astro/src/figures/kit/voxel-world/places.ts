import catalog from './poi-catalog.json';
import { recipe } from './recipes';
import { DIMENSIONS } from './dimensions';
import { choose, integer, stream } from './seeds';
import { BUILDINGS, type Biome, type Prop, type Recipe, type World } from './types';
import type { Placement } from './layout';

const labels: Record<string, string> = {
  tent: 'Campsite',
  cottage: 'Homestead',
  hut: 'Lodge clearing',
  windmill: 'Mill farm',
  watchtower: 'Lookout camp',
  greenhouse: 'Garden plot',
  'jungle shrine': 'Overgrown shrine',
  'sandstone shrine': 'Desert shrine',
  'clock tower': 'Clock square',
  townhouse: 'Neighborhood',
  tower: 'City block',
  ruin: 'Old ruins',
};
const yards: Record<string, string[]> = {
  windmill: ['crop patch', 'hay bale', 'scarecrow', 'fence segment', 'watering trough', 'sheep', 'beehive'],
  greenhouse: ['crop patch', 'water urn', 'beehive', 'flowering shrub', 'barrel', 'fence segment'],
  workshop: ['woodpile', 'tool rack', 'crate stack', 'barrel', 'wagon', 'lantern'],
  forge: ['ore boulder', 'tool rack', 'barrel', 'cauldron', 'crate stack', 'charred stump'],
  watchtower: ['supply chest', 'barrel', 'campfire', 'woodpile', 'signpost', 'torch post'],
};

export function recordRecipe(world: World, r: Recipe): void {
  world.report.planned[r.kind] = (world.report.planned[r.kind] ?? 0) + 1;
}
function group(world: World, parent: Prop, label: string, options: string[]): Recipe[] {
  const id = `place/${parent.recipe.id}`,
    rng = stream(parent.recipe.seed, 'companions'),
    children: Recipe[] = [];
  const radius = Math.max(parent.rx, parent.rz) + 13;
  for (let i = 0; i < integer(rng, 5, 9); i++) {
    const r = recipe(world.spec.layoutSeed, `${id}/${i}`, choose(rng, options), parent.recipe.biome);
    r.anchor = {
      parent: parent.recipe.id,
      x: parent.x,
      z: parent.z,
      minimum: Math.min(parent.rx, parent.rz) + 3,
      radius,
    };
    children.push(r);
    recordRecipe(world, r);
  }
  world.groups.push({
    id,
    label,
    biome: parent.recipe.biome,
    parent: parent.recipe.id,
    expected: children.map((r) => r.id),
    radius,
  });
  return children;
}

/** Accepted main objects own a bounded neighborhood of related, separately checked objects. */
export function planPlaces(world: World, layout: Placement): Recipe[] {
  const children: Recipe[] = [];
  for (const p of world.props.filter((p) => BUILDINGS.has(p.kind))) {
    const options =
      yards[p.kind] ??
      (world.spec.biome === 'city'
        ? catalog.city.companions
        : ['barrel', 'woodpile', 'campfire', 'wildflower patch', 'fence segment', 'supply chest', 'watering trough']);
    children.push(
      ...group(world, p, labels[p.kind] ?? p.kind.replace(/\b\w/g, (c) => c.toUpperCase()) + ' yard', options),
    );
  }
  const areas = new Map<Biome, number>();
  for (const biome of world.biomes.values()) areas.set(biome, (areas.get(biome) ?? 0) + 1);
  for (const [biome, area] of areas) {
    if (area < 900) continue;
    const local = catalog[biome],
      rng = stream(world.spec.layoutSeed, `places/${biome}`),
      count = Math.min(3, Math.max(1, Math.floor(area / 3600)));
    for (let i = 0; i < count; i++) {
      const kind = choose(rng, local.parents),
        r = recipe(world.spec.layoutSeed, `landmark/${biome}/${i}`, kind, biome);
      if (!DIMENSIONS[kind]) {
        r.width = Math.min(4, r.width + 1);
        r.height += 3;
      }
      r.priority = 0;
      recordRecipe(world, r);
      const p = layout.put(r);
      if (p) children.push(...group(world, p, local.label, local.companions));
    }
  }
  return children.sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
}
