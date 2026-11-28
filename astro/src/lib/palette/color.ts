/** Colour maths for the palette studio: sRGB, HSL, OKLCH and the WCAG contrast ratio.
 *  Plain numbers in, plain numbers out, so the studio, its figures and its selftest share it. */

export interface Rgba {
  /** 0..255 */
  r: number;
  g: number;
  b: number;
  /** 0..1 */
  a: number;
}
export interface Hsl {
  /** 0..360 */
  h: number;
  /** 0..100 */
  s: number;
  l: number;
}
export interface Oklch {
  /** 0..1 */
  l: number;
  /** 0..~0.37 */
  c: number;
  /** 0..360 */
  h: number;
}

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
const wrap = (h: number): number => ((h % 360) + 360) % 360;
export { clamp, wrap };

export function parseHex(text: string): Rgba | undefined {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(text.trim());
  if (!m || !m[1]) return undefined;
  let hex = m[1];
  if (hex.length <= 4) hex = [...hex].map((c) => c + c).join('');
  const n = (i: number): number => Number.parseInt(hex.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: hex.length === 8 ? Math.round((n(6) / 255) * 100) / 100 : 1 };
}

const two = (v: number): string => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');

/** #rrggbb, or #rrggbbaa when the colour is see-through. */
export function toHex(c: Rgba, withAlpha = true): string {
  const base = `#${two(c.r)}${two(c.g)}${two(c.b)}`;
  return withAlpha && c.a < 1 ? base + two(c.a * 255) : base;
}

/** A CSS colour string for any alpha. */
export function css(c: Rgba): string {
  return c.a >= 1 ? toHex(c) : `rgb(${Math.round(c.r)} ${Math.round(c.g)} ${Math.round(c.b)} / ${c.a.toFixed(2)})`;
}

export function rgbToHsl({ r, g, b }: Rgba): Hsl {
  const x = r / 255;
  const y = g / 255;
  const z = b / 255;
  const max = Math.max(x, y, z);
  const min = Math.min(x, y, z);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l: l * 100 };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === x ? ((y - z) / d) % 6 : max === y ? (z - x) / d + 2 : (x - y) / d + 4;
  return { h: wrap(h * 60), s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }: Hsl, a = 1): Rgba {
  const S = clamp(s, 0, 100) / 100;
  const L = clamp(l, 0, 100) / 100;
  const k = (n: number): number => (n + wrap(h) / 30) % 12;
  const f = (n: number): number => L - S * Math.min(L, 1 - L) * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255, a };
}

const toLinear = (v: number): number => {
  const x = v / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (v: number): number => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055) * 255;

export function rgbToOklch(c: Rgba): Oklch {
  const r = toLinear(c.r);
  const g = toLinear(c.g);
  const b = toLinear(c.b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { l: L, c: Math.hypot(A, B), h: wrap((Math.atan2(B, A) * 180) / Math.PI) };
}

/** OKLCH to linear-free sRGB, unclamped: a channel outside 0..255 means out of gamut. */
function oklchRaw({ l, c, h }: Oklch): [number, number, number] {
  const A = c * Math.cos((h * Math.PI) / 180);
  const B = c * Math.sin((h * Math.PI) / 180);
  const L = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const M = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const S = (l - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
}

const inGamut = (rgb: [number, number, number]): boolean => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/** OKLCH to sRGB, keeping lightness and hue and giving up chroma until it fits the screen. */
export function oklchToRgb(o: Oklch, a = 1): Rgba {
  const L = clamp(o.l, 0, 1);
  let c = Math.max(0, o.c);
  if (!inGamut(oklchRaw({ l: L, c, h: o.h }))) {
    let lo = 0;
    let hi = c;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchRaw({ l: L, c: mid, h: o.h }))) lo = mid;
      else hi = mid;
    }
    c = lo;
  }
  const [r, g, b] = oklchRaw({ l: L, c, h: o.h });
  return { r: clamp(fromLinear(r), 0, 255), g: clamp(fromLinear(g), 0, 255), b: clamp(fromLinear(b), 0, 255), a };
}

/** WCAG 2.x relative luminance. */
export function luminance(c: Rgba): number {
  return 0.2126 * toLinear(c.r) + 0.7152 * toLinear(c.g) + 0.0722 * toLinear(c.b);
}

/** A see-through colour laid over an opaque one. */
export function over(top: Rgba, under: Rgba): Rgba {
  const k = top.a;
  return { r: top.r * k + under.r * (1 - k), g: top.g * k + under.g * (1 - k), b: top.b * k + under.b * (1 - k), a: 1 };
}

/** The WCAG 2.2 contrast ratio of a foreground on a background (1 to 21). */
export function contrast(fg: Rgba, bg: Rgba): number {
  const solid = over(fg, { ...bg, a: 1 });
  const x = luminance(solid);
  const y = luminance({ ...bg, a: 1 });
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Linear mix in OKLab of two colours, t = 0 gives a, t = 1 gives b. */
export function mixOk(a: Rgba, b: Rgba, t: number): Rgba {
  const x = rgbToOklch(a);
  const y = rgbToOklch(b);
  const ax = x.c * Math.cos((x.h * Math.PI) / 180);
  const ay = x.c * Math.sin((x.h * Math.PI) / 180);
  const bx = y.c * Math.cos((y.h * Math.PI) / 180);
  const by = y.c * Math.sin((y.h * Math.PI) / 180);
  const px = ax + (bx - ax) * t;
  const py = ay + (by - ay) * t;
  const h = wrap((Math.atan2(py, px) * 180) / Math.PI);
  return oklchToRgb({ l: x.l + (y.l - x.l) * t, c: Math.hypot(px, py), h }, a.a + (b.a - a.a) * t);
}

/** Walks a colour's OKLCH lightness, keeping hue and chroma, until it reaches `ratio` against
 *  `bg` (towards dark or light, whichever can get there first). Returns the colour unchanged if
 *  it already does. */
export function reach(c: Rgba, bg: Rgba, ratio: number): Rgba {
  if (contrast(c, bg) >= ratio) return c;
  const o = rgbToOklch(c);
  const darkFirst = luminance(bg) > 0.18;
  const step = (dir: number): Rgba | undefined => {
    for (let l = o.l; l >= 0 && l <= 1; l += dir * 0.005) {
      const x = oklchToRgb({ ...o, l }, c.a);
      if (contrast(x, bg) >= ratio) return x;
    }
    return undefined;
  };
  const found = darkFirst ? (step(-1) ?? step(1)) : (step(1) ?? step(-1));
  if (found) return found;
  // Out of reach: the furthest it can go, whichever end of the lightness scale is stronger.
  const lo = oklchToRgb({ ...o, l: 0 }, c.a);
  const hi = oklchToRgb({ ...o, l: 1 }, c.a);
  return contrast(lo, bg) >= contrast(hi, bg) ? lo : hi;
}
