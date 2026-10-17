import { night, type NightKey } from '../../styles/tokens/palette';

/** The only way a figure gets a colour. Every value comes from the night tokens, so a
 *  figure can't drift off-palette; the audit rejects any colour literal in a figure.
 *
 *  The palette is deliberately small: ground, a cool grey for every line, and one teal
 *  signal. The signal is information: it marks the one thing to look at. */

const cache = new Map<string, string>();

function rgbOf(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** A token at an opacity, as a canvas colour string. */
export function tone(key: NightKey, a = 1): string {
  const alpha = a < 0 ? 0 : a > 1 ? 1 : a;
  const k = `${key}:${alpha.toFixed(3)}`;
  const hit = cache.get(k);
  if (hit) return hit;
  const [r, g, b] = rgbOf(night[key]);
  const out = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
  cache.set(k, out);
  return out;
}

/** Shorthands for the roles figures use most. */
export const ink = {
  ground: (a = 1): string => tone('ground', a),
  panel: (a = 1): string => tone('panel', a),
  /** Every ordinary line: wireframes, rules, traces. */
  line: (a = 1): string => tone('ink', a),
  /** The one highlight. */
  signal: (a = 1): string => tone('signal', a),
  /** Text-coloured greys for the quiet layers of a drawing. */
  soft: (a = 1): string => tone('inkSoft', a),
  faint: (a = 1): string => tone('inkFaint', a),
  /** A filled solid's face, a step up from the ground. */
  face: (a = 1): string => tone('panel2', a),
} as const;

/** A token as #rrggbb, for three.js colours (which take no alpha in a string). */
export function hexOf(key: NightKey): string {
  return night[key];
}

/** The signal as three numbers, for WebGL materials and pixel buffers. */
export function rgb(key: NightKey): [number, number, number] {
  return rgbOf(night[key]);
}

/** Linear blend between two tokens, for flat shading by facing (low-poly). */
export function mix(a: NightKey, b: NightKey, t: number, alpha = 1): string {
  const x = rgbOf(night[a]);
  const y = rgbOf(night[b]);
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  const c = x.map((v, i) => Math.round(v + ((y[i] ?? v) - v) * k));
  return `rgba(${c[0]},${c[1]},${c[2]},${alpha.toFixed(3)})`;
}
