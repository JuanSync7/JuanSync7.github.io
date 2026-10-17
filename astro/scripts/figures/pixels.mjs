/** Measures a screenshot of a figure against the night palette. */
import { PNG } from 'pngjs';

const GROUND = [7, 8, 12];

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
        if (dh <= th.signalHueTol) signal++;
        else off++;
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
