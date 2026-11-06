import { fbm, noise2 } from '../noise';
import { mulberry32 } from '../rng';
import { cell, type Liquid, type Landmark, type Material, type WorldSpec } from './types';

/** Biomes change the height field itself, rather than just recolouring the same island. */
export function terrain(spec: WorldSpec, seed: number) {
  const rng = mulberry32(seed ^ 318791);
  const noise = noise2(rng);
  const heights = new Map<string, number>();
  const liquids = new Map<string, Liquid>();
  const seabed = new Map<string, number>();
  const landmarks: Landmark[] = [];
  const peakRoll = rng();
  const peakX =
    spec.biome === 'woodland' || spec.biome === 'mushroom'
      ? -5 - Math.floor(peakRoll * 3)
      : Math.round((peakRoll - 0.5) * 6);
  const peakZ = -8 - Math.floor(rng() * 3);
  const amplitude = 0.9 + rng() * 0.2;
  for (let x = -spec.radius - 3; x <= spec.radius + 3; x++)
    for (let z = -spec.radius - 3; z <= spec.radius + 3; z++) {
      const distance = Math.hypot(x / spec.stretch, z) / spec.radius;
      if (distance + fbm(noise, x * 0.11 + 21, z * 0.11) * 0.27 > 0.97) continue;
      const n = fbm(noise, x * 0.09, z * 0.09);
      const d = Math.hypot((x - peakX) * 0.9, z - peakZ);
      let relief = 0;
      if (spec.biome === 'woodland') relief = Math.max(0, 12 - d * 1.1) + n * 4;
      if (spec.biome === 'mushroom')
        relief = d < 7 ? 8 + Math.floor(n * 4) : Math.max(0, 5 - Math.abs(x + 10) * 0.8 - Math.abs(z + 1) * 0.3);
      if (spec.biome === 'snow')
        relief = Math.max(0, 17 - d * 1.55) + Math.max(0, 12 - Math.hypot(x + 9, z + 7) * 1.5) + n * 3;
      if (spec.biome === 'volcanic') relief = Math.max(0, 13 - Math.abs(d - 4.3) * 1.9);
      if (spec.biome === 'oasis')
        relief =
          Math.max(0, 7 - d * 0.65) +
          Math.max(0, Math.sin(x * 0.25 + z * 0.13 + seed) * 3) * Math.max(0, -z / spec.radius);
      if (spec.biome === 'village') relief = Math.floor(Math.max(0, 10 - d) / 2) * 2;
      const shore = Math.min(1, Math.max(0, (1 - distance) * 5));
      heights.set(cell(x, z), Math.max(1, Math.floor(1 + (2 + relief * amplitude + n * 2) * shore)));
    }
  // Only the actual building platform is level; the surrounding ridges retain their profile.
  for (let x = spec.anchor - 5; x <= spec.anchor + 5; x++) for (let z = -4; z <= 10; z++) heights.set(cell(x, z), 4);
  const visited = new Set<string>([cell(0, 0)]),
    queue: [number, number][] = [[0, 0]];
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i] ?? [0, 0];
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + (dx ?? 0),
        nz = z + (dz ?? 0),
        k = cell(nx, nz);
      if (heights.has(k) && !visited.has(k)) {
        visited.add(k);
        queue.push([nx, nz]);
      }
    }
  }
  for (const k of heights.keys()) if (!visited.has(k)) heights.delete(k);
  const lake = (cx: number, cz: number, radius: number, level: number, kind: Liquid['kind']): void => {
    for (let dx = -radius - 1; dx <= radius + 1; dx++)
      for (let dz = -radius - 1; dz <= radius + 1; dz++) {
        const k = cell(cx + dx, cz + dz);
        if (!heights.has(k)) continue;
        if (Math.hypot(dx, dz) <= radius) {
          heights.set(k, level - 2);
          liquids.set(k, { level, bottom: level - 1, kind });
        } else if (Math.hypot(dx, dz) <= radius + 1) heights.set(k, Math.max(level, heights.get(k) ?? level));
      }
    landmarks.push({
      kind: kind === 'lava' ? 'lava crater' : kind === 'ice' ? 'frozen tarn' : 'oasis pool',
      x: cx,
      z: cz,
      height: level,
    });
  };
  if (spec.biome === 'volcanic') lake(peakX, peakZ, 3, 14, 'lava');
  if (spec.biome === 'snow') lake(-10, -1, 2, 5, 'ice');
  if (spec.biome === 'oasis') lake(spec.anchor + 10, 0, 3, 3, 'water');
  if (spec.biome === 'woodland' || spec.biome === 'mushroom') {
    const rx = -10;
    const source = spec.biome === 'woodland' ? 10 : 9;
    for (let z = -10; z <= spec.radius; z++) {
      const k = cell(rx, z);
      if (!heights.has(k)) continue;
      const level = Math.max(0, source - Math.floor((z + 10) / 3) - (z >= -1 ? 4 : 0));
      const top = z === -1 ? level + 4 : level;
      heights.set(k, level - 1);
      liquids.set(k, { level: top, bottom: level, kind: 'water' });
      for (const dx of [-1, 1])
        if (heights.has(cell(rx + dx, z)))
          heights.set(cell(rx + dx, z), Math.max(level, heights.get(cell(rx + dx, z)) ?? 0));
    }
    landmarks.push({ kind: 'waterfall', x: rx, z: -1, height: source - 3 });
  }
  const extent = spec.radius + 7;
  for (let x = -extent; x <= extent; x++)
    for (let z = -extent; z <= extent; z++) {
      if ((Math.abs(x) / (extent + 0.5)) ** 6 + (Math.abs(z) / (extent + 0.5)) ** 6 > 1) continue;
      const k = cell(x, z);
      if (heights.has(k)) continue;
      const floor = -4 + Math.floor(noise(x * 0.17, z * 0.17) * 1.5);
      seabed.set(k, floor);
      liquids.set(k, {
        level: 0,
        bottom: floor + 1,
        kind: spec.biome === 'snow' && z < -10 + Math.floor(noise(x * 0.12, z * 0.12) * 5) ? 'ice' : 'water',
      });
    }
  const tallest = [...heights].reduce((a, b) => (b[1] > a[1] ? b : a));
  const [tx = 0, tz = 0] = tallest[0].split(',').map(Number);
  landmarks.push({ kind: `${spec.biome} ridge`, x: tx, z: tz, height: tallest[1] });
  return { heights, liquids, seabed, landmarks };
}

export function terrainMaterial(spec: WorldSpec, x: number, y: number, z: number, height: number): Material {
  if (y < height - 3) return spec.biome === 'oasis' ? 'worldSand' : spec.biome === 'volcanic' ? 'line3' : 'worldStone';
  if (y < height)
    return spec.biome === 'mushroom' && y % 3 === 0
      ? 'worldLilac'
      : spec.biome === 'oasis'
        ? 'worldSand'
        : 'worldEarth';
  if (Math.abs(x - spec.anchor) <= 1 && z >= 10) return 'worldSand';
  if (spec.biome === 'snow') return height >= 7 ? 'worldSnow' : height <= 1 ? 'worldStone' : 'worldMoss';
  if (spec.biome === 'volcanic') return 'line4';
  if (spec.biome === 'oasis' || height <= 2) return 'worldSand';
  return spec.biome === 'mushroom' && height > 8 ? 'worldLilac' : 'worldMoss';
}
