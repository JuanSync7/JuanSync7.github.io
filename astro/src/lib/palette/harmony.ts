import { contrast, oklchToRgb, reach, rgbToOklch, wrap, type Rgba } from './color';

/** The four colours a reader picks. 60 is the ground, 30 the ink and hairlines, 10 the accent,
 *  and the secondary accent is a small share of the 10. */
export const ROLES = ['ground', 'ink', 'accent', 'accent2'] as const;
export type Role = (typeof ROLES)[number];
export type Roles = Record<Role, Rgba>;
export type Mode = 'light' | 'dark';

/** How the accents sit around the wheel from the colour that set them. */
export const HARMONIES = ['complementary', 'split', 'triadic', 'analogous', 'monochrome'] as const;
export type Harmony = (typeof HARMONIES)[number];

/** Which parts of a role auto-suggest may not touch. `all` freezes the whole colour. */
export interface Lock {
  all: boolean;
  h: boolean;
  s: boolean;
  l: boolean;
}
export type Locks = Record<Role, Lock>;
export const openLock = (): Lock => ({ all: false, h: false, s: false, l: false });

/** Where the secondary accent sits from the accent: the opposite side, turned a little towards
 *  violet, so an orange gets a blue with a touch of purple rather than a cyan. */
export const SECOND_TURN: Record<Harmony, number> = {
  complementary: 180 + 50,
  split: 150,
  triadic: 120,
  analogous: 40,
  monochrome: 0,
};

/** Where the accent sits from a ground or ink's hue. */
const ACCENT_TURN: Record<Harmony, number> = { complementary: 180, split: 150, triadic: 120, analogous: -35, monochrome: 0 };

/** Grounds and inks keep only a whisper of their hue, so text stays neutral to read. */
const GROUND_C = 0.014;
const INK_C = 0.018;

interface Ask {
  mode: Mode;
  harmony: Harmony;
  /** Body text contrast to aim for (WCAG ratio). */
  target: number;
}

const accentOn = (hue: number, mode: Mode, ground: Rgba, chroma = 0.19): Rgba => {
  const seed = oklchToRgb({ l: mode === 'light' ? 0.64 : 0.7, c: chroma, h: hue });
  return reach(seed, ground, 3.1);
};

function inkFor(ground: Rgba, hue: number, target: number): Rgba {
  // Start at the ground's own lightness: reach walks it to whichever side reads.
  const start = oklchToRgb({ l: rgbToOklch(ground).l, c: INK_C, h: hue });
  return reach(start, ground, target);
}

const groundFrom = (hue: number, mode: Mode, chroma = GROUND_C): Rgba =>
  oklchToRgb({ l: mode === 'light' ? 0.945 : 0.215, c: chroma, h: hue });

/** The best partners for the role the reader just set: every other role is worked out from
 *  it, in OKLCH, so the result keeps an even lightness whatever the hue. */
export function suggest(from: Role, roles: Roles, ask: Ask): Roles {
  const pick = rgbToOklch(roles[from]);
  const turn = SECOND_TURN[ask.harmony];
  const out: Roles = { ...roles };
  if (from === 'accent' || from === 'accent2') {
    const accent = from === 'accent' ? pick : rgbToOklch(roles.accent);
    const hue = from === 'accent' ? pick.h : wrap(pick.h - turn);
    out.ground = groundFrom(hue, ask.mode);
    out.ink = inkFor(out.ground, hue, ask.target);
    if (from === 'accent2') out.accent = accentOn(hue, ask.mode, out.ground, Math.max(0.12, accent.c));
    else out.accent2 = accentOn(wrap(hue + turn), ask.mode, out.ground, Math.max(0.1, pick.c * 0.8));
    out[from] = roles[from];
    return out;
  }
  // From a ground or an ink: a near-neutral keeps the hue it has; a grey gets the site's warm one.
  const hue = pick.c > 0.008 ? pick.h : 45;
  if (from === 'ground') out.ink = inkFor(roles.ground, hue, ask.target);
  else out.ground = groundFrom(hue, ask.mode);
  const base = from === 'ground' ? roles.ground : out.ground;
  const aHue = wrap(hue + ACCENT_TURN[ask.harmony]);
  out.accent = accentOn(aHue, ask.mode, base);
  out.accent2 = accentOn(wrap(aHue + turn), ask.mode, base, 0.15);
  return out;
}

/** The other theme, worked out from this one: grounds and inks trade lightness, accents lift
 *  or deepen just enough to keep their contrast. */
export function flipTheme(roles: Roles, to: Mode, target: number): Roles {
  const g = rgbToOklch(roles.ground);
  const ground = groundFrom(g.h, to, Math.min(g.c, 0.03));
  const ink = inkFor(ground, rgbToOklch(roles.ink).h, target);
  const lift = (c: Rgba): Rgba => {
    const o = rgbToOklch(c);
    const seed = oklchToRgb({ ...o, l: to === 'dark' ? Math.max(o.l, 0.68) : Math.min(o.l, 0.62) }, c.a);
    return reach(seed, ground, 3.1);
  };
  return { ground, ink, accent: lift(roles.accent), accent2: lift(roles.accent2) };
}

/** Lays the suggestion over what the reader locked: a frozen role stays, a locked channel
 *  keeps its value (hue, saturation or lightness in HSL terms, as the sliders show them). */
export function respect(prev: Roles, next: Roles, locks: Locks, keep: (prev: Rgba, next: Rgba, l: Lock) => Rgba): Roles {
  const out = { ...next };
  for (const r of ROLES) if (locks[r].all) out[r] = prev[r];
  else if (locks[r].h || locks[r].s || locks[r].l) out[r] = keep(prev[r], next[r], locks[r]);
  return out;
}

/** True when two colours would read as one at a glance. */
export const tooClose = (a: Rgba, b: Rgba): boolean => contrast(a, b) < 1.25;

/** The secondary accent for an accent already chosen, on its ground. */
export function second(accent: Rgba, ground: Rgba, mode: Mode, harmony: Harmony): Rgba {
  const o = rgbToOklch(accent);
  return accentOn(wrap(o.h + SECOND_TURN[harmony]), mode, ground, Math.max(0.1, o.c * 0.8));
}
