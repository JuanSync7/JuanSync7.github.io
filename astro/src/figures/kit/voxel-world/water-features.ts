import { cell, COLD, type Landmark, type Liquid, type WorldSpec } from './types';
import { integer, stream } from './seeds';

export function addWaterFeatures(
  spec: WorldSpec,
  heights: Map<string, number>,
  liquids: Map<string, Liquid>,
  landmarks: Landmark[],
  cx: number,
  cz: number,
): void {
  const rng = stream(spec.layoutSeed, 'hydrology');
  const kind: Liquid['kind'] = COLD.has(spec.biome) ? 'ice' : 'water';
  const lake = (x: number, z: number, radius: number, level: number, liquid: Liquid['kind']): void => {
    let count = 0;
    for (let dx = -radius - 1; dx <= radius + 1; dx++)
      for (let dz = -radius - 1; dz <= radius + 1; dz++) {
        const k = cell(x + dx, z + dz),
          floor = heights.get(k);
        if (floor === undefined) continue;
        const d = Math.hypot(dx, dz);
        if (d <= radius) {
          heights.set(k, level - 2);
          liquids.set(k, { level, bottom: level - 1, kind: liquid });
          count++;
        } else if (d <= radius + 1) heights.set(k, Math.max(level, floor));
      }
    if (count)
      landmarks.push({
        kind: liquid === 'lava' ? 'lava crater' : liquid === 'ice' ? 'frozen lake' : 'pond',
        x,
        z,
        height: level,
      });
  };
  if (spec.biome === 'volcanic' || spec.landform === 'caldera')
    lake(cx, cz, Math.max(3, Math.floor(spec.radius * 0.14)), Math.max(10, Math.floor(24 * spec.relief)), 'lava');
  else if (spec.wet && ['valley', 'canyon'].includes(spec.landform)) {
    const rz = Math.round(spec.radius * spec.stretch);
    for (let z = -rz; z <= rz; z++) {
      const x = Math.round(Math.sin(z * 0.08 + rng() * 0.01) * spec.radius * 0.1);
      const level = 3 + Math.floor(((rz - z) / (rz * 2)) * 4);
      for (const dx of [-2, 2]) {
        const k = cell(x + dx, z),
          h = heights.get(k);
        if (h !== undefined) heights.set(k, Math.max(h, level));
      }
      for (let dx = -1; dx <= 1; dx++) {
        const k = cell(x + dx, z);
        if (!heights.has(k)) continue;
        heights.set(k, level - 2);
        liquids.set(k, { level, bottom: level - 1, kind });
      }
    }
    landmarks.push({ kind: 'river', x: 0, z: 0, height: 5 });
  } else if (spec.wet && spec.biome !== 'city') {
    const x = integer(rng, -Math.floor(spec.radius * 0.4), Math.floor(spec.radius * 0.4));
    const z = integer(rng, -Math.floor(spec.radius * spec.stretch * 0.4), Math.floor(spec.radius * spec.stretch * 0.4));
    const level = heights.get(cell(x, z));
    if (level !== undefined) lake(x, z, integer(rng, 2, 5), Math.max(3, level), kind);
  }
}
