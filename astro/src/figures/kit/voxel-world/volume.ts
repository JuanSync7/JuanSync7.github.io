import type { Block, World } from './types';
import policy from './policy.json';

/** Bounded transient lookup shared by face culling and corner contact shading. */
export function solidVolume(blocks: Block[], world?: World) {
  if (!blocks.length) throw new Error('VXL-VOLUME: empty solid');
  let x0 = Infinity,
    y0 = Infinity,
    z0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity,
    z1 = -Infinity;
  for (const b of blocks) {
    x0 = Math.min(x0, b.x - 2);
    y0 = Math.min(y0, b.y - 2);
    z0 = Math.min(z0, b.z - 2);
    x1 = Math.max(x1, b.x + 2);
    y1 = Math.max(y1, b.y + 2);
    z1 = Math.max(z1, b.z + 2);
  }
  const nx = x1 - x0 + 1,
    ny = y1 - y0 + 1,
    nz = z1 - z0 + 1;
  const count = nx * ny * nz;
  if (!Number.isSafeInteger(count) || count > policy.maxVolumeCells) throw new Error('VXL-VOLUME: lookup budget');
  const data = new Uint8Array(count);
  const index = (x: number, y: number, z: number): number => y - y0 + (x - x0) * ny + (z - z0) * ny * nx;
  if (world)
    for (const [k, h] of new Map([...world.seabed, ...world.heights])) {
      const [x = 0, z = 0] = k.split(',').map(Number),
        bottom = world.bottoms.get(k) ?? policy.baseLevel;
      data.fill(1, index(x, bottom, z), index(x, h, z) + 1);
      const roof = world.roofs.get(k);
      if (roof !== undefined) data.fill(1, index(x, world.ceilings.get(k) ?? roof, z), index(x, roof + 2, z) + 1);
    }
  for (const b of blocks) data[index(b.x, b.y, b.z)] = 1;
  const solid = (x: number, y: number, z: number): boolean =>
    x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1 && data[index(x, y, z)] === 1;
  return { solid, cells: count };
}
