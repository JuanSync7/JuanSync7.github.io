/** A fictional teaching graph. It contains no exported vault notes or runtime data connection. */
export type ExampleKind = 'group' | 'topic' | 'lesson' | 'source';
export type ExampleRelation = 'member_of' | 'part_of' | 'links_to' | 'applies_to' | 'supported_by';
export interface ExampleNote {
  id: string;
  title: string;
  kind: ExampleKind;
  aliases: readonly string[];
  summary: string;
  trust: 'Navigation only' | 'Reviewed example' | 'Unreviewed example';
}
export interface ExampleEdge {
  from: string;
  relation: ExampleRelation;
  to: string;
}
export interface ExampleResult {
  note: ExampleNote;
  score: number;
  reasons: readonly string[];
}
export interface ExampleNeighbor extends ExampleEdge {
  direction: 'outgoing' | 'incoming';
  note: ExampleNote;
}

export const EXAMPLE_NOTES: readonly ExampleNote[] = [
  { id: 'engineering', title: 'Engineering', kind: 'group', aliases: ['engineering map'],
    summary: 'A fictional broad map of engineering topics and practices.', trust: 'Navigation only' },
  { id: 'reliable-systems', title: 'Reliable systems', kind: 'group', aliases: ['reliability'],
    summary: 'A narrower group for retry behavior, duplicate work and service failures.', trust: 'Navigation only' },
  { id: 'troubleshooting', title: 'Troubleshooting', kind: 'group', aliases: ['debugging'],
    summary: 'Another route into failures, observations and lessons.', trust: 'Navigation only' },
  { id: 'retries', title: 'Retries', kind: 'topic', aliases: ['retry', 'retry policy', 'retrying'],
    summary: 'When to repeat an operation after a failure, and how to limit the attempt.', trust: 'Unreviewed example' },
  { id: 'bound-retries', title: 'Bound retries', kind: 'lesson', aliases: ['retry limit'],
    summary: 'An illustrative lesson: cap retry attempts and record the final failure.', trust: 'Reviewed example' },
  { id: 'queue-retry-note', title: 'Queue retry experiment', kind: 'source', aliases: ['retry experiment'],
    summary: 'A fictional work note about observing repeated attempts after a queue failure.', trust: 'Unreviewed example' },
  { id: 'idempotency', title: 'Idempotency', kind: 'topic', aliases: ['safe repetition', 'duplicate work'],
    summary: 'Repeating the same request should preserve its intended effect.', trust: 'Unreviewed example' },
  { id: 'duplicate-job-note', title: 'Duplicate job example', kind: 'source', aliases: ['duplicate job'],
    summary: 'An invented example of checking whether a repeated job produces a second effect.', trust: 'Unreviewed example' },
  { id: 'observability', title: 'Observability', kind: 'topic', aliases: ['service signals'],
    summary: 'Use recorded signals to understand what a service did.', trust: 'Unreviewed example' },
  { id: 'timeout-note', title: 'Timeout observation example', kind: 'source', aliases: ['timeout'],
    summary: 'A fictional note showing why a timeout alone does not identify a cause.', trust: 'Unreviewed example' },
];

export const EXAMPLE_EDGES: readonly ExampleEdge[] = [
  { from: 'reliable-systems', relation: 'part_of', to: 'engineering' },
  { from: 'troubleshooting', relation: 'part_of', to: 'engineering' },
  { from: 'retries', relation: 'member_of', to: 'reliable-systems' },
  { from: 'bound-retries', relation: 'member_of', to: 'reliable-systems' },
  { from: 'bound-retries', relation: 'member_of', to: 'troubleshooting' },
  { from: 'bound-retries', relation: 'applies_to', to: 'retries' },
  { from: 'bound-retries', relation: 'supported_by', to: 'queue-retry-note' },
  { from: 'queue-retry-note', relation: 'links_to', to: 'retries' },
  { from: 'retries', relation: 'links_to', to: 'idempotency' },
  { from: 'idempotency', relation: 'member_of', to: 'reliable-systems' },
  { from: 'duplicate-job-note', relation: 'links_to', to: 'idempotency' },
  { from: 'observability', relation: 'member_of', to: 'troubleshooting' },
  { from: 'timeout-note', relation: 'links_to', to: 'observability' },
];

const STOPWORDS = new Set(['a', 'an', 'and', 'about', 'can', 'do', 'for', 'how', 'i', 'in', 'of', 'the', 'to', 'what']);
const normalized = (text: string): string => text.trim().toLowerCase().replace(/\s+/g, ' ');
export const tokenize = (text: string): readonly string[] =>
  [...new Set(text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((word) => word && !STOPWORDS.has(word)))];

/** Field-weighted word matches illustrate candidate ranking; this is not the private vault's engine. */
export function rankNotes(query: string, notes: readonly ExampleNote[] = EXAMPLE_NOTES): readonly ExampleResult[] {
  const words = tokenize(query);
  if (!words.length) return [];
  const fields = notes.map((note) => ({ note, title: tokenize(note.title),
    aliases: tokenize(note.aliases.join(' ')), summary: tokenize(note.summary) }));
  const frequency = new Map(words.map((word) => [word,
    fields.filter((row) => [...row.title, ...row.aliases, ...row.summary].includes(word)).length]));
  return fields.map((row): ExampleResult => {
    const exactAlias = row.note.aliases.find((alias) => normalized(alias) === normalized(query));
    const exact = exactAlias !== undefined || normalized(row.note.title) === normalized(query) || row.note.id === normalized(query);
    const reasons: string[] = exactAlias ? [`alias: ${exactAlias}`] : [];
    for (const field of ['title', 'aliases', 'summary'] as const) {
      const hits = words.filter((word) => row[field].includes(word));
      if (hits.length && !(field === 'aliases' && exactAlias)) reasons.push(`${field}: ${hits.join(', ')}`);
    }
    const score = (exact ? 1000 : 0) + words.reduce((total, word) => total +
      Math.log(1 + notes.length / (1 + (frequency.get(word) ?? 0))) *
      ((row.title.includes(word) ? 9 : 0) + (row.aliases.includes(word) ? 7 : 0) + (row.summary.includes(word) ? 2 : 0)), 0);
    return { note: row.note, score, reasons };
  }).filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || (a.note.id < b.note.id ? -1 : a.note.id > b.note.id ? 1 : 0));
}

/** One declared edge only. Incoming links remain visibly incoming rather than reversing their meaning. */
export function graphNeighbors(id: string, notes: readonly ExampleNote[] = EXAMPLE_NOTES,
  edges: readonly ExampleEdge[] = EXAMPLE_EDGES): readonly ExampleNeighbor[] {
  const byId = new Map(notes.map((note) => [note.id, note]));
  if (!byId.has(id)) return [];
  return edges.flatMap((edge): ExampleNeighbor[] => {
    const direction = edge.from === id ? 'outgoing' : edge.to === id ? 'incoming' : undefined;
    if (!direction) return [];
    const note = byId.get(direction === 'outgoing' ? edge.to : edge.from);
    return note ? [{ ...edge, direction, note }] : [];
  });
}
