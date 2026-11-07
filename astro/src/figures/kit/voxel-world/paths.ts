import { entrance } from './entrance';
import { BUILDINGS, cell, type World } from './types';
import type { Placement } from './layout';

/** Bounded breadth-first routing through supported, unoccupied walking cells. */
export function connectSettlements(world: World, layout: Placement): void {
  const network = new Set<string>();
  for (const prop of world.props.filter((p) => BUILDINGS.has(p.kind))) {
    const [dx, dz] = entrance(prop.recipe, prop.rx, prop.rz);
    const start = cell(prop.x + dx, prop.z + dz);
    const startHeight = world.heights.get(start);
    if (startHeight === undefined || world.liquids.has(start) || layout.occupied.has(start)) continue;
    if (network.size === 0) {
      world.paths.add(start);
      network.add(start);
      continue;
    }
    const queue: string[] = [start],
      parent = new Map<string, string | null>([[start, null]]);
    let end: string | null = null;
    for (let i = 0; i < queue.length && i < world.heights.size; i++) {
      const k = queue[i];
      if (!k) continue;
      if (network.has(k)) {
        end = k;
        break;
      }
      const [x = 0, z = 0] = k.split(',').map(Number),
        h = world.heights.get(k) ?? 0;
      for (const [ox = 0, oz = 0] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const next = cell(x + ox, z + oz),
          nh = world.heights.get(next);
        if (
          parent.has(next) ||
          nh === undefined ||
          Math.abs(nh - h) > 2 ||
          layout.occupied.has(next) ||
          world.liquids.has(next)
        )
          continue;
        parent.set(next, k);
        queue.push(next);
      }
    }
    while (end !== null) {
      world.paths.add(end);
      network.add(end);
      end = parent.get(end) ?? null;
    }
    world.paths.add(start);
    network.add(start);
  }
}
