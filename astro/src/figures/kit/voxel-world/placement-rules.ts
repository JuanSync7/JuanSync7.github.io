import { DRAPED } from './abundance';
import { entrance } from './entrance';
import { BUILDINGS, TREES, cell, type Block, type Recipe, type World } from './types';
import { habitatRejection } from './habitat-rules';
import type { SpatialIndex } from './spatial';
import policy from './policy.json';

export interface Site {
  x: number;
  z: number;
  y: number;
  score: number;
  blocks: Block[];
}

export function inspectSite(
  world: World,
  index: SpatialIndex,
  r: Recipe,
  blocks: Block[],
  x: number,
  z: number,
  rx: number,
  rz: number,
): Site | string {
  const center = world.heights.get(cell(x, z));
  if (center === undefined || world.biomes.get(cell(x, z)) !== r.biome) return 'outside-habitat';
  if (r.anchor) {
    const distance = Math.hypot(x - r.anchor.x, z - r.anchor.z);
    if (distance < r.anchor.minimum || distance > r.anchor.radius) return 'anchor-distance';
  }
  const ecological = habitatRejection(world, r, x, z);
  if (ecological) return ecological;
  if (index.overlapsCanopy(r, x, z, rx, rz)) return 'canopy-spacing';
  const house = BUILDINGS.has(r.kind),
    heights: number[] = [];
  for (let dx = -rx - policy.clearance; dx <= rx + policy.clearance; dx++)
    for (let dz = -rz - policy.clearance; dz <= rz + policy.clearance; dz++) {
      const k = cell(x + dx, z + dz),
        h = world.heights.get(k);
      if (h === undefined || world.liquids.has(k)) return 'shore-or-water';
      if (index.hard.has(k) || (house && (index.occupied.has(k) || world.paths.has(k)))) return 'lot-clearance';
      heights.push(h);
    }
  const low = Math.min(...heights),
    high = Math.max(...heights),
    ground = house ? Math.round((low + high) / 2) : center;
  if (house && high - low > policy.maxFoundationGrade) return 'foundation-slope';
  if (house) {
    const [ex, ez] = entrance(r, rx, rz);
    const entry = cell(x + ex, z + ez),
      eh = world.heights.get(entry);
    if (
      eh === undefined ||
      world.liquids.has(entry) ||
      index.occupied.has(entry) ||
      Math.abs(eh - ground) > policy.maxFoundationGrade
    )
      return 'entrance';
  }
  if (TREES.has(r.kind) && ground > policy.treeLine && r.kind !== 'dead tree') return 'tree-line';
  const conformed = DRAPED.has(r.kind)
    ? blocks.map((b) => ({ ...b, y: b.y + (world.heights.get(cell(x + b.x, z + b.z)) ?? ground) - ground }))
    : blocks;
  if (DRAPED.has(r.kind) && high - low > 4) return 'dressing-slope';
  for (let i = 0; i < conformed.length; i++) {
    const b = conformed[i];
    if (!b) continue;
    const k = cell(x + b.x, z + b.z),
      h = house ? ground : world.heights.get(k),
      y = ground + 1 + b.y;
    if (h === undefined || y <= h) return 'terrain-collision';
    if (blocks[i]?.y === 0 && y !== h + 1) return 'root-support';
    const ceiling = world.ceilings.get(k);
    if (ceiling !== undefined && y >= ceiling) return 'headroom';
    if (world.paths.has(k) && y <= (world.heights.get(k) ?? h) + policy.pathHeadroom) return 'path-headroom';
  }
  if (index.collides(conformed, x, ground + 1, z)) return 'solid-clearance';
  const anchorDistance = r.anchor ? Math.hypot(x - r.anchor.x, z - r.anchor.z) : Math.hypot(x, z) / world.spec.radius;
  return { x, z, y: ground + 1, score: (house ? high - low : 0) + anchorDistance * 0.03, blocks: conformed };
}
