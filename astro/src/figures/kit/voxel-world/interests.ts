import { cell, type World } from './types';
import type { WorldInfo } from './ecology-types';

/** Interest bounds come from accepted geometry; an omitted recipe never becomes a destination. */
export function buildInterests(world: World): void {
  const byId = new Map(world.props.map((p) => [p.recipe.id, p]));
  for (const group of world.groups) {
    const members = [group.parent, ...group.expected].flatMap((id) => {
      const p = byId.get(id);
      return p ? [p] : [];
    });
    if (!members.length) continue;
    const min: [number, number, number] = [Infinity, Infinity, Infinity],
      max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
    for (const p of members)
      for (const b of p.blocks) {
        const a = [p.x + b.x, p.y + b.y, p.z + b.z];
        for (let i = 0; i < 3; i++) {
          min[i] = Math.min(min[i] ?? 0, (a[i] ?? 0) - 1.5);
          max[i] = Math.max(max[i] ?? 0, (a[i] ?? 0) + 1.5);
        }
      }
    world.points.push({
      id: group.id,
      label: group.label,
      biome: group.biome,
      category: 'place',
      center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
      min,
      max,
      members: members.map((p) => p.recipe.id),
    });
  }
  for (let i = 0; i < world.landmarks.length; i++) {
    const l = world.landmarks[i];
    if (!l) continue;
    const r = Math.min(15, world.spec.radius * 0.22),
      min: [number, number, number] = [l.x - r, l.height - 5, l.z - r],
      max: [number, number, number] = [l.x + r, l.height + 5, l.z + r];
    const biome = world.biomes.get(cell(l.x, l.z)) ?? world.spec.biome;
    world.points.push({
      id: `landscape/${i}`,
      label: l.kind.replace(/\b\w/g, (c) => c.toUpperCase()),
      biome,
      category: 'landscape',
      center: [l.x, l.height, l.z],
      min,
      max,
      members: [],
    });
  }
}
export function worldInfo(world: World): WorldInfo {
  return {
    layoutSeed: world.spec.layoutSeed,
    points: world.points,
    objects: world.props.length,
    terrainArea: world.heights.size,
  };
}
const published = new WeakMap<World, unknown>();
export function publishWorldInfo(world: World, data: unknown): void {
  if (
    typeof data !== 'object' ||
    data === null ||
    !('onWorldInfo' in data) ||
    typeof data.onWorldInfo !== 'function' ||
    published.get(world) === data.onWorldInfo
  )
    return;
  published.set(world, data.onWorldInfo);
  data.onWorldInfo(worldInfo(world));
}
