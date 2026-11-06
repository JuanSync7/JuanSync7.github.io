import { cell, COLD, THEMES, type Biome, type Material, type World } from './types';

export function groundMaterial(biome: Biome, x: number, y: number, z: number, h: number): Material {
  if (y < h - 3)
    return biome === 'desert' || biome === 'oasis' ? 'worldSand' : biome === 'volcanic' ? 'line3' : 'worldStone';
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
  const floors = new Map([...world.seabed, ...world.heights]);
  for (const [k, h] of floors) {
    const [x = 0, z = 0] = k.split(',').map(Number),
      biome = world.biomes.get(k) ?? world.spec.biome;
    const adjacent = Math.min(
      ...[
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].map(([dx = 0, dz = 0]) => floors.get(cell(x + dx, z + dz)) ?? -7),
    );
    const first = Math.max(-6, Math.min(h, adjacent + 1));
    const put = (y: number): void => {
      world.blocks.push({
        x,
        y,
        z,
        material: world.paths.has(k) && y === h ? 'worldSand' : groundMaterial(biome, x, y, z, h),
      });
    };
    for (let y = first; y <= h; y++) put(y);
    if (first > -6) put(-6);
  }
  for (const [k, y] of world.roofs) {
    const [x = 0, z = 0] = k.split(',').map(Number);
    for (let dy = (world.ceilings.get(k) ?? y) - y; dy < 3; dy++)
      world.blocks.push({ x, y: y + dy, z, material: dy === 2 ? 'worldStone' : 'line4' });
  }
}
