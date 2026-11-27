import { parseHex, toHex, type Rgba } from './color';
import { second, type Mode, type Roles } from './harmony';
import type { Token } from './shades';

/** The studio starts from juansync.dev's own palette, read from the page's tokens (never copied),
 *  so a change to `tokens/paper.css` reaches it with nothing else to edit. */

function read(name: string, mode: Mode): Rgba | undefined {
  // An undefined property would hand back the inherited text colour; ask only for real tokens.
  if (!getComputedStyle(document.documentElement).getPropertyValue(name).trim()) return undefined;
  const probe = document.createElement('span');
  probe.style.colorScheme = mode;
  probe.style.color = `var(${name})`;
  probe.hidden = true;
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  const m = /rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/.exec(value);
  if (!m) return undefined;
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: 1 };
}

const fallback = (hex: string): Rgba => parseHex(hex) ?? { r: 128, g: 128, b: 128, a: 1 };

export function siteRoles(mode: Mode): Roles {
  const grey = fallback('#808080');
  const ground = read('--pp-ground', mode) ?? grey;
  const ink = read('--pp-ink', mode) ?? grey;
  const accent = read('--pp-signal', mode) ?? grey;
  const accent2 = read('--pp-signal-2', mode) ?? second(accent, ground, mode, 'complementary');
  return { ground, ink, accent, accent2 };
}

/** Which site token each studio token drives when the reader turns the whole site over. */
const SITE: Record<string, string[]> = {
  ground: ['--pp-ground'],
  'ground-raised': ['--pp-face', '--pp-term-ground'],
  'ground-sunk': ['--pp-strip'],
  line: ['--pp-rule', '--pp-outline', '--pp-term-line'],
  'ink-strong': ['--pp-ink-strong', '--pp-read-title', '--pp-read-h2', '--pp-read-h3', '--pp-read-h4', '--pp-term-ink'],
  ink: ['--pp-ink', '--pp-read-body'],
  'ink-muted': ['--pp-ink-muted', '--pp-read-nav', '--pp-face-line', '--pp-term-muted'],
  accent: ['--pp-signal', '--pp-term-dot-1'],
  'accent-text': ['--pp-signal-text'],
  'accent-strong': ['--pp-signal-shadow'],
  'on-accent': ['--pp-on-signal'],
  accent2: ['--pp-signal-2'],
  'accent2-text': ['--pp-signal-2-text'],
};

const TOUCHED = [...Object.values(SITE).flat(), '--pp-sans', 'color-scheme'];

/** Lays the palette over the whole site (or lifts it, given null). Only custom properties on
 *  <html> change, so every page part that reads the tokens follows and nothing is left behind. */
export function applyToSite(tokens: Token[] | null, mode: Mode, bodyStack: string): void {
  const root = document.documentElement.style;
  if (!tokens) {
    for (const name of TOUCHED) root.removeProperty(name);
    return;
  }
  for (const t of tokens) for (const name of SITE[t.name] ?? []) root.setProperty(name, toHex(t.value, false));
  root.setProperty('--pp-sans', bodyStack);
  root.setProperty('color-scheme', mode);
}
