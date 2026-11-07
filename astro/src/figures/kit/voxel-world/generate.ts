import { buildEcology, shadeCanopy } from './ecology';
import { planPlaces } from './places';
import { buildInterests } from './interests';
import { CANOPIES } from './habitat-rules';
import { terrain } from './terrain';
import { buildGround } from './ground';
import { population } from './recipes';
import { Placement } from './layout';
import { connectSettlements } from './paths';
import { populateHarbour } from './harbour';
import { runPipeline } from './pipeline';
import { BUILDINGS, type Recipe, type World, type WorldSpec } from './types';
import policy from './policy.json';

export function generateWorld(spec: WorldSpec, seed = spec.layoutSeed): World {
  if (seed !== spec.layoutSeed) throw new Error('World seed and plan must agree');
  const world: World = {
    spec,
    heights: new Map(),
    biomes: new Map(),
    ceilings: new Map(),
    roofs: new Map(),
    liquids: new Map(),
    seabed: new Map(),
    landmarks: [],
    bottoms: new Map(),
    environment: new Map(),
    surface: new Map(),
    points: [],
    groups: [],
    boats: [],
    structures: [],
    blocks: [],
    props: [],
    paths: new Set(),
    emitters: [],
    report: {
      terrain: { roofColumnsRemoved: 0 },
      planned: {},
      placed: {},
      rejected: {},
      omitted: [],
      attempts: 0,
      stages: [],
    },
  };
  let recipes: Recipe[] = [],
    companions: Recipe[] = [],
    layout: Placement;
  const place = (all: Recipe[], test: (r: Recipe) => boolean): void => {
    for (const r of all.filter(test)) layout.put(r);
  };
  runPipeline(world, {
    terrain: () => Object.assign(world, terrain(spec)),
    ecology: () => buildEcology(world),
    population: () => {
      const all = population(world);
      for (const r of all) world.report.planned[r.kind] = (world.report.planned[r.kind] ?? 0) + 1;
      recipes = all.slice(0, policy.maxRecipes);
      world.report.omitted.push(...all.slice(policy.maxRecipes).map((r) => r.id));
      layout = new Placement(world);
    },
    settlements: () => place(recipes, (r) => BUILDINGS.has(r.kind)),
    places: () => {
      companions = planPlaces(world, layout);
    },
    paths: () => connectSettlements(world, layout),
    'related-canopy': () => place(companions, (r) => CANOPIES.has(r.kind)),
    canopy: () => place(recipes, (r) => !BUILDINGS.has(r.kind) && CANOPIES.has(r.kind)),
    shade: () => shadeCanopy(world),
    'related-floor': () => place(companions, (r) => !CANOPIES.has(r.kind)),
    floor: () => place(recipes, (r) => !BUILDINGS.has(r.kind) && !CANOPIES.has(r.kind)),
    ground: () => buildGround(world),
    harbour: () => populateHarbour(world),
    interests: () => buildInterests(world),
    budget: () => {
      if (Object.values(world.report.planned).reduce((a, b) => a + b, 0) > policy.maxRecipes)
        throw new Error('Voxel recipe budget exceeded');
      if (world.blocks.length > policy.maxSurfaceBlocks) throw new Error('Voxel surface budget exceeded');
    },
  });
  return world;
}
