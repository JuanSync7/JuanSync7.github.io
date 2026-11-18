/** The site's CSS tokens as W3C Design Tokens (DTCG Format Module 2025.10), and the WCAG 2.2
 *  contrast of a colour pair. The CSS files stay the one source of truth: this reads them, it never
 *  writes them. Pure functions, so the design-system page, the /tokens/ files and the check script
 *  all compute the same thing. */

export interface CssToken {
  name: string;
  file: string;
  value: string;
  /** The value on a dark page, where it differs (light-dark() or a dark-theme block). */
  dark?: string;
}

import { hexOf, parseColour } from './contrast';

const DARK = /data-theme='dark'|:not\(\[data-theme='light'\]\)/;

/** Every custom property in the top-level :root blocks of the token files, with its dark value. */
export function readTokens(files: Record<string, string>): CssToken[] {
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
        const at = stack.filter((s) => s.startsWith('@'));
        const selector = stack[stack.length - 1] ?? '';
        const media = at.join(' ');
        const base = selector === ':root' && !media;
        const dark = DARK.test(selector) && (!media || media.includes('prefers-color-scheme: dark'));
        if (base || dark)
          for (const [, name, raw] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
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
    const ld = splitLightDark(t.value);
    if (ld) {
      t.value = ld[0];
      t.dark ??= ld[1];
    }
  }
  return [...out.values()];
}

function splitLightDark(v: string): [string, string] | null {
  const m = /^light-dark\((.*)\)$/.exec(v);
  if (!m) return null;
  let depth = 0;
  for (let i = 0; i < m[1].length; i++) {
    const c = m[1][i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ',' && depth === 0) return [m[1].slice(0, i).trim(), m[1].slice(i + 1).trim()];
  }
  return null;
}

export * from './contrast';

/* ---------- DTCG 2025.10 ---------- */

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
export interface Skipped {
  name: string;
  value: string;
  reason: string;
}
export interface DtcgExport {
  foundation: { [k: string]: Json };
  light: { [k: string]: Json };
  dark: { [k: string]: Json };
  resolver: { [k: string]: Json };
  exported: number;
  skipped: Skipped[];
}

const pathOf = (name: string): [string, string] => {
  const [group, ...rest] = name.slice(2).split('-');
  return [group, rest.join('-') || group];
};
const ref = (name: string) => `{${pathOf(name).join('.')}}`;
const FAMILIES = /(sans|serif|mono|display|hand|drafting)$/;

function colourValue(v: string): Json | null {
  const c = parseColour(v);
  if (!c) return null;
  const round = (x: number) => Math.round(x * 10000) / 10000;
  const value: { [k: string]: Json } = { colorSpace: 'srgb', components: [round(c.r), round(c.g), round(c.b)] };
  if (c.a < 1) value.alpha = round(c.a);
  value.hex = hexOf(c);
  return value;
}

/** A CSS value as a DTCG $type and $value, or the reason it is not one. */
function typed(name: string, v: string, exported: Set<string>): { $type?: string; $value: Json } | string {
  const alias = /^var\((--[\w-]+)\)$/.exec(v);
  if (alias) return exported.has(alias[1]) ? { $value: ref(alias[1]) } : 'refers to a value that is not exported';
  const colour = colourValue(v);
  if (colour) return { $type: 'color', $value: colour };
  const dim = /^(-?\d*\.?\d+)(px|rem)$/.exec(v);
  if (dim) return { $type: 'dimension', $value: { value: +dim[1], unit: dim[2] } };
  const dur = /^(\d*\.?\d+)(ms|s)$/.exec(v);
  if (dur) return { $type: 'duration', $value: { value: +dur[1], unit: dur[2] } };
  const bez = /^cubic-bezier\(([^)]+)\)$/.exec(v);
  if (bez) {
    const p = bez[1].split(',').map(Number);
    if (p.length === 4 && p.every(Number.isFinite) && p[0] >= 0 && p[0] <= 1 && p[2] >= 0 && p[2] <= 1)
      return { $type: 'cubicBezier', $value: p };
  }
  if (/^-?\d*\.?\d+$/.test(v)) {
    const n = +v;
    const weight = /(^|-)w(-|$)|weight/.test(name) && Number.isInteger(n) && n >= 1 && n <= 1000;
    return { $type: weight ? 'fontWeight' : 'number', $value: n };
  }
  if (FAMILIES.test(name) && !v.includes('var(')) {
    const list = v.split(',').map((f) => f.trim().replace(/^['"]|['"]$/g, ''));
    if (list.every(Boolean)) return { $type: 'fontFamily', $value: list };
  }
  if (/^(calc|clamp|min|max)\(/.test(v)) return 'a CSS expression (calc, clamp, min, max)';
  if (/gradient\(/.test(v)) return 'a CSS gradient';
  if (/color-mix\(/.test(v)) return 'a colour mixed at run time (color-mix)';
  if (/^url\(/.test(v)) return 'a reference to an SVG filter or image';
  return 'a CSS keyword or composite value';
}

export function toDtcg(tokens: CssToken[], name = 'juansync.dev'): DtcgExport {
  const exported = new Set<string>();
  const results = new Map<string, ReturnType<typeof typed>>();
  // Resolve until stable, so an alias exports only when its target does.
  for (let pass = 0; pass < 6; pass++)
    for (const t of tokens) {
      const r = typed(t.name, t.value, exported);
      results.set(t.name, r);
      if (typeof r !== 'string') exported.add(t.name);
      else exported.delete(t.name);
    }
  const foundation: { [k: string]: { [k: string]: Json } } = {};
  const light: { [k: string]: { [k: string]: Json } } = {};
  const dark: { [k: string]: { [k: string]: Json } } = {};
  const skipped: Skipped[] = [];
  const put = (target: typeof foundation, t: CssToken, token: { [k: string]: Json }) => {
    const [g, k] = pathOf(t.name);
    target[g] ??= {};
    target[g][k] = { ...token, $extensions: { 'dev.juansync': { css: t.name, file: t.file } } };
  };
  for (const t of tokens) {
    const r = results.get(t.name);
    if (r === undefined || typeof r === 'string') {
      skipped.push({ name: t.name, value: t.value, reason: r ?? 'unread' });
      continue;
    }
    put(foundation, t, r);
    if (t.dark === undefined) continue;
    const d = typed(t.name, t.dark, exported);
    if (typeof d === 'string') continue;
    put(light, t, r);
    put(dark, t, d);
  }
  const resolver = {
    version: '2025.10',
    name,
    description: 'The paper system on a light page or a dark one. Generated from the CSS tokens.',
    sets: { foundation: { sources: [{ $ref: 'juansync.tokens.json' }] } },
    modifiers: {
      theme: {
        contexts: { light: [{ $ref: 'juansync.light.tokens.json' }], dark: [{ $ref: 'juansync.dark.tokens.json' }] },
        default: 'light',
      },
    },
    resolutionOrder: [{ $ref: '#/sets/foundation' }, { $ref: '#/modifiers/theme' }],
  };
  return { foundation, light, dark, resolver, exported: exported.size, skipped };
}
