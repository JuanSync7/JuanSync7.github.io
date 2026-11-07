import { cell, type World } from './types';
import { neighbours } from './edges';

/** A skylight can cut a small lip free. Keep only roof connected through rock to terrain. */
export function stabilizeRoofs(world: World): number {
  const retained = new Set<string>(),
    queue: string[] = [];
  const span = (key: string): [number, number] => [
    world.ceilings.get(key) ?? world.roofs.get(key) ?? Infinity,
    (world.roofs.get(key) ?? -Infinity) + 2,
  ];
  const terrainTouches = (key: string, low: number, high: number): boolean => {
    const top = world.heights.get(key) ?? world.seabed.get(key),
      bottom = world.bottoms.get(key);
    return top !== undefined && bottom !== undefined && top >= low && bottom <= high;
  };
  for (const key of world.roofs.keys()) {
    const [x = 0, z = 0] = key.split(',').map(Number),
      [low, high] = span(key);
    if (
      terrainTouches(key, low - 1, high + 1) ||
      neighbours.some(([dx, dz]) => terrainTouches(cell(x + dx, z + dz), low, high))
    ) {
      retained.add(key);
      queue.push(key);
    }
  }
  for (let i = 0; i < queue.length; i++) {
    const key = queue[i];
    if (!key) continue;
    const [x = 0, z = 0] = key.split(',').map(Number),
      [low, high] = span(key);
    for (const [dx, dz] of neighbours) {
      const next = cell(x + dx, z + dz);
      if (!world.roofs.has(next) || retained.has(next)) continue;
      const [otherLow, otherHigh] = span(next);
      if (Math.max(low, otherLow) <= Math.min(high, otherHigh)) {
        retained.add(next);
        queue.push(next);
      }
    }
  }
  let removed = 0;
  for (const key of world.roofs.keys())
    if (!retained.has(key)) {
      world.roofs.delete(key);
      world.ceilings.delete(key);
      removed++;
    }
  return removed;
}
