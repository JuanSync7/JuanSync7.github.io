import assert from 'node:assert/strict';
import { decode, measure } from './pixels.mjs';
export function colourMetrics(png, night) {
  const image = decode(png),
    base = measure(image, night),
    luminance = [];
  let clipped = 0,
    colourPixels = 0;
  for (let i = 0; i < image.data.length; i += 4) {
    const [r, g, b] = image.data.subarray(i, i + 3);
    const maximum = Math.max(r, g, b),
      minimum = Math.min(r, g, b);
    if (maximum > 35 && (maximum - minimum) / maximum > 0.18) colourPixels++;
    if (r > 250 && g > 250 && b > 250) clipped++;
    if (Math.max(Math.abs(r - 7), Math.abs(g - 8), Math.abs(b - 12)) > night.inkDelta)
      luminance.push((r * 0.2126 + g * 0.7152 + b * 0.0722) / 255);
  }
  luminance.sort((a, b) => a - b);
  const quantile = (p) => luminance[Math.floor((luminance.length - 1) * p)] ?? 0;
  return {
    ...base,
    colourShare: colourPixels / (image.width * image.height),
    contrast: quantile(0.95) - quantile(0.05),
    clipped: clipped / (image.width * image.height),
  };
}
export function assertColour(m, limits, label) {
  assert(m.coverage >= limits.coverageMin && m.coverage <= limits.coverageMax, `${label}: coverage ${m.coverage}`);
  assert(m.colourShare >= limits.colourShareMin, `${label}: full colour was not applied (${m.colourShare})`);
  assert(m.contrast >= limits.contrastMin, `${label}: insufficient lighting contrast (${m.contrast})`);
  assert(m.clipped <= limits.clippedHighlightsMax, `${label}: blown highlights (${m.clipped})`);
}
