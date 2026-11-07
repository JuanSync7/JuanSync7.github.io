import { noise2 } from '../noise';
import { stream } from './seeds';
import { cell, type World, type WorldSpec } from './types';
import policy from './policy.json';

export const BASE_LEVEL = policy.baseLevel;
export const EDGE_DEPTH = policy.edgeDepth;
export const EDGE_BAND = policy.edgeBand;
export const neighbours = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

/** A land window has eroded corners and bays, without implying an ocean shoreline. */
export function mainlandOutline(spec: WorldSpec): (x: number, z: number) => boolean {
  const noise = noise2(stream(spec.layoutSeed, 'edge/outline'));
  const rz = Math.round(spec.radius * spec.stretch);
  return (x, z) => {
    const u = Math.abs(x / spec.radius),
      v = Math.abs(z / rz);
    return (u ** 5 + v ** 5) ** 0.2 <= 0.965 + noise(x * 0.09, z * 0.09) * 0.065;
  };
}

/** Distance from the real footprint, including coves and cut corners. */
export function edgeDistances(floors: Map<string, number>): Map<string, number> {
  const distance = new Map<string, number>(),
    queue: [number, number][] = [];
  for (const k of floors.keys()) {
    const [x = 0, z = 0] = k.split(',').map(Number);
    if (neighbours.some(([dx, dz]) => !floors.has(cell(x + dx, z + dz)))) {
      distance.set(k, 0);
      queue.push([x, z]);
    }
  }
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i]!,
      d = distance.get(cell(x, z))!;
    if (d >= EDGE_BAND) continue;
    for (const [dx, dz] of neighbours) {
      const k = cell(x + dx, z + dz);
      if (floors.has(k) && !distance.has(k)) {
        distance.set(k, d + 1);
        queue.push([x + dx, z + dz]);
      }
    }
  }
  return distance;
}

/** Keep the full interior volume; bevel the underside back from exposed outer walls. */
export function shapeBase(world: World): void {
  const floors = new Map([...world.seabed, ...world.heights]),
    distance = edgeDistances(floors);
  for (const [k, h] of floors) {
    const [x = 0, z = 0] = k.split(',').map(Number);
    const t = Math.max(0, 1 - (distance.get(k) ?? EDGE_BAND) / EDGE_BAND);
    const bevel = t * t * (3 - 2 * t);
    const target = Math.floor(BASE_LEVEL + Math.max(0, h - EDGE_DEPTH - BASE_LEVEL) * bevel);
    const joined = Math.min(h, ...neighbours.map(([dx, dz]) => floors.get(cell(x + dx, z + dz)) ?? h));
    world.bottoms.set(k, Math.min(target, joined));
  }
}

export function terrainSolid(world: World, x: number, y: number, z: number): boolean {
  const k = cell(x, z),
    h = world.heights.get(k) ?? world.seabed.get(k),
    roof = world.roofs.get(k);
  return (
    (h !== undefined && y >= (world.bottoms.get(k) ?? BASE_LEVEL) && y <= h) ||
    (roof !== undefined && y >= (world.ceilings.get(k) ?? roof) && y < roof + 3)
  );
}
