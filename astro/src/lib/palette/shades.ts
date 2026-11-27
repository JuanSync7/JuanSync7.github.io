import { clamp, contrast, css, mixOk, oklchToRgb, reach, rgbToOklch, toHex, type Rgba } from './color';
import type { Mode, Roles } from './harmony';

/** One colour of the finished system: its token name, its value and what it is for. */
export interface Token {
  name: string;
  /** The share it belongs to: 60 ground, 30 ink, 10 accent, or the secondary accent. */
  share: '60' | '30' | '10' | '10b';
  value: Rgba;
  use: string;
}

/** The colour that sits between `bg` and `fg` at a given contrast against `bg`. */
export function toward(fg: Rgba, bg: Rgba, ratio: number): Rgba {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 22; i++) {
    const t = (lo + hi) / 2;
    if (contrast(mixOk(bg, fg, t), bg) < ratio) lo = t;
    else hi = t;
  }
  return mixOk(bg, fg, hi);
}

const shift = (c: Rgba, dl: number, dc = 0): Rgba => {
  const o = rgbToOklch(c);
  return oklchToRgb({ l: clamp(o.l + dl, 0, 1), c: Math.max(0, o.c + dc), h: o.h }, c.a);
};

const black: Rgba = { r: 0, g: 0, b: 0, a: 1 };
const white: Rgba = { r: 255, g: 255, b: 255, a: 1 };

/** The best text colour on a filled accent: the deepest ink or the lightest paper there is. */
export function onFill(fill: Rgba, ...candidates: Rgba[]): Rgba {
  const all = [...candidates, black, white];
  return all.reduce((best, c) => (contrast(c, fill) > contrast(best, fill) ? c : best));
}

/** Every shade the system needs, worked out from the four picks: raised and sunk grounds,
 *  heading, body, comment and faint inks, hairlines, the readable "dull" accent for small text,
 *  hover, the highlighter, and text on a filled button. */
export function system(roles: Roles, mode: Mode): Token[] {
  const { ground, ink, accent, accent2 } = roles;
  const dir = mode === 'light' ? -1 : 1;
  const strong = reach(shift(ink, dir * 0.12), ground, Math.max(contrast(ink, ground), 7));
  const t = (name: string, share: Token['share'], value: Rgba, use: string): Token => ({ name, share, value, use });
  return [
    t('ground', '60', ground, 'The page itself: about 60% of every screen.'),
    t('ground-raised', '60', shift(ground, mode === 'light' ? 0.022 : 0.045), 'A card or panel face, one step off the ground.'),
    t('ground-sunk', '60', shift(ground, -0.03), 'Inputs, code and wells, one step into the page.'),
    t('line', '30', toward(ink, ground, 1.45), 'Hairlines, rules and card edges.'),
    t('ink-strong', '30', strong, 'Headings and the logo.'),
    t('ink', '30', ink, 'Body text.'),
    t('ink-muted', '30', toward(ink, ground, 5), 'Comments, captions and meta: still readable.'),
    t('ink-faint', '30', toward(ink, ground, 3), 'Placeholders and decoration, never body text.'),
    t('accent', '10', accent, 'Fills, buttons, focus rings, one mark per view.'),
    t('accent-text', '10', reach(accent, ground, 4.5), 'Small accent text: the deeper, duller accent that stays readable.'),
    t('accent-muted', '10', toward(shift(accent, 0, -0.06), ground, 2.2), 'A quiet accent for borders and tags.'),
    t('accent-strong', '10', shift(accent, dir * 0.07), 'Hover and pressed accent.'),
    t('accent-soft', '10', mixOk(ground, accent, 0.2), 'The highlighter behind marked text.'),
    t('on-accent', '10', onFill(accent, strong, ground), 'Text on a filled accent button.'),
    t('accent2', '10b', accent2, 'The secondary accent: links visited, a second series, a rare badge.'),
    t('accent2-text', '10b', reach(accent2, ground, 4.5), 'Small text in the secondary accent.'),
    t('accent2-soft', '10b', mixOk(ground, accent2, 0.18), 'A highlighter in the secondary accent.'),
  ];
}

/** A token's value by name, for components that need one shade. */
export function pick(tokens: Token[], name: string): Rgba {
  const hit = tokens.find((x) => x.name === name);
  if (!hit) throw new Error(`palette: no token ${name}`);
  return hit.value;
}

export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/** An eleven-step ramp at one hue, light to dark, chroma highest in the middle like a
 *  hand-tuned palette. Step 500 is the colour's own chroma at a middle lightness. */
export function ramp(c: Rgba): { step: number; value: Rgba }[] {
  const o = rgbToOklch(c);
  return STEPS.map((step, i) => {
    const k = i / (STEPS.length - 1);
    const l = 0.975 - k * 0.8;
    const bell = 1 - Math.abs(k - 0.5) * 1.3;
    return { step, value: oklchToRgb({ l, c: o.c * clamp(bell, 0.12, 1), h: o.h }) };
  });
}

/** The three gradients the system allows: a page wash, the accent's own light-to-deep, and
 *  the two accents together for one emphasis. */
export function gradients(tokens: Token[]): { name: string; stops: Rgba[]; use: string }[] {
  const v = (n: string): Rgba => pick(tokens, n);
  return [
    { name: 'wash', stops: [v('ground'), v('ground-raised')], use: 'A hero or page wash; barely there.' },
    { name: 'accent', stops: [v('accent-soft'), v('accent'), v('accent-strong')], use: 'Progress bars and one hero mark.' },
    { name: 'duo', stops: [v('accent'), v('accent2')], use: 'At most once per page.' },
  ];
}

/** `#rrggbb` (or a see-through rgb()) for display and export. */
export const show = (c: Rgba): string => (c.a < 1 ? css(c) : toHex(c));
