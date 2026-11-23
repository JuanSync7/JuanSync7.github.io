/** Read design tokens from CSS: every custom property in the top-level `:root` blocks of the token
 *  files, with its value on a dark page where that differs. The CSS stays the one source of truth:
 *  this reads it and never writes it. */

export interface CssToken {
  /** The custom property, with its leading dashes: `--ink`. */
  name: string;
  /** The file it was read from, without its folder. */
  file: string;
  /** Its value on a light page (or the only value). */
  value: string;
  /** Its value on a dark page, where it differs: from `light-dark()` or a dark-theme block. */
  dark?: string;
}

export interface ReadOptions {
  /** A selector that holds dark-theme values. The default takes `[data-theme='dark']` (either quote)
   *  and `:root:not([data-theme='light'])` inside `prefers-color-scheme: dark`. */
  dark?: RegExp;
}

const DARK = /data-theme=['"]?dark['"]?|:not\(\[data-theme=['"]?light['"]?\]\)/;

/** Every custom property in the token files, keyed by path (any path, only its last part is kept). */
export function readTokens(files: Record<string, string>, options: ReadOptions = {}): CssToken[] {
  const darkSelector = options.dark ?? DARK;
  const out = new Map<string, CssToken>();
  for (const [path, css] of Object.entries(files)) {
    const file = path.split('/').pop() ?? path;
    const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const stack: string[] = [];
    let start = 0;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '{') {
        stack.push(text.slice(start, i).trim());
        start = i + 1;
      } else if (c === '}') {
        const body = text.slice(start, i);
        const media = stack.filter((s) => s.startsWith('@')).join(' ');
        const selector = stack[stack.length - 1] ?? '';
        const base = selector === ':root' && !media;
        const dark = darkSelector.test(selector) && (!media || media.includes('prefers-color-scheme: dark'));
        if (base || dark)
          for (const [, name, raw] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
            if (name === undefined || raw === undefined) continue;
            const value = raw.trim().replace(/\s+/g, ' ');
            const known = out.get(name);
            if (base) out.set(name, { name, file, value });
            else if (known) known.dark = value;
          }
        stack.pop();
        start = i + 1;
      } else if (c === ';' && !stack.length) start = i + 1;
    }
  }
  for (const t of out.values()) {
    const pair = splitLightDark(t.value);
    if (pair) {
      t.value = pair[0];
      t.dark ??= pair[1];
    }
  }
  return [...out.values()];
}

/** `light-dark(a, b)` as `[a, b]`, splitting at the top-level comma. */
export function splitLightDark(v: string): [string, string] | null {
  const inner = /^light-dark\((.*)\)$/.exec(v)?.[1];
  if (inner === undefined) return null;
  let depth = 0;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ',' && depth === 0) return [inner.slice(0, i).trim(), inner.slice(i + 1).trim()];
  }
  return null;
}
