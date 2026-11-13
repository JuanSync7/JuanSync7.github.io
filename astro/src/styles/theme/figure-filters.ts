import { night, type NightKey } from '../tokens/palette';
import paperCss from '../tokens/paper.css?raw';

/** Figures are drawn in the night palette; on paper pages an SVG colour matrix maps that palette
 *  onto the page's own: night ground to the paper ground, the greys along the paper's ink ramp, the
 *  signal to the paper signal. The matrices are fitted here at build time from the tokens in
 *  `tokens/paper.css`, so changing the paper palette changes the figures with it: there is no
 *  hand-copied number to forget. */

type Rgb = [number, number, number];
const hex = (h: string): Rgb => {
  const n = Number.parseInt(h.replace('#', '').slice(0, 6), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
const lum = ([r, g, b]: Rgb): number => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Reads `--pp-<name>` from the token file as a [day, night] pair of hex colours. */
export function paperPair(name: string): [string, string] {
  const m = paperCss.match(new RegExp(`--pp-${name}:\\s*light-dark\\(\\s*(#[0-9a-fA-F]{6})\\s*,\\s*(#[0-9a-fA-F]{6})\\s*\\)`));
  if (!m?.[1] || !m[2]) throw new Error(`paper token --pp-${name} is not a light-dark(#hex, #hex) pair`);
  return [m[1], m[2]];
}

/** Weighted least squares for out = M · [r, g, b, 1], one row per channel (4x4 normal equations). */
function fit(samples: { from: Rgb; to: Rgb; w: number }[]): number[][] {
  return [0, 1, 2].map((c) => {
    const A = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
    const y = [0, 0, 0, 0];
    for (const s of samples) {
      const x = [...s.from, 1];
      for (let i = 0; i < 4; i++) {
        y[i] = (y[i] ?? 0) + s.w * (x[i] ?? 0) * s.to[c]!;
        for (let j = 0; j < 4; j++) A[i]![j] = (A[i]![j] ?? 0) + s.w * (x[i] ?? 0) * (x[j] ?? 0);
      }
    }
    // Gaussian elimination with partial pivoting.
    for (let i = 0; i < 4; i++) {
      let p = i;
      for (let r = i + 1; r < 4; r++) if (Math.abs(A[r]![i]!) > Math.abs(A[p]![i]!)) p = r;
      [A[i], A[p]] = [A[p]!, A[i]!];
      [y[i], y[p]] = [y[p]!, y[i]!];
      for (let r = 0; r < 4; r++) {
        if (r === i) continue;
        const f = A[r]![i]! / A[i]![i]!;
        for (let k = i; k < 4; k++) A[r]![k] = A[r]![k]! - f * A[i]![k]!;
        y[r] = y[r]! - f * y[i]!;
      }
    }
    return A.map((row, i) => y[i]! / row[i]!);
  });
}

/** The feColorMatrix `values` for one mode: 0 is day (light), 1 is night (dark). */
export function figureMatrix(mode: 0 | 1): string {
  const ground = hex(paperPair('ground')[mode]);
  const ink = hex(paperPair('ink-strong')[mode]);
  const signal = hex(paperPair('signal')[mode]);
  const g0 = lum(hex(night.ground));
  const g1 = lum(hex(night.inkStrong));
  const samples = (Object.keys(night) as NightKey[])
    .filter((k) => !k.startsWith('world') && !k.startsWith('signal') && k !== 'panelSignal')
    .map((k) => {
      const from = hex(night[k]);
      const t = Math.min(1, Math.max(0, (lum(from) - g0) / (g1 - g0)));
      const to = ground.map((v, i) => v + (ink[i]! - v) * t) as Rgb;
      return { from, to, w: k === 'ground' ? 6 : 1 };
    });
  samples.push({ from: hex(night.signal), to: signal, w: 8 });
  const rows = fit(samples);
  const r = (n: number): string => n.toFixed(4);
  return [...rows.flatMap((row) => [r(row[0]!), r(row[1]!), r(row[2]!), '0', r(row[3]!)]), '0 0 0 1 0'].join(' ');
}

/** Extra contrast for voxel worlds, pivoting on the paper ground so the ground stays put. */
export function worldContrast(mode: 0 | 1, slope = 1.7): { slope: number; intercepts: string[] } {
  const ground = hex(paperPair('ground')[mode]);
  return { slope, intercepts: ground.map((g) => (g * (1 - slope)).toFixed(4)) };
}
