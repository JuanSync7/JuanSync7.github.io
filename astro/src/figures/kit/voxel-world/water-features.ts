import { cell, COLD, type Landmark, type Liquid, type WorldSpec } from './types';
import { integer, stream } from './seeds';
import { noise2 } from '../noise';

/** Water is carved before ecology and placement. Every column has a real bed and bank. */
export function addWaterFeatures(
  spec: WorldSpec,
  heights: Map<string, number>,
  liquids: Map<string, Liquid>,
  landmarks: Landmark[],
  cx: number,
  cz: number,
): void {
  const rng = stream(spec.layoutSeed, 'hydrology'),
    noise = noise2(stream(spec.layoutSeed, 'hydrology/shore'));
  const kind: Liquid['kind'] = COLD.has(spec.biome) ? 'ice' : 'water';
  const lake = (x: number, z: number, radius: number, level: number, liquid: Liquid['kind']): void => {
    let count = 0;
    for (let dx = -radius - 3; dx <= radius + 3; dx++)
      for (let dz = -radius - 3; dz <= radius + 3; dz++) {
        const k = cell(x + dx, z + dz),
          floor = heights.get(k);
        if (floor === undefined) continue;
        const d = Math.hypot(dx, dz) + noise((x + dx) * 0.24, (z + dz) * 0.24) * 0.9;
        if (d <= radius) {
          const depth = d < radius * 0.6 ? 3 : 2;
          heights.set(k, level - depth);
          liquids.set(k, { level, bottom: level - depth + 1, kind: liquid });
          count++;
        } else if (d <= radius + 2.5) {
          const blend = Math.min(1, (d - radius) / 2.5);
          heights.set(k, Math.max(level, Math.round(level + (floor - level) * blend)));
        }
      }
    if (count)
      landmarks.push({
        kind: liquid === 'lava' ? 'lava crater' : liquid === 'ice' ? 'frozen lake' : 'woodland pool',
        x,
        z,
        height: level,
      });
  };
  if (spec.biome === 'volcanic' || spec.landform === 'caldera') {
    lake(cx, cz, Math.max(4, Math.floor(spec.radius * 0.17)), Math.max(10, Math.floor(24 * spec.relief)), 'lava');
  } else if (spec.wet && ['valley', 'canyon'].includes(spec.landform)) {
    const rz = Math.round(spec.radius * spec.stretch),
      phase = rng() * 6;
    let rapids = 0;
    for (let z = -rz; z <= rz; z++) {
      const x = Math.round(Math.sin(z * 0.07 + phase) * spec.radius * 0.11),
        level = 3 + Math.floor(((rz - z) / (rz * 2)) * 10),
        width = 2 + (noise(0, z * 0.09) > 0.15 ? 1 : 0);
      for (let dx = -width - 2; dx <= width + 2; dx++) {
        const k = cell(x + dx, z),
          h = heights.get(k);
        if (h === undefined) continue;
        if (Math.abs(dx) <= width) {
          heights.set(k, level - 3);
          liquids.set(k, { level, bottom: level - 2, kind });
        } else heights.set(k, Math.max(level, Math.min(h, level + Math.abs(dx) - width)));
      }
      if (z % Math.max(1, Math.floor(rz / 5)) === 0 && Math.abs(z) < rz * 0.75 && rapids < 3) {
        landmarks.push({ kind: kind === 'ice' ? 'frozen cascade' : 'river rapids', x, z, height: level });
        rapids++;
      }
    }
  } else if (spec.wet && spec.biome !== 'city') {
    const count =
      spec.biome === 'rainforest'
        ? integer(rng, 2, 4)
        : spec.biome === 'oasis'
          ? integer(rng, 1, 3)
          : integer(rng, 1, 2);
    const used: { x: number; z: number; r: number }[] = [];
    for (let i = 0; i < count; i++) {
      const x = integer(rng, -Math.floor(spec.radius * 0.55), Math.floor(spec.radius * 0.55)),
        z = integer(rng, -Math.floor(spec.radius * spec.stretch * 0.55), Math.floor(spec.radius * spec.stretch * 0.55)),
        r = integer(rng, 3, spec.biome === 'oasis' ? 8 : 6);
      const level = heights.get(cell(x, z));
      if (level === undefined || used.some((p) => Math.hypot(p.x - x, p.z - z) < p.r + r + 5)) continue;
      lake(x, z, r, Math.max(3, level), kind);
      used.push({ x, z, r });
    }
  }
}
