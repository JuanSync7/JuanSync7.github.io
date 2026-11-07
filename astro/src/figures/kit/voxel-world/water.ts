import { cell, type World } from './types';

export const WAVE_TERMS = [
  { x: 0.28, z: 0.19, speed: 1.4, amplitude: 0.11 },
  { x: 0, z: 0.45, speed: 1.8, amplitude: 0.04 },
] as const;

/** CPU boats and GPU surface compile from the same bounded wave parameters. */
export function swell(x: number, z: number, time: number): number {
  let y = 0;
  for (const term of WAVE_TERMS) y += Math.sin(x * term.x + z * term.z - time * term.speed) * term.amplitude;
  return y;
}
export function waveGLSL(x: string, z: string, t: string): string {
  const f = (n: number): string => n.toFixed(8);
  return WAVE_TERMS.map((w) => `sin((${x})*${f(w.x)}+(${z})*${f(w.z)}-(${t})*${f(w.speed)})*${f(w.amplitude)}`).join(
    '+',
  );
}
export function boatClearance(world: World, x: number, z: number): boolean {
  if (world.structures.some((s) => Math.abs(s.x - x) <= s.rx + 1 && Math.abs(s.z - z) <= s.rz + 1)) return false;
  return !world.boats.some((b) => Math.abs(b.x - x) <= b.rx + 1 && Math.abs(b.z - z) <= b.rz + 1);
}
export function shoreCell(world: World, x: number, z: number): boolean {
  return [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ].some(([dx = 0, dz = 0]) => {
    const k = cell(x + dx, z + dz);
    return world.heights.has(k) && !world.liquids.has(k);
  });
}
