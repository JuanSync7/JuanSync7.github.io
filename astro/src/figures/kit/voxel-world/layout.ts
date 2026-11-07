import { entrance } from './entrance';
import { BUILDINGS, cell, type Prop, type Recipe, type World } from './types';
import { componentModel } from './models';
import { stream, integer } from './seeds';
import policy from './policy.json';
import { SpatialIndex } from './spatial';
import { inspectSite, type Site } from './placement-rules';

export class Placement {
  readonly index = new SpatialIndex();
  readonly occupied = this.index.occupied;
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
  put(r: Recipe): Prop | null {
    const { world } = this;
    if (world.props.length >= policy.maxProps) {
      world.report.omitted.push(r.id);
      return null;
    }
    const model = componentModel(r),
      rx = Math.max(...model.map((b) => Math.abs(b.x))),
      rz = Math.max(...model.map((b) => Math.abs(b.z)));
    const rng = stream(r.seed, 'placement'),
      positions = this.positions.get(r.biome) ?? [],
      seen = new Set<number>();
    let best: Site | null = null;
    for (let i = 0; i < policy.placementAttempts && positions.length; i++) {
      const index = integer(rng, 0, positions.length - 1);
      if (seen.has(index)) continue;
      seen.add(index);
      world.report.attempts++;
      const point: [number, number] | undefined = r.anchor
        ? (() => {
            const angle = rng() * Math.PI * 2,
              distance = r.anchor.minimum + Math.sqrt(rng()) * (r.anchor.radius - r.anchor.minimum);
            return [
              Math.round(r.anchor.x + Math.cos(angle) * distance),
              Math.round(r.anchor.z + Math.sin(angle) * distance),
            ];
          })()
        : positions[index];
      if (!point) continue;
      const inspected = inspectSite(world, this.index, r, model, point[0], point[1], rx, rz);
      if (typeof inspected === 'string') {
        world.report.rejected[inspected] = (world.report.rejected[inspected] ?? 0) + 1;
        continue;
      }
      const site = inspected;
      if (site && (!best || site.score < best.score)) best = site;
      if (best && !BUILDINGS.has(r.kind)) break;
    }
    if (!best) {
      world.report.omitted.push(r.id);
      return null;
    }
    const { x, y, z, blocks } = best;
    if (BUILDINGS.has(r.kind))
      for (let dx = -rx - 1; dx <= rx + 1; dx++)
        for (let dz = -rz - 1; dz <= rz + 1; dz++) world.heights.set(cell(x + dx, z + dz), y - 1);
    const prop: Prop = { kind: r.kind, x, y, z, rx, rz, blocks, recipe: r };
    world.props.push(prop);
    if (BUILDINGS.has(r.kind)) {
      const [ex, ez] = entrance(r, rx, rz);
      world.paths.add(cell(x + ex, z + ez));
    }
    this.index.add(prop);
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
