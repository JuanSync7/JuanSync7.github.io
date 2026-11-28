import { clamp, rgbToHsl, toHex, type Rgba } from './color';
import { ramp, show, type Token } from './shades';

/** The backgrounds of the studio's own controls: the wheel, the channel tracks and the
 *  preview's custom properties. They are worked out from the reader's colour every time, so they
 *  live here as data, not as tokens in a stylesheet. */

const hsl = (h: number, s: number, l: number, a = 1): string =>
  `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%${a < 1 ? ` / ${a}` : ''})`;

/** Hue round the rim (0 at the top, clockwise), saturation out from a grey centre, at the
 *  colour's own lightness (kept away from black and white so the hues stay visible). */
export function wheel(c: Rgba): string {
  const l = clamp(rgbToHsl(c).l, 25, 75);
  const stops = Array.from({ length: 13 }, (_, i) => hsl(i * 30, 100, l)).join(', ');
  return `radial-gradient(closest-side, ${hsl(0, 0, l)}, ${hsl(0, 0, l, 0)}), conic-gradient(${stops})`;
}

/** Where a colour sits on the wheel, in percent of its box. */
export function wheelSpot(c: Rgba): { left: string; top: string } {
  const { h, s } = rgbToHsl(c);
  const a = (h * Math.PI) / 180;
  return { left: `${50 + Math.sin(a) * s * 0.5}%`, top: `${50 - Math.cos(a) * s * 0.5}%` };
}

/** Hue and saturation for a point on the wheel (fractions of its box). */
export function fromWheel(x: number, y: number): { h: number; s: number } {
  const dx = x - 0.5;
  const dy = y - 0.5;
  const h = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
  return { h, s: clamp(Math.hypot(dx, dy) * 200, 0, 100) };
}

export type Channel = 'h' | 's' | 'l' | 'a';

/** The track behind one channel slider: what the colour becomes along it. */
export function track(c: Rgba, ch: Channel): string {
  const { h, s, l } = rgbToHsl(c);
  const line = (stops: string[]): string => `linear-gradient(to right, ${stops.join(', ')})`;
  if (ch === 'h') return line(Array.from({ length: 13 }, (_, i) => hsl(i * 30, s, l)));
  if (ch === 's') return line([hsl(h, 0, l), hsl(h, 100, l)]);
  if (ch === 'l') return line([hsl(h, s, 0), hsl(h, s, 50), hsl(h, s, 100)]);
  const solid = toHex(c, false);
  return `${line([`${solid}00`, solid])}, repeating-conic-gradient(${hsl(0, 0, 80)} 0 25%, ${hsl(0, 0, 96)} 0 50%) 0 0 / 12px 12px`;
}

/** The range slider: the colour's eleven-step ramp, light to dark, as one smooth track. */
export function rampTrack(c: Rgba): string {
  return `linear-gradient(to right, ${ramp(c).map((s) => toHex(s.value)).join(', ')})`;
}

/** A gradient's stops as a CSS background. */
export const stripe = (stops: Rgba[]): string => `linear-gradient(90deg, ${stops.map(show).join(', ')})`;

/** The preview's custom properties: one `--mk-<token>` per token, so the mock site's stylesheet
 *  names roles, never values. */
export function mockVars(tokens: Token[], body: string, heading: string): Record<string, string> {
  const out: Record<string, string> = { '--mk-body': body, '--mk-heading': heading };
  for (const t of tokens) out[`--mk-${t.name}`] = show(t.value);
  return out;
}

/** What a figure is handed: every token as an opaque colour three.js and canvas both read. */
export function figurePalette(tokens: Token[]): Record<string, string> {
  return Object.fromEntries(tokens.map((t) => [t.name, toHex(t.value, false)]));
}
