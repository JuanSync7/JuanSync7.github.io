/** Colour on the page, measured the WCAG 2.2 way (ISO/IEC 40500:2025): parse a CSS colour, follow a
 *  token's references to its value on a light or dark page, and give the contrast ratio of a pair. */
import type { CssToken } from './read';

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** A hex, `rgb()`/`rgba()` or `transparent` colour, channels 0 to 1. Anything else is null. */
export function parseColour(v: string): Rgba | null {
  const s = v.trim().toLowerCase();
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  let h = /^#([0-9a-f]{3,8})$/.exec(s)?.[1];
  if (h !== undefined) {
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    const hx = h;
    const n = (k: number) => parseInt(hx.slice(k, k + 2), 16) / 255;
    return { r: n(0), g: n(2), b: n(4), a: hx.length === 8 ? n(6) : 1 };
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(s);
  if (rgb) {
    const [, r = '0', g = '0', b = '0', al] = rgb;
    const a = al === undefined ? 1 : al.endsWith('%') ? parseFloat(al) / 100 : parseFloat(al);
    return { r: +r / 255, g: +g / 255, b: +b / 255, a };
  }
  return null;
}

const hex2 = (x: number) =>
  Math.round(Math.min(1, Math.max(0, x)) * 255)
    .toString(16)
    .padStart(2, '0');
/** The colour as a 6-digit hex, alpha dropped. */
export const hexOf = (c: Rgba) => `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`;

/** WCAG 2.2 relative luminance (sRGB, threshold 0.04045). */
export function luminance(c: Rgba): number {
  const lin = (u: number) => (u <= 0.04045 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}

/** WCAG 2.2 contrast ratio of a colour over an opaque ground (a translucent colour is laid on it). */
export function contrast(fg: Rgba, ground: Rgba): number {
  const mix = (f: number, g: number) => f * fg.a + g * (1 - fg.a);
  const over = { r: mix(fg.r, ground.r), g: mix(fg.g, ground.g), b: mix(fg.b, ground.b), a: 1 };
  const a = luminance(over);
  const b = luminance(ground);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export type Theme = 'light' | 'dark';

/** A token's colour on a light or dark page, following `var()` references. */
export function colourOf(name: string, theme: Theme, tokens: Map<string, CssToken>, depth = 0): Rgba | null {
  const t = tokens.get(name);
  if (!t || depth > 12) return null;
  const v = theme === 'dark' && t.dark !== undefined ? t.dark : t.value;
  const ref = /^var\((--[\w-]+)\)$/.exec(v)?.[1];
  return ref !== undefined ? colourOf(ref, theme, tokens, depth + 1) : parseColour(v);
}

/** What a pair must reach. `text` is body-size text (1.4.3: 4.5:1 AA, 1.4.6: 7:1 AAA). `large` is
 *  large text or a graphic or control edge someone needs to see (1.4.3 large text, 1.4.11: 3:1).
 *  `decorative` carries no requirement: the ratio is shown, nothing depends on it. */
export type Need = 'text' | 'large' | 'decorative';

/** Each need as [AA, AAA]: AA fails a check, AAA is shown. */
export const NEED: Record<Need, [number, number | null] | null> = {
  text: [4.5, 7],
  large: [3, 4.5],
  decorative: null,
};

export interface ContrastPair {
  /** What the colour is for, as a reader would say it: "Body text". */
  role: string;
  /** The foreground token. */
  fg: string;
  /** The token it sits on. */
  ground: string;
  need: Need;
  /** Why a decorative pair needs nothing, or where a large-only colour is allowed. */
  note?: string;
}

export interface ContrastGroup {
  title: string;
  pairs: ContrastPair[];
}

/** A pair's ratio on a light or dark page, or NaN when either token has no colour there. */
export function ratioOf(p: ContrastPair, theme: Theme, tokens: Map<string, CssToken>): number {
  const f = colourOf(p.fg, theme, tokens);
  const g = colourOf(p.ground, theme, tokens);
  return f && g ? contrast(f, g) : NaN;
}
