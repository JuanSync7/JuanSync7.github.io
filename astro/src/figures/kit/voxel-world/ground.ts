import { cell, COLD, THEMES, type Biome, type Material, type World } from './types';
import { BASE_LEVEL, neighbours, shapeBase } from './edges';

export function groundMaterial(biome: Biome, x: number, y: number, z: number, h: number): Material {
  if (y < h - 3) {
    const layer = Math.floor((y + Math.sin(x * 0.13) * 1.2 + Math.cos(z * 0.11)) / 3);
    if (biome === 'desert' || biome === 'oasis') return layer % 3 === 0 ? 'worldEarth' : 'worldSand';
    if (biome === 'frozen' || biome === 'snow') return layer % 3 === 0 ? 'worldStone' : 'worldIce';
    if (biome === 'volcanic' || biome === 'wasteland') return layer % 3 === 0 ? 'worldEarth' : 'line3';
    return layer % 4 === 0 ? 'worldEarth' : 'worldStone';
  }
  if (y < h)
    return biome === 'mushroom' && y % 3 === 0
      ? 'worldLilac'
      : ['desert', 'oasis'].includes(biome)
        ? 'worldSand'
        : 'worldEarth';
  if (COLD.has(biome)) return biome === 'tundra' && (x * 17 + z * 13) % 5 ? 'worldMoss' : 'worldSnow';
  return THEMES[biome].ground;
}

/** Emit the closed surface of solid columns; buried voxels never enter GPU buffers. */
export function buildGround(world: World): void {
  shapeBase(world);
  const floors = new Map([...world.seabed, ...world.heights]);
  for (const [k, h] of floors) {
    const [x = 0, z = 0] = k.split(',').map(Number),
      biome = world.biomes.get(k) ?? world.spec.biome;
    const bottom = world.bottoms.get(k) ?? BASE_LEVEL;
    const exposed = new Set([bottom, h]);
    for (const [dx, dz] of neighbours) {
      const next = cell(x + dx, z + dz),
        top = floors.get(next),
        low = world.bottoms.get(next);
      if (top === undefined || low === undefined) {
        for (let y = bottom; y <= h; y++) exposed.add(y);
      } else {
        for (let y = Math.max(bottom, top + 1); y <= h; y++) exposed.add(y);
        for (let y = bottom; y < Math.min(low, h + 1); y++) exposed.add(y);
      }
    }
    const put = (y: number): void => {
      world.blocks.push({
        x,
        y,
        z,
        material: world.paths.has(k) && y === h ? 'worldSand' : groundMaterial(biome, x, y, z, h),
      });
    };
    for (const y of exposed) put(y);
  }
  for (const [k, y] of world.roofs) {
    const [x = 0, z = 0] = k.split(',').map(Number);
    for (let dy = (world.ceilings.get(k) ?? y) - y; dy < 3; dy++)
      world.blocks.push({ x, y: y + dy, z, material: dy === 2 ? 'worldStone' : 'line4' });
  }
}
