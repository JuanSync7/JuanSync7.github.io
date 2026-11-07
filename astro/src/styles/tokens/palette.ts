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
  black: '#000000',
} as const;

export type PaletteKey = keyof typeof palette;

/** Night system (2026 redesign). Mirrors the `--nt-*` tokens in colors.css. Figures
 *  never name a colour: they take one of these through `figures/kit/ink.ts`. */
export const night = {
  ground: '#07080c',
  ground2: '#090a0f',
  panel: '#0b0d13',
  panel2: '#0e1118',
  panelSignal: '#0c1514',
  rule: '#161922',
  line: '#1c2030',
  line2: '#23283a',
  line3: '#2a2f3d',
  line4: '#3a4054',
  inkStrong: '#f3f4f7',
  ink: '#e6e8ee',
  ink2: '#c3c8d4',
  inkSoft: '#a3a9ba',
  inkMuted: '#8b92a5',
  inkFaint: '#7d8496',
  signal: '#2dd4bf',
  signalInk: '#061210',
  signalLine: '#1b3a36',
  // Muted biome colours for the voxel world requested in the lab.
  worldMoss: '#678479',
  worldLeaf: '#387d70',
  worldClay: '#ab766d',
  worldLilac: '#9b87b1',
  worldSnow: '#d3e1e2',
  worldSand: '#b8a58a',
  worldStone: '#596571',
  worldWood: '#8c796b',
  worldEarth: '#70635e',
  worldHoney: '#e5bb79',
  worldWater: '#36576f',
  worldIce: '#819ebc',
  worldEmber: '#d78c69',
} as const;

export type NightKey = keyof typeof night;

/** Material and light tokens for the explicitly requested full-colour tabletop rooms.
 * Kept outside `night`: other figures retain their existing palette contract. */
export const roomTones = {
  ivory: '#eee4cd',
  plaster: '#b9b2a0',
  sage: '#748b6c',
  forest: '#284d3b',
  oak: '#9e7245',
  walnut: '#503326',
  graphite: '#202931',
  steel: '#7f929d',
  brass: '#a8854e',
  navy: '#273d59',
  blue: '#5187a6',
  teal: '#307f82',
  clay: '#ba7051',
  burgundy: '#6b3448',
  lavender: '#7b719c',
  linen: '#b9a994',
  glass: '#639ba0',
  rust: '#8f4c36',
  amber: '#ffce89',
  daylight: '#c9e2fa',
  porcelain: '#f2f0e9',
  ink: '#101b24',
} as const;
export type RoomTone = keyof typeof roomTones;
/** Existing paper tokens, mirrored for portable slide SVGs as well as CSS previews. */
export const paper = {
  ground: '#dcd8cc',
  ink: '#34302a',
  inkMuted: '#5a564d',
  signal: '#0a7164',
} as const;

/** Compose a translucent variant of a 6-digit hex colour. a ∈ [0,1]; returns an
 *  8-digit hex (#rrggbbaa). Drop-in for the legacy `${color}44` concatenation. */
export function alpha(hex: string, a: number): string {
  const clamped = a < 0 ? 0 : a > 1 ? 1 : a;
  const aa = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${aa}`;
}
