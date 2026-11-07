import { mulberry32 } from '../rng';
import { model } from './models';
import { cell, type Block, type World } from './types';

/** Boat envelopes include the complete sail, hull, bob and roll clearance. */
export function populateHarbour(world: World, seed: number): void {
  const rng = mulberry32(seed ^ 67183);
  // The main path reaches a small piled pier, so the boats belong to a harbour.
  const dx = world.spec.anchor;
  let shore = 10;
  while (world.heights.has(cell(dx, shore + 1))) shore++;
  const dock: Block[] = [];
  for (let z = shore + 1; z <= shore + 3; z++)
    for (let x = dx - 1; x <= dx + 1; x++) {
      const water = world.liquids.get(cell(x, z));
      if (!water || water.level !== 0 || world.heights.has(cell(x, z))) continue;
      dock.push({ x: x - dx, y: 2, z: z - shore, material: 'worldWood' });
      if (Math.abs(x - dx) === 1 && (z === shore + 1 || z === shore + 3)) {
        const floor = world.seabed.get(cell(x, z)) ?? -4;
        for (let y = floor + 1; y <= 3; y++)
          if (y !== 2) dock.push({ x: x - dx, y, z: z - shore, material: 'worldWood' });
      }
    }
  if (dock.length) {
    world.structures.push({ kind: 'pier', x: dx, z: shore, y: 0, rx: 1, rz: 3, blocks: dock });
    for (const b of dock) world.blocks.push({ ...b, x: dx + b.x, z: shore + b.z });
  }
  const candidates: [number, number][] = [];
  const r = world.spec.radius;
  for (let z = r + 3; z >= r; z--) for (let x = -12; x <= 12; x += 2) candidates.push([x, z]);
  const offset = Math.floor(rng() * candidates.length);
  for (let i = 0; i < candidates.length && world.boats.length < 2; i++) {
    const [x, z] = candidates[(i + offset) % candidates.length] ?? [0, r + 3];
    const blocks = model('sailboat', world.spec, rng);
    const rx = 2,
      rz = 3;
    let clear = true;
    for (let dx = -rx - 1; dx <= rx + 1; dx++)
      for (let dz = -rz - 1; dz <= rz + 1; dz++) {
        const water = world.liquids.get(cell(x + dx, z + dz));
        if (!water || water.kind !== 'water' || water.level !== 0 || world.heights.has(cell(x + dx, z + dz)))
          clear = false;
      }
    if (world.boats.some((b) => Math.abs(b.x - x) <= b.rx + rx + 3 && Math.abs(b.z - z) <= b.rz + rz + 3))
      clear = false;
    if (world.structures.some((s) => Math.abs(s.x - x) <= s.rx + rx + 2 && Math.abs(s.z - z) <= s.rz + rz + 2))
      clear = false;
    if (clear) world.boats.push({ kind: 'sailboat', x, z, y: 1, rx, rz, blocks });
  }
}
