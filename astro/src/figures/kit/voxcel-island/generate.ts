import { mulberry32, type Rng } from '../rng';
import { model } from './models';
import { terrain, terrainMaterial } from './terrain';
import { populateHarbour } from './harbour';
import { cell, type Prop, type World, type WorldSpec } from './types';

export function generateWorld(spec: WorldSpec, seed: number): World {
  const propsRng = mulberry32(seed ^ 917323);
  const detailRng = mulberry32(seed ^ 481903);
  const { heights, liquids, seabed, landmarks } = terrain(spec, seed);
  const world: World = {
    spec,
    heights,
    liquids,
    seabed,
    landmarks,
    boats: [],
    structures: [],
    blocks: [],
    props: [],
    emitters: [],
  };
  const ax = spec.anchor;
  const reserved = new Set<string>();
  function place(kind: string, x: number, z: number, rng: Rng, mandatory = false): boolean {
    const blocks = model(kind, spec, rng);
    const rx = Math.max(...blocks.map((b) => Math.abs(b.x)));
    const rz = Math.max(...blocks.map((b) => Math.abs(b.z)));
    const y = heights.get(cell(x, z));
    if (y === undefined) return false;
    if (y > 12 && ['tree', 'pine', 'palm'].includes(kind)) return false;
    // Strict level support, coastline clearance and a one-cell gap around the whole model.
    for (let dx = -rx - 1; dx <= rx + 1; dx++)
      for (let dz = -rz - 1; dz <= rz + 1; dz++) {
        const k = cell(x + dx, z + dz);
        const ground = heights.get(k);
        if (ground === undefined || reserved.has(k) || liquids.has(k)) return false;
        if (!mandatory && Math.abs(ground - y) > (kind === 'cottage' ? 2 : 3)) return false;
      }
    if (kind === 'cottage' && !mandatory) {
      for (let dx = -rx - 1; dx <= rx + 1; dx++)
        for (let dz = -rz - 1; dz <= rz + 1; dz++) heights.set(cell(x + dx, z + dz), y);
    }
    // Check the actual solid cells as well as the conservative spacing envelope.
    for (const b of blocks) {
      const ground = heights.get(cell(x + b.x, z + b.z));
      if (ground === undefined || y + 1 + b.y <= ground || (b.y === 0 && ground !== y)) return false;
    }
    const prop: Prop = { kind, x, y: y + 1, z, rx, rz, blocks };
    world.props.push(prop);
    // Reserve the footprint, while the next object tests its own extra clearance.
    for (let dx = -rx; dx <= rx; dx++) for (let dz = -rz; dz <= rz; dz++) reserved.add(cell(x + dx, z + dz));
    for (const b of blocks) world.blocks.push({ ...b, x: x + b.x, y: prop.y + b.y, z: z + b.z });
    if (kind === 'cottage') world.emitters.push({ x: x - 1.5, y: prop.y + 11, z: z - 1.5, kind: 'smoke' });
    if (kind === 'cauldron' || kind === 'campfire')
      world.emitters.push({ x, y: prop.y + 3, z, kind: kind === 'campfire' ? 'fire' : 'magic' });
    return true;
  }
  place('cottage', ax, 3, propsRng, true);
  // The front door leads to a reserved path all the way to the coastline.
  for (let z = 10; heights.has(cell(ax, z)); z++) for (let dx = -1; dx <= 1; dx++) reserved.add(cell(ax + dx, z));
  const kinds =
    spec.biome === 'volcanic'
      ? ['crystal', 'rock', 'campfire', 'cauldron']
      : spec.biome === 'oasis'
        ? ['palm', 'cactus', 'bush', 'rock']
        : spec.biome === 'snow'
          ? ['pine', 'pine', 'rock', 'campfire']
          : spec.biome === 'mushroom'
            ? ['giant mushroom', 'giant mushroom', 'tree', 'cauldron', 'mushroom']
            : ['tree', 'pine', 'tree', 'mushroom', 'bush', 'cauldron', 'campfire'];
  const positions = [...heights.keys()].map((k) => k.split(',').map(Number) as [number, number]);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(propsRng() * (i + 1));
    [positions[i], positions[j]] = [positions[j]!, positions[i]!];
  }
  // Larger objects first; small decoration cannot consume the usable building sites.
  if (spec.biome === 'village') {
    for (const [x, z] of positions)
      if (world.props.filter((p) => p.kind === 'cottage').length < 3) place('cottage', x, z, propsRng);
  }
  const canopy =
    spec.biome === 'mushroom'
      ? 'giant mushroom'
      : spec.biome === 'snow'
        ? 'pine'
        : spec.biome === 'oasis'
          ? 'palm'
          : spec.biome === 'volcanic'
            ? 'crystal'
            : 'tree';
  for (const [x, z] of positions) {
    if (world.props.filter((p) => p.kind === canopy).length >= 5 + Math.floor(spec.density * 4)) break;
    place(canopy, x, z, propsRng);
  }
  const signatures =
    spec.biome === 'snow'
      ? ['snowman', 'lantern']
      : spec.biome === 'volcanic'
        ? ['basalt spire', 'cauldron']
        : spec.biome === 'village'
          ? ['crop patch', 'well', 'lantern']
          : spec.biome === 'oasis'
            ? ['well', 'lantern']
            : ['fern', 'lantern', 'cauldron'];
  for (const kind of signatures) for (const [x, z] of positions) if (place(kind, x, z, propsRng)) break;
  const target = Math.floor(18 + spec.density * 12);
  for (const [x, z] of positions) {
    if (world.props.length >= target) break;
    place(kinds[Math.floor(propsRng() * kinds.length)] ?? 'tree', x, z, propsRng);
  }
  for (const [x, z] of positions) {
    if (detailRng() > 0.13) continue;
    place(spec.biome === 'volcanic' ? 'rock' : spec.biome === 'snow' ? 'snow tuft' : 'flower', x, z, detailRng);
  }
  for (const [k, h] of heights) {
    const [x = 0, z = 0] = k.split(',').map(Number);
    for (let y = -6; y <= h; y++) world.blocks.push({ x, y, z, material: terrainMaterial(spec, x, y, z, h) });
  }
  for (const [k, h] of seabed) {
    const [x = 0, z = 0] = k.split(',').map(Number);
    for (let y = -6; y <= h; y++) world.blocks.push({ x, y, z, material: y === h ? 'worldSand' : 'worldStone' });
  }
  populateHarbour(world, seed);
  return world;
}
