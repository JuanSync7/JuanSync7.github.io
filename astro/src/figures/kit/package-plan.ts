/** The plan of a phone processor's package, TSMC InFO-PoP as in Apple's A-series, shared by
 *  every layer that lines up with another (`kit/package.ts`, `kit/package-memory.ts`). One
 *  unit ≈ 4.5 mm across, so the package is about 14 × 13 mm; heights are drawn about three
 *  times true so the layers read. */

/** The package's half sizes: the fan-out wiring, the mould and the memory share them. */
export const PKG = { a: 1.55, b: 1.45 };
/** The processor die's half sizes (about 10 × 9 mm) and thickness. */
export const DIE = { a: 1.1, b: 1.0, h: 0.14 };

/** Points round a rectangle of half sizes (a, b), every `pitch` along its sides. */
export function ringOf(a: number, b: number, pitch: number): [number, number][] {
  const out: [number, number][] = [];
  const nx = Math.round((2 * a) / pitch);
  const nz = Math.round((2 * b) / pitch);
  for (let i = 0; i <= nx; i++) for (const z of [-b, b]) out.push([-a + (i * 2 * a) / nx, z]);
  for (let j = 1; j < nz; j++) for (const x of [-a, a]) out.push([x, -b + (j * 2 * b) / nz]);
  return out;
}

/** The through-InFO vias, two rows round the die, and the package-on-package balls that land
 *  on them: the same points, so every ball has a post under it. */
export const TIV = [...ringOf(PKG.a - 0.12, PKG.b - 0.12, 0.11), ...ringOf(PKG.a - 0.24, PKG.b - 0.24, 0.11)];
export const INNER = TIV.filter(([x, z]) => Math.abs(x) < PKG.a - 0.18 && Math.abs(z) < PKG.b - 0.18);
