import { noise2, fbm } from '../noise';
import { stream } from './seeds';
import { cell, THEMES, TREES, type Biome, type Material, type World } from './types';
import type { Environment, Substrate } from './ecology-types';

const rainfall: Record<Biome, number> = {
  woodland: 0.6,
  rainforest: 0.95,
  plains: 0.45,
  mushroom: 0.8,
  desert: 0.08,
  oasis: 0.3,
  snow: 0.5,
  tundra: 0.3,
  frozen: 0.1,
  volcanic: 0.05,
  wasteland: 0.1,
  caves: 0.65,
  village: 0.45,
  city: 0.3,
};

/** Multi-source shoreline distance: a wet biome alone does not put reeds beside water. */
function waterDistances(world: World): Map<string, number> {
  const distance = new Map<string, number>(),
    queue: [number, number][] = [];
  for (const [k, liquid] of world.liquids)
    if (liquid.kind === 'water') {
      const [x = 0, z = 0] = k.split(',').map(Number);
      distance.set(k, 0);
      queue.push([x, z]);
    }
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (!p) continue;
    const [x, z] = p,
      d = distance.get(cell(x, z)) ?? 0;
    if (d >= 16) continue;
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + (dx ?? 0),
        nz = z + (dz ?? 0),
        k = cell(nx, nz);
      if (!distance.has(k) && world.heights.has(k)) {
        distance.set(k, d + 1);
        queue.push([nx, nz]);
      }
    }
  }
  return distance;
}

function substrate(biome: Biome, slope: number, patch: number): Substrate {
  if (biome === 'desert' || biome === 'oasis') return slope >= 4 && patch > 0.45 ? 'rock' : 'sand';
  if (biome === 'volcanic' || biome === 'wasteland') return patch > 0.65 ? 'rock' : 'ash';
  if (biome === 'frozen') return patch > 0.58 ? 'ice' : 'snow';
  if (biome === 'snow') return slope > 3 && patch > 0.45 ? 'rock' : 'snow';
  if (biome === 'tundra') return patch > 0.65 ? 'snow' : slope > 3 ? 'rock' : 'soil';
  if (biome === 'caves') return 'rock';
  return slope > 4 && patch > 0.6 ? 'rock' : 'soil';
}

function cover(biome: Biome, e: Environment): Material {
  if (e.substrate === 'ice') return 'worldIce';
  if (e.substrate === 'snow') return 'worldSnow';
  if (e.substrate === 'rock') return biome === 'volcanic' ? 'line3' : 'worldStone';
  if (e.substrate === 'ash') return e.patch > 0.5 ? 'line4' : 'worldEarth';
  if (e.substrate === 'sand') return e.patch > 0.76 ? 'worldEarth' : 'worldSand';
  if (biome === 'mushroom') return e.patch > 0.63 ? 'worldLilac' : e.patch < 0.3 ? 'worldEarth' : 'worldMoss';
  if (biome === 'rainforest' || biome === 'woodland') return e.patch < 0.26 ? 'worldEarth' : 'worldMoss';
  if (biome === 'tundra') return e.patch < 0.35 ? 'worldEarth' : 'worldMoss';
  if (biome === 'plains') return e.moisture < 0.38 && e.patch > 0.66 ? 'worldSand' : 'worldMoss';
  return THEMES[biome].ground;
}

export function buildEcology(world: World): void {
  const noise = noise2(stream(world.spec.layoutSeed, 'ecology/fields')),
    water = waterDistances(world);
  for (const [k, h] of world.heights) {
    const [x = 0, z = 0] = k.split(',').map(Number),
      biome = world.biomes.get(k) ?? world.spec.biome;
    const neighbors = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].map(([dx = 0, dz = 0]) => world.heights.get(cell(x + dx, z + dz)) ?? h);
    const slope = Math.max(h, ...neighbors) - Math.min(h, ...neighbors);
    const patch = Math.max(0, Math.min(1, 0.5 + fbm(noise, x * 0.08, z * 0.08, 3) * 0.8));
    const wd = water.get(k) ?? 17;
    const moisture = Math.max(
      0,
      Math.min(1, rainfall[biome] + noise(x * 0.035 + 93, z * 0.035) * 0.24 + Math.max(0, 1 - wd / 8) * 0.35),
    );
    const e: Environment = {
      slope,
      patch,
      moisture,
      waterDistance: wd,
      shade: 0,
      substrate: substrate(biome, slope, patch),
    };
    world.environment.set(k, e);
    world.surface.set(k, cover(biome, e));
  }
}

/** Canopy cover is measured after trees exist; floor dressing reads these local conditions. */
export function shadeCanopy(world: World): void {
  for (const p of world.props)
    if (TREES.has(p.kind) || p.kind === 'giant mushroom') {
      for (const b of p.blocks)
        if (b.y > 2 && !['worldWood', 'worldSnow', 'worldSand'].includes(b.material)) {
          const e = world.environment.get(cell(p.x + b.x, p.z + b.z));
          if (e) e.shade = 1;
        }
    }
}

export function environmentAt(world: World, x: number, z: number): Environment | undefined {
  return world.environment.get(cell(x, z));
}
