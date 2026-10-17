/** Measures a screenshot of a figure against the night palette. */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const GROUND = [7, 8, 12];

/** The night neutrals are blue-grey, not grey: line4 (#3a4054) has saturation 0.31 and line
 *  0.42. A fixed saturation cut-off would call the palette's own tokens off-palette, so the
 *  neutral band (hue range and top saturation) is read from palette.ts itself, every token
 *  except the signal family, and widened by a small margin for antialiasing. */
function neutralBand() {
  const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'styles', 'tokens', 'palette.ts'), 'utf8');
  const block = src.match(/export const night = \{([\s\S]*?)\} as const/)?.[1] ?? '';
  let lo = 360;
  let hi = 0;
  let sMax = 0;
  for (const [, key, hex] of block.matchAll(/(\w+):\s*'#([0-9a-fA-F]{6})'/g)) {
    if (/signal/i.test(key)) continue;
    const [r, g, b] = [0, 2, 4].map((k) => parseInt(hex.slice(k, k + 2), 16));
    const mx = Math.max(r, g, b);
    if (mx - Math.min(r, g, b) === 0) continue;
    const h = hueOf(r, g, b);
    lo = Math.min(lo, h);
    hi = Math.max(hi, h);
    sMax = Math.max(sMax, (mx - Math.min(r, g, b)) / mx);
  }
  return { lo: lo - 8, hi: hi + 8, sMax: sMax + 0.04 };
}

export const NEUTRAL = neutralBand();

export function decode(buf) {
  return PNG.sync.read(buf);
}

function hueOf(r, g, b) {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  if (d === 0) return 0;
  let h;
  if (mx === r) h = ((g - b) / d) % 6;
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

/** Ink coverage, signal share, off-palette share and how much ink sits on the border. */
export function measure(png, th) {
  const { width: w, height: h, data } = png;
  let ink = 0;
  let signal = 0;
  let off = 0;
  let border = 0;
  let borderInk = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const onBorder = x < 2 || y < 2 || x >= w - 2 || y >= h - 2;
      if (onBorder) border++;
      const delta = Math.max(Math.abs(r - GROUND[0]), Math.abs(g - GROUND[1]), Math.abs(b - GROUND[2]));
      if (delta <= th.inkDelta) continue;
      ink++;
      if (onBorder) borderInk++;
      const mx = Math.max(r, g, b);
      const s = mx === 0 ? 0 : (mx - Math.min(r, g, b)) / mx;
      if (s > th.chromaS && mx / 255 > th.chromaV) {
        const dh = Math.abs(((hueOf(r, g, b) - th.signalHue + 540) % 360) - 180);
        const h = hueOf(r, g, b);
        if (dh <= th.signalHueTol) signal++;
        else if (!(h >= NEUTRAL.lo && h <= NEUTRAL.hi && s <= NEUTRAL.sMax)) off++;
      }
    }
  }
  const total = w * h;
  return {
    coverage: ink / total,
    signalShare: ink ? signal / ink : 0,
    signalPixels: signal,
    offPalette: off / total,
    borderInk: border ? borderInk / border : 0,
  };
}

/** Mean absolute difference between two same-size screenshots, 0..1. */
export function diff(a, b) {
  if (a.width !== b.width || a.height !== b.height) return 1;
  let sum = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    sum += Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]);
  }
  return sum / ((a.data.length / 4) * 3 * 255);
}
