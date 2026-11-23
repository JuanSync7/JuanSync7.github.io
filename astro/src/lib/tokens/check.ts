/** The design system against two standards, from the CSS tokens. Each check returns its problems as
 *  sentences, an empty list when it passes.
 *  1. W3C Design Tokens (DTCG 2025.10): the export is well formed. Every token has a $type or is a
 *     reference, every reference lands on a token, every colour is srgb with a 6-digit hex, and the
 *     resolver names version 2025.10 and only files the export has.
 *  2. WCAG 2.2 (ISO/IEC 40500:2025): every pair meets what it needs on a light page and a dark one. */
import { NEED, ratioOf, type ContrastGroup, type Theme } from './contrast';
import { toDtcg, type DtcgExport, type DtcgOptions, type Json } from './dtcg';
import type { CssToken } from './read';

const isObject = (v: Json | undefined): v is { [k: string]: Json } =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Every `$ref` in the resolver that is a file name rather than a pointer inside it. */
function fileRefs(v: Json | undefined, out: string[] = []): string[] {
  if (Array.isArray(v)) for (const x of v) fileRefs(x, out);
  else if (isObject(v))
    for (const [k, x] of Object.entries(v)) {
      if (k === '$ref' && typeof x === 'string' && !x.startsWith('#')) out.push(x);
      else fileRefs(x, out);
    }
  return out;
}

export function checkDtcg(x: DtcgExport): string[] {
  const errs: string[] = [];
  const sets: [string, DtcgExport['foundation']][] = [
    ['foundation', x.foundation],
    ['light', x.light],
    ['dark', x.dark],
  ];
  for (const [setName, set] of sets)
    for (const [g, group] of Object.entries(set))
      for (const [k, t] of Object.entries(group)) {
        const id = `${setName} ${g}.${k}`;
        if (!isObject(t)) {
          errs.push(`DTCG: ${id} is not a token`);
          continue;
        }
        const v = t.$value;
        if (typeof v === 'string' && /^\{.+\}$/.test(v)) {
          const [rg = '', rk = ''] = v.slice(1, -1).split('.');
          if (!x.foundation[rg]?.[rk]) errs.push(`DTCG: ${id} refers to ${v}, which is not a token`);
        } else if (!t.$type) errs.push(`DTCG: ${id} has no $type`);
        if (t.$type === 'color' && !(isObject(v) && v.colorSpace === 'srgb' && /^#[0-9a-f]{6}$/.test(String(v.hex))))
          errs.push(`DTCG: ${id} is not an srgb colour with a 6-digit hex`);
      }
  if (x.resolver.version !== '2025.10') errs.push('DTCG: the resolver is not version 2025.10');
  for (const f of fileRefs(x.resolver))
    if (!(f in x.files)) errs.push(`DTCG: the resolver names ${f}, which the export does not have`);
  return errs;
}

export function checkContrast(tokens: CssToken[], groups: ContrastGroup[]): string[] {
  const map = new Map(tokens.map((t) => [t.name, t]));
  const errs: string[] = [];
  for (const group of groups)
    for (const p of group.pairs) {
      const need = NEED[p.need];
      for (const theme of ['light', 'dark'] as Theme[]) {
        const r = ratioOf(p, theme, map);
        if (Number.isNaN(r)) errs.push(`WCAG: ${p.role} (${p.fg} on ${p.ground}) has no ${theme} colour`);
        else if (need && r < need[0])
          errs.push(`WCAG: ${p.role} is ${r.toFixed(2)}:1 on a ${theme} page, needs ${need[0]}:1 (${p.fg} on ${p.ground})`);
      }
    }
  return errs;
}

export interface CheckResult {
  errs: string[];
  dtcg: DtcgExport;
  pairs: number;
}

/** Both checks over the tokens: the DTCG export they make, and the contrast pairs. */
export function checkTokens(tokens: CssToken[], groups: ContrastGroup[], options: DtcgOptions = {}): CheckResult {
  const dtcg = toDtcg(tokens, options);
  const errs = [...checkDtcg(dtcg), ...checkContrast(tokens, groups)];
  return { errs, dtcg, pairs: groups.reduce((n, g) => n + g.pairs.length, 0) };
}
