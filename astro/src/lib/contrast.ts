/** Colour on the page, measured the WCAG 2.2 way (ISO/IEC 40500:2025): parse a CSS colour, follow a
 *  token's references to its value on a light or dark page, and give the contrast ratio of a pair. */
import type { CssToken } from './design-tokens';

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function parseColour(v: string): Rgba | null {
  const s = v.trim().toLowerCase();
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  const hex = /^#([0-9a-f]{3,8})$/.exec(s);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    const n = (k: number) => parseInt(h.slice(k, k + 2), 16) / 255;
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) : 1 };
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(s);
  if (rgb) {
    const alpha = rgb[4] === undefined ? 1 : rgb[4].endsWith('%') ? parseFloat(rgb[4]) / 100 : parseFloat(rgb[4]);
    return { r: +rgb[1] / 255, g: +rgb[2] / 255, b: +rgb[3] / 255, a: alpha };
  }
  return null;
}

const hex2 = (x: number) =>
  Math.round(Math.min(1, Math.max(0, x)) * 255)
    .toString(16)
    .padStart(2, '0');
export const hexOf = (c: Rgba) => `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`;

/** WCAG 2.2 relative luminance (sRGB, threshold 0.04045). */
export function luminance(c: Rgba): number {
  const lin = (u: number) => (u <= 0.04045 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}

/** WCAG 2.2 contrast ratio of a colour over an opaque ground (a translucent colour is laid on it). */
export function contrast(fg: Rgba, ground: Rgba): number {
  const over = { r: fg.r * fg.a + ground.r * (1 - fg.a), g: fg.g * fg.a + ground.g * (1 - fg.a), b: fg.b * fg.a + ground.b * (1 - fg.a), a: 1 }; // prettier-ignore
  const [hi, lo] = [luminance(over), luminance(ground)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

export type Theme = 'light' | 'dark';

/** A token's colour on a light or dark page, following var() references. */
export function colourOf(name: string, theme: Theme, tokens: Map<string, CssToken>, depth = 0): Rgba | null {
  const t = tokens.get(name);
  if (!t || depth > 12) return null;
  const v = theme === 'dark' && t.dark !== undefined ? t.dark : t.value;
  const ref = /^var\((--[\w-]+)\)$/.exec(v);
  return ref ? colourOf(ref[1], theme, tokens, depth + 1) : parseColour(v);
}
