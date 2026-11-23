/** CSS tokens as W3C Design Tokens (DTCG Format Module 2025.10): a foundation file, a light and a
 *  dark theme file for the tokens whose value changes with the theme, and a resolver that joins them.
 *  A value DTCG has no type for (a calc(), a gradient, color-mix()) stays CSS-only and is listed with
 *  its reason, never guessed. */
import { hexOf, parseColour } from './contrast';
import type { CssToken } from './read';

export type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
export type JsonObject = { [k: string]: Json };

export interface Skipped {
  name: string;
  value: string;
  reason: string;
}

export interface DtcgOptions {
  /** The design system's name, in the resolver. Default `design-tokens`. */
  name?: string;
  /** The start of each file name: `<prefix>.tokens.json`, `<prefix>.light.tokens.json` and so on.
   *  Default `design`. */
  prefix?: string;
  /** The `$extensions` key that records each token's CSS name and file. Default `css`. */
  namespace?: string;
  /** The resolver's description. */
  description?: string;
}

export interface DtcgExport {
  foundation: { [group: string]: JsonObject };
  light: { [group: string]: JsonObject };
  dark: { [group: string]: JsonObject };
  resolver: JsonObject;
  /** The four files by name, ready to write or serve. */
  files: Record<string, JsonObject>;
  exported: number;
  skipped: Skipped[];
}

/** `--pp-ink-strong` is group `pp`, token `ink-strong`. */
export const pathOf = (name: string): [string, string] => {
  const [group = '', ...rest] = name.slice(2).split('-');
  return [group, rest.join('-') || group];
};
const ref = (name: string) => `{${pathOf(name).join('.')}}`;
const FAMILIES = /(sans|serif|mono|display|hand|drafting)$/;

function colourValue(v: string): Json | null {
  const c = parseColour(v);
  if (!c) return null;
  const round = (x: number) => Math.round(x * 10000) / 10000;
  const value: JsonObject = { colorSpace: 'srgb', components: [round(c.r), round(c.g), round(c.b)] };
  if (c.a < 1) value.alpha = round(c.a);
  value.hex = hexOf(c);
  return value;
}

/** A CSS value as a DTCG $type and $value, or the reason it is not one. */
export function typed(name: string, v: string, exported: Set<string>): { $type?: string; $value: Json } | string {
  const alias = /^var\((--[\w-]+)\)$/.exec(v)?.[1];
  if (alias !== undefined) return exported.has(alias) ? { $value: ref(alias) } : 'refers to a value that is not exported';
  const colour = colourValue(v);
  if (colour) return { $type: 'color', $value: colour };
  const dim = /^(-?\d*\.?\d+)(px|rem)$/.exec(v);
  if (dim?.[1] !== undefined && dim[2] !== undefined) return { $type: 'dimension', $value: { value: +dim[1], unit: dim[2] } };
  const dur = /^(\d*\.?\d+)(ms|s)$/.exec(v);
  if (dur?.[1] !== undefined && dur[2] !== undefined) return { $type: 'duration', $value: { value: +dur[1], unit: dur[2] } };
  const bez = /^cubic-bezier\(([^)]+)\)$/.exec(v)?.[1];
  if (bez !== undefined) {
    const p = bez.split(',').map(Number);
    const [x1 = NaN, , x2 = NaN] = p;
    if (p.length === 4 && p.every(Number.isFinite) && x1 >= 0 && x1 <= 1 && x2 >= 0 && x2 <= 1)
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

export function toDtcg(tokens: CssToken[], options: DtcgOptions = {}): DtcgExport {
  const { name = 'design-tokens', prefix = 'design', namespace = 'css' } = options;
  const description = options.description ?? 'Light and dark themes. Generated from the CSS tokens.';
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
  const foundation: DtcgExport['foundation'] = {};
  const light: DtcgExport['light'] = {};
  const dark: DtcgExport['dark'] = {};
  const skipped: Skipped[] = [];
  const put = (target: DtcgExport['foundation'], t: CssToken, token: JsonObject) => {
    const [g, k] = pathOf(t.name);
    const group = (target[g] ??= {});
    group[k] = { ...token, $extensions: { [namespace]: { css: t.name, file: t.file } } };
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
  const file = { foundation: `${prefix}.tokens.json`, light: `${prefix}.light.tokens.json`, dark: `${prefix}.dark.tokens.json` };
  const resolver: JsonObject = {
    version: '2025.10',
    name,
    description,
    sets: { foundation: { sources: [{ $ref: file.foundation }] } },
    modifiers: {
      theme: {
        contexts: { light: [{ $ref: file.light }], dark: [{ $ref: file.dark }] },
        default: 'light',
      },
    },
    resolutionOrder: [{ $ref: '#/sets/foundation' }, { $ref: '#/modifiers/theme' }],
  };
  const files = {
    [file.foundation]: foundation,
    [file.light]: light,
    [file.dark]: dark,
    [`${prefix}.resolver.json`]: resolver,
  };
  return { foundation, light, dark, resolver, files, exported: exported.size, skipped };
}
