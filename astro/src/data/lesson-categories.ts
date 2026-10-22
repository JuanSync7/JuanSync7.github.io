/** The lesson log's categories: each of the sixty-odd tags belongs to exactly one, so the full log
 *  can be read by subject as well as by month. A tag missing here fails the build (see categoryOf),
 *  so a new tag is placed on purpose instead of falling into a catch-all. */
export interface LessonCategory {
  id: string;
  label: string;
  tags: readonly string[];
}

export const LESSON_CATEGORIES: readonly LessonCategory[] = [
  { id: 'agents', label: 'agents & llms', tags: ['agents', 'llm', 'inference', 'rag', 'gpu', 'evals', 'ai'] },
  {
    id: 'silicon',
    label: 'chip design',
    tags: [
      'eda',
      'rtl',
      'verification',
      'systemverilog',
      'sta',
      'lint',
      'synthesis',
      'riscv',
      'dft',
      'protocols',
      'interfaces',
    ],
  },
  {
    id: 'infra',
    label: 'infrastructure',
    tags: ['linux', 'ops', 'networking', 'aws', 'slurm', 'systemd', 'shell', 'email', 'config'],
  },
  { id: 'security', label: 'security', tags: ['security', 'tls', 'integrity', 'ledgers'] },
  { id: 'data', label: 'data & python', tags: ['data', 'python', 'postgres', 'sql', 'sqlite', 'yaml', 'unicode'] },
  { id: 'code', label: 'code & tooling', tags: ['git', 'build', 'tooling', 'make', 'ci', 'code', 'systems'] },
  { id: 'testing', label: 'testing & debugging', tags: ['testing', 'debugging'] },
  {
    id: 'frontend',
    label: 'frontend & design',
    tags: ['frontend', 'design', 'typography', 'css', 'art', 'accessibility'],
  },
  { id: 'docs', label: 'docs & knowledge', tags: ['docs', 'knowledge', 'reporting'] },
  { id: 'work', label: 'how I work', tags: ['process', 'teams', 'reviews', 'planning', 'building', 'learning'] },
  { id: 'thoughts', label: 'thoughts & growth', tags: ['thoughts', 'growth', 'career', 'music', 'games'] },
];

const BY_TAG = new Map(LESSON_CATEGORIES.flatMap((c) => c.tags.map((t) => [t, c.id] as const)));

export function categoryLabel(id: string): string {
  const c = LESSON_CATEGORIES.find((k) => k.id === id);
  if (!c) throw new Error(`unknown lesson category "${id}"`);
  return c.label;
}

export function categoryOf(tag: string): string {
  const id = BY_TAG.get(tag);
  if (!id)
    throw new Error(
      `Lesson tag "${tag}" has no category: add it to LESSON_CATEGORIES in src/data/lesson-categories.ts`,
    );
  return id;
}
