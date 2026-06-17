/* ── TS-side colour palette ──────────────────────────────────────────────────
   The single source for colour VALUES consumed by JS/TSX (React islands render
   at build AND in the browser, so we can't read CSS vars via getComputedStyle
   without an SSR/hydration mismatch). This mirrors the tokens in colors.css —
   keep the two in sync (same hex). Components must import names from here, never
   inline raw hex.

   alpha(hex, a) composes a translucent variant and REPLACES the old `${c}44`
   string-concat pattern that forced bare hex into component styles. ──────────── */

export const palette = {
  // surfaces (darkest → lightest)
  bg: '#0a0a0a',
  bg2: '#0e0e0e',
  surface: '#121212',
  surface2: '#161616',
  // ink (text on dark)
  ink: '#e4ecd8',
  inkSoft: '#7a9a88',
  inkMuted: '#4a6a55',
  inkPale: '#c0d8cc',
  // lines & borders
  line: '#243028',
  lineStrong: '#3a5042',
  // brand accents
  lime: '#c8d837',
  teal: '#1ba0a0',
  mint: '#6dbf8b',
  // specialty
  cyan: '#05d9e8',
  magenta: '#ff2a6d',
  violet: '#d300c5',
  aiOrange: '#ffa94d',
  white: '#ffffff',
} as const;

export type PaletteKey = keyof typeof palette;

/** Compose a translucent variant of a 6-digit hex colour. a ∈ [0,1]; returns an
 *  8-digit hex (#rrggbbaa). Drop-in for the legacy `${color}44` concatenation. */
export function alpha(hex: string, a: number): string {
  const clamped = a < 0 ? 0 : a > 1 ? 1 : a;
  const aa = Math.round(clamped * 255).toString(16).padStart(2, '0');
  return `${hex}${aa}`;
}
