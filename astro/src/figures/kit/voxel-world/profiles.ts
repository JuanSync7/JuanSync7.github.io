import type { Biome, WorldSpec } from './types';

export function biomeHeight(biome: Biome, x: number, z: number, n: number, phase: number): number {
  if (biome === 'desert' || biome === 'oasis')
    return 7 + Math.sin(x * 0.19 + z * 0.07 + phase) * 3.8 + Math.sin(z * 0.15 - phase) * 2 + n * 2;
  if (biome === 'frozen' || biome === 'snow')
    return 7 + Math.abs(n) * 22 + Math.max(0, Math.sin(x * 0.13 + phase) * Math.cos(z * 0.1)) * 9;
  if (biome === 'mushroom') return 4 + Math.floor(Math.max(0, n + 0.3) * 5) * 2.5;
  if (biome === 'city' || biome === 'village') return 4 + Math.floor((n + 0.4) * 3);
  if (biome === 'plains') return 4 + n * 5;
  if (biome === 'tundra') return 5 + n * 8;
  if (biome === 'wasteland' || biome === 'volcanic') return 6 + Math.abs(n) * 15;
  return 7 + n * (biome === 'rainforest' ? 15 : 10);
}

export function landscapeHeight(
  spec: WorldSpec,
  x: number,
  z: number,
  base: number,
  n: number,
  cx: number,
  cz: number,
): number {
  const u = x / spec.radius,
    v = z / (spec.radius * spec.stretch);
  if (spec.landform === 'valley')
    return 5 - v * 2 + Math.abs(u + Math.sin(v * 3) * 0.13) ** 1.6 * 14 * spec.relief + n * 3;
  if (spec.landform === 'alps')
    return 4 + Math.abs(Math.sin(u * 3.8 + 0.6) * Math.cos(v * 2.9)) ** 1.1 * 29 * spec.relief + n * 4;
  if (spec.landform === 'dunes') return 4 + (1 + Math.sin((x * 0.18 + z * 0.07) * spec.relief + cx)) * 4 + n * 2;
  if (spec.landform === 'canyon')
    return 5 - v * 2 + Math.min(1, Math.abs(u + Math.sin(v * 4) * 0.18) * 2.5) ** 0.65 * 16 * spec.relief + n * 3;
  if (spec.landform === 'caldera' || spec.biome === 'volcanic') {
    const d = Math.hypot(x - cx, z - cz),
      ring = spec.radius * 0.24;
    return Math.max(base, 6 + Math.max(0, 22 * spec.relief - Math.abs(d - ring) * 2.4));
  }
  return Math.max(2, base * spec.relief + n * 3);
}
