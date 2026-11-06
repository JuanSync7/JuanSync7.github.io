import { terrain } from './terrain';
import { buildGround } from './ground';
import { population } from './recipes';
import { Placement } from './layout';
import { connectSettlements } from './paths';
import { populateHarbour } from './harbour';
import { BUILDINGS, type World, type WorldSpec } from './types';
import policy from './policy.json';

export function generateWorld(spec: WorldSpec, seed = spec.layoutSeed): World {
  if (seed !== spec.layoutSeed) throw new Error('World seed and plan must agree');
  const world: World = {
    spec,
    ...terrain(spec),
    bottoms: new Map(),
    boats: [],
    structures: [],
    blocks: [],
    props: [],
    paths: new Set(),
    emitters: [],
    report: { planned: {}, placed: {}, rejected: {}, omitted: [], attempts: 0 },
  };
  const all = population(world);
  for (const r of all) world.report.planned[r.kind] = (world.report.planned[r.kind] ?? 0) + 1;
  const layout = new Placement(world),
    recipes = all.slice(0, policy.maxRecipes);
  world.report.omitted.push(...all.slice(policy.maxRecipes).map((r) => r.id));
  for (const r of recipes.filter((r) => BUILDINGS.has(r.kind))) layout.put(r);
  connectSettlements(world, layout);
  for (const r of recipes.filter((r) => !BUILDINGS.has(r.kind))) {
    if (world.props.length >= policy.maxProps) {
      world.report.omitted.push(r.id);
      continue;
    }
    layout.put(r);
  }
  buildGround(world);
  populateHarbour(world);
  if (world.blocks.length > policy.maxSurfaceBlocks) throw new Error('Voxel surface budget exceeded');
  return world;
}
