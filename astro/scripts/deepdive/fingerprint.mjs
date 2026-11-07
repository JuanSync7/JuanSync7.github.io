/** Conservative source identity shared by deterministic, gallery and browser reports. */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ASTRO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const REPOSITORY_ROOT = resolve(ASTRO_ROOT, '..');
const trees = [
  'astro/src/figures/kit',
  'astro/src/styles/tokens',
  'astro/scripts/deepdive',
  '.claude/skills/deepdive-agent',
];
const files = [
  'astro/package.json',
  'astro/package-lock.json',
  'astro/scripts/figures/pixels.mjs',
  'astro/scripts/figures/thresholds.json',
  '.claude/agents/deepdive-agent.md',
  'astro/src/figures/templates/zoom-dive.ts',
  'astro/src/figures/types.ts',
  'astro/src/figures/define.ts',
  'astro/src/figures/defineTemplate.ts',
  'astro/src/figures/registry.ts',
  'astro/src/hooks/useFigureLoop.ts',
  'astro/src/components/ui/FigureCanvas.tsx',
  'astro/src/components/figures/FigureBench.tsx',
  'astro/src/components/ui/figure-canvas.css',
  'astro/src/components/figures/figure-bench.css',
  'astro/src/components/lab/TemplateLab.tsx',
  'astro/src/components/lab/template-lab.css',
  'astro/src/styles/night.css',
  'astro/docs/deepdive.md',
];
function walk(path) {
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const file = join(path, entry.name);
      return entry.isDirectory() ? walk(file) : entry.isFile() ? [file] : [];
    });
}
/** Sorted repository-relative regular files; generated evidence is deliberately excluded. */
export function sourceFiles() {
  const selected = [
    ...files.map((file) => resolve(REPOSITORY_ROOT, file)),
    ...trees.flatMap((tree) => walk(resolve(REPOSITORY_ROOT, tree))),
  ];
  const references = walk(resolve(ASTRO_ROOT, 'docs')).filter((file) =>
    /^deepdive-.*-references\.md$/.test(file.split('/').at(-1)),
  );
  return [...new Set([...selected, ...references])]
    .filter((file) => existsSync(file) && statSync(file).isFile())
    .map((file) => relative(REPOSITORY_ROOT, file).split('\\').join('/'))
    .sort();
}
/** Hash paths and exact bytes; a rename, deletion or source edit changes the identity. */
export function sourceHash() {
  const hash = createHash('sha256');
  for (const file of sourceFiles())
    hash
      .update(file)
      .update('\0')
      .update(readFileSync(resolve(REPOSITORY_ROOT, file)))
      .update('\0');
  return hash.digest('hex');
}
