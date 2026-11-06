import { BUILDINGS, TREES, cell, type Block, type Prop, type Recipe, type World } from './types';
import { componentModel } from './models';
import { stream, integer } from './seeds';
import policy from './policy.json';

export interface Site {
  x: number;
  z: number;
  y: number;
  score: number;
}
export class Placement {
  readonly occupied = new Set<string>();
  private positions = new Map<string, [number, number][]>();
  constructor(readonly world: World) {
    for (const [k, biome] of world.biomes) {
      if (world.liquids.has(k)) continue;
      const [x = 0, z = 0] = k.split(',').map(Number);
      const list = this.positions.get(biome) ?? [];
      list.push([x, z]);
      this.positions.set(biome, list);
    }
  }
  private reject(reason: string): null {
    this.world.report.rejected[reason] = (this.world.report.rejected[reason] ?? 0) + 1;
    return null;
  }
  private check(r: Recipe, blocks: Block[], x: number, z: number, rx: number, rz: number): Site | null {
    const { world } = this,
      center = world.heights.get(cell(x, z));
    if (center === undefined) return this.reject('outside');
    const house = BUILDINGS.has(r.kind),
      heights: number[] = [];
    for (let dx = -rx - policy.clearance; dx <= rx + policy.clearance; dx++)
      for (let dz = -rz - policy.clearance; dz <= rz + policy.clearance; dz++) {
        const k = cell(x + dx, z + dz),
          h = world.heights.get(k);
        if (h === undefined || world.liquids.has(k)) return this.reject('shore-or-water');
        if (this.occupied.has(k) || world.paths.has(k)) return this.reject('clearance');
        heights.push(h);
      }
    const low = Math.min(...heights),
      high = Math.max(...heights);
    const ground = house ? Math.round((low + high) / 2) : center;
    if (house && high - low > policy.maxFoundationGrade) return this.reject('foundation-slope');
    if (house) {
      let ex = 0,
        ez = r.depth + 2;
      for (let i = 0; i < r.turn; i++) [ex, ez] = [-ez, ex];
      const entry = cell(x + ex, z + ez),
        eh = world.heights.get(entry);
      if (
        eh === undefined ||
        world.liquids.has(entry) ||
        this.occupied.has(entry) ||
        Math.abs(eh - ground) > policy.maxFoundationGrade
      )
        return this.reject('entrance');
    }
    if (TREES.has(r.kind) && ground > policy.treeLine && r.kind !== 'dead tree') return this.reject('tree-line');
    // Test the measured geometry, including roots and all overhangs, before terrain edits.
    for (const b of blocks) {
      const k = cell(x + b.x, z + b.z),
        h = house ? ground : world.heights.get(k);
      if (h === undefined || ground + 1 + b.y <= h) return this.reject('terrain-collision');
      if (b.y === 0 && h !== ground) return this.reject('root-support');
      const ceiling = world.ceilings.get(k);
      if (ceiling !== undefined && ground + 1 + b.y >= ceiling) return this.reject('headroom');
    }
    return {
      x,
      z,
      y: ground + 1,
      score:
        (house ? high - low : Math.abs(center - 6) * 0.03) +
        (Math.hypot(x, z) / world.spec.radius) * (house && world.spec.biome === 'city' ? 1 : 0.04),
    };
  }
  put(r: Recipe): Prop | null {
    const { world } = this;
    const blocks = componentModel(r),
      rx = Math.max(...blocks.map((b) => Math.abs(b.x))),
      rz = Math.max(...blocks.map((b) => Math.abs(b.z)));
    const rng = stream(r.seed, 'placement'),
      positions = this.positions.get(r.biome) ?? [],
      seen = new Set<number>();
    let best: Site | null = null;
    for (let i = 0; i < policy.placementAttempts && positions.length; i++) {
      const index = integer(rng, 0, positions.length - 1);
      if (seen.has(index)) continue;
      seen.add(index);
      world.report.attempts++;
      const point = positions[index];
      if (!point) continue;
      const site = this.check(r, blocks, point[0], point[1], rx, rz);
      if (site && (!best || site.score < best.score)) best = site;
      if (best && !BUILDINGS.has(r.kind)) break;
    }
    if (!best) {
      world.report.omitted.push(r.id);
      return null;
    }
    const { x, y, z } = best;
    if (BUILDINGS.has(r.kind))
      for (let dx = -rx - 1; dx <= rx + 1; dx++)
        for (let dz = -rz - 1; dz <= rz + 1; dz++) world.heights.set(cell(x + dx, z + dz), y - 1);
    const prop: Prop = { kind: r.kind, x, y, z, rx, rz, blocks, recipe: r };
    world.props.push(prop);
    if (BUILDINGS.has(r.kind)) {
      let ex = 0,
        ez = r.depth + 2;
      for (let i = 0; i < r.turn; i++) [ex, ez] = [-ez, ex];
      world.paths.add(cell(x + ex, z + ez));
    }
    for (let dx = -rx; dx <= rx; dx++) for (let dz = -rz; dz <= rz; dz++) this.occupied.add(cell(x + dx, z + dz));
    for (const b of blocks) world.blocks.push({ ...b, x: x + b.x, y: y + b.y, z: z + b.z });
    world.report.placed[r.kind] = (world.report.placed[r.kind] ?? 0) + 1;
    if (r.kind === 'cottage' && r.variant > 0) {
      const top = blocks.reduce((a, b) => (b.y > a.y ? b : a));
      world.emitters.push({ x: x + top.x, y: y + top.y + 1, z: z + top.z, kind: 'smoke' });
    }
    if (r.kind === 'cauldron') world.emitters.push({ x, y: y + 2, z, kind: 'magic' });
    if (r.kind === 'campfire' || r.kind === 'lava vent') world.emitters.push({ x, y: y + 3, z, kind: 'fire' });
    return prop;
  }
}
