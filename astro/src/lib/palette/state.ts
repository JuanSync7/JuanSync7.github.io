import { hslToRgb, rgbToHsl, type Rgba } from './color';
import {
  ROLES,
  flipTheme,
  openLock,
  respect,
  suggest,
  type Harmony,
  type Lock,
  type Locks,
  type Mode,
  type Role,
  type Roles,
} from './harmony';

/** Everything the studio remembers. Both themes are held; dark follows light until the reader
 *  edits dark on its own. */
export interface Studio {
  mode: Mode;
  themes: Record<Mode, Roles>;
  /** Dark is worked out from light while this is true. */
  linked: boolean;
  locks: Locks;
  harmony: Harmony;
  /** The body-text contrast auto-suggest aims for. */
  target: number;
  /** Picking one colour re-suggests the others. */
  auto: boolean;
  body: string;
  heading: string;
  /** The role the sliders are editing. */
  active: Role;
}

export type Action =
  | { type: 'set'; role: Role; color: Rgba }
  | { type: 'mode'; mode: Mode }
  | { type: 'active'; role: Role }
  | { type: 'lock'; role: Role; key: keyof Lock }
  | { type: 'harmony'; harmony: Harmony }
  | { type: 'target'; target: number }
  | { type: 'auto'; on: boolean }
  | { type: 'font'; which: 'body' | 'heading'; id: string }
  | { type: 'relink' }
  | { type: 'resuggest' }
  | { type: 'load'; studio: Studio };

export const freshLocks = (): Locks => ({ ground: openLock(), ink: openLock(), accent: openLock(), accent2: openLock() });

/** Keeps the locked HSL channels of the old colour inside the new one. */
export function keepChannels(prev: Rgba, next: Rgba, l: Lock): Rgba {
  const a = rgbToHsl(prev);
  const b = rgbToHsl(next);
  return hslToRgb({ h: l.h ? a.h : b.h, s: l.s ? a.s : b.s, l: l.l ? a.l : b.l }, next.a);
}

const other = (m: Mode): Mode => (m === 'light' ? 'dark' : 'light');

function withDark(s: Studio, themes: Record<Mode, Roles>): Record<Mode, Roles> {
  if (!s.linked) return themes;
  // While linked, dark is light flipped, locked colours included (a lock guards a colour from
  // other picks, not from its own theme's counterpart).
  return { light: themes.light, dark: flipTheme(themes.light, 'dark', s.target) };
}

function apply(s: Studio, from: Role, roles: Roles): Studio {
  const ask = { mode: s.mode, harmony: s.harmony, target: s.target };
  const next = s.auto ? respect(roles, suggest(from, roles, ask), s.locks, keepChannels) : roles;
  next[from] = roles[from];
  const themes = { ...s.themes, [s.mode]: next };
  return { ...s, themes: s.mode === 'light' ? withDark(s, themes) : themes };
}

export function reduce(s: Studio, a: Action): Studio {
  switch (a.type) {
    case 'set': {
      const roles = { ...s.themes[s.mode], [a.role]: a.color };
      // Editing dark by hand cuts it loose from light.
      const base = s.mode === 'dark' ? { ...s, linked: false } : s;
      // A colour set by hand keeps itself: it locks, so a later pick elsewhere cannot replace
      // it. The lock shows on its card and one press frees it.
      const locks = { ...s.locks, [a.role]: { ...s.locks[a.role], all: true } };
      return apply({ ...base, locks, active: a.role }, a.role, roles);
    }
    case 'mode':
      return { ...s, mode: a.mode };
    case 'active':
      return { ...s, active: a.role };
    case 'lock': {
      const lock = { ...s.locks[a.role], [a.key]: !s.locks[a.role][a.key] };
      return { ...s, locks: { ...s.locks, [a.role]: lock } };
    }
    case 'harmony':
      return apply({ ...s, harmony: a.harmony }, s.active, s.themes[s.mode]);
    case 'target':
      return apply({ ...s, target: a.target }, s.active, s.themes[s.mode]);
    case 'auto':
      return { ...s, auto: a.on };
    case 'font':
      return { ...s, [a.which]: a.id };
    case 'relink': {
      const linked = { ...s, linked: true };
      const from = s.mode === 'dark' ? s.themes.light : s.themes[s.mode];
      return { ...linked, themes: { light: from, dark: flipTheme(from, 'dark', s.target) } };
    }
    case 'resuggest':
      return apply({ ...s, auto: true }, s.active, s.themes[s.mode]);
    case 'load':
      return a.studio;
  }
}

export function initial(light: Roles, dark: Roles): Studio {
  return {
    mode: 'light',
    themes: { light, dark },
    // The site's own dark is hand-tuned; it shows until the first light edit re-derives it.
    linked: true,
    locks: freshLocks(),
    harmony: 'complementary',
    target: 9,
    auto: true,
    body: 'manrope',
    heading: 'manrope',
    active: 'accent',
  };
}

/** The theme the studio shows now, and the one it would switch to. */
export const shown = (s: Studio): Roles => s.themes[s.mode];
export const otherMode = other;
export { ROLES };
