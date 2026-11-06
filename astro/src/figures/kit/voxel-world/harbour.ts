import { cell, type World } from './types';
import { stream, integer } from './seeds';
import { recipe } from './recipes';
import { boatModel } from './boats';
import policy from './policy.json';

/** Navigation is optional: the same rules work for open sea and large inland lakes. */
export function populateHarbour(world: World): void {
  const candidates = [...world.liquids.entries()].filter(([, l]) => l.kind === 'water');
  world.report.planned.boat = world.spec.boatCount;
  for (let i = 0; i < world.spec.boatCount; i++) {
    const id = `boats/${i}`,
      r = recipe(world.spec.layoutSeed, id, 'boat', world.spec.biome),
      rng = stream(r.seed, 'navigation');
    r.width = integer(rng, 1, 2);
    r.depth = integer(rng, 2, 4);
    r.height = integer(rng, 4, 8);
    const blocks = boatModel(r),
      rx = Math.max(...blocks.map((b) => Math.abs(b.x))),
      rz = Math.max(...blocks.map((b) => Math.abs(b.z)));
    let placed = false;
    for (let attempt = 0; attempt < policy.placementAttempts && candidates.length; attempt++) {
      world.report.attempts++;
      const candidate = candidates[integer(rng, 0, candidates.length - 1)];
      if (!candidate) continue;
      const [k, liquid] = candidate,
        [x = 0, z = 0] = k.split(',').map(Number);
      let clear = true;
      for (let dx = -rx - 1; dx <= rx + 1 && clear; dx++)
        for (let dz = -rz - 1; dz <= rz + 1; dz++) {
          const local = world.liquids.get(cell(x + dx, z + dz));
          if (!local || local.kind !== 'water' || local.level !== liquid.level) {
            clear = false;
            break;
          }
        }
      if (world.boats.some((b) => Math.abs(b.x - x) <= b.rx + rx + 2 && Math.abs(b.z - z) <= b.rz + rz + 2))
        clear = false;
      if (!clear) continue;
      world.boats.push({
        kind: r.variant % 2 ? 'sailboat' : 'rowboat',
        x,
        z,
        y: liquid.level + 1,
        rx,
        rz,
        blocks,
        recipe: r,
      });
      world.report.placed.boat = (world.report.placed.boat ?? 0) + 1;
      placed = true;
      break;
    }
    if (!placed) world.report.omitted.push(id);
  }
}
