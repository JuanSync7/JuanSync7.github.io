/** What the check and the look both read from a figure's source file. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const FIG_DIR = join(ROOT, 'src', 'figures');
export const FIX_DIR = join(FIG_DIR, 'fixtures');
const SUPPORT = new Set(['types', 'define', 'defineThree', 'registry']);

export function figureFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.ts') && !SUPPORT.has(basename(f, '.ts')))
    .sort()
    .map((f) => join(dir, f));
}

/** The declared facts the look needs, read from the source text. */
export function readMeta(path) {
  const raw = readFileSync(path, 'utf8');
  const get = (k) => raw.match(new RegExp(`\\n\\s*${k}:\\s*('([^']*)'|[^,\\n]+)`));
  const str = (k) => get(k)?.[2];
  const bool = (k) => get(k)?.[1]?.trim() === 'true';
  return {
    id: basename(path, '.ts'),
    title: str('title') ?? basename(path, '.ts'),
    motion: str('motion') ?? 'still',
    answers: bool('answers'),
    bleed: bool('bleed'),
    three: /defineThreeFigure/.test(raw),
    style: /defineThreeFigure/.test(raw) ? 'three' : str('style') ?? '',
    expectLook: raw.match(/^\/\/ expect-look:\s*(.*)$/m)?.[1],
  };
}
