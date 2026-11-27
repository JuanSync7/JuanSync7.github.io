import type { IndexEntry } from './types';

export interface Hit {
  entry: IndexEntry;
  /** The top-level part of the site it sits in ('Library'), from that page's own label. */
  section: string;
  score: number;
}

const depth = (path: string) => path.split('/').filter(Boolean).length;
const words = (text: string) => text.toLowerCase().split(/[\s/]+/).filter(Boolean);

/** The pages a reader can search: tool pages and files are in the index, not in the search. */
export const searchable = (entries: readonly IndexEntry[]) => entries.filter((e) => e.kind === 'page' && !e.tool);

/** The section label of every address: the label of its first segment's page, or the segment itself. */
export function sections(entries: readonly IndexEntry[]): (path: string) => string {
  const top = new Map(entries.filter((e) => depth(e.path) === 1).map((e) => [e.path, e.label]));
  return (path) => {
    const first = path.split('/').filter(Boolean)[0];
    if (!first) return 'Home';
    return top.get(`/${first}/`) ?? first;
  };
}

/** How well one entry answers the words, or 0 when any word is missing from it. */
function score(entry: IndexEntry, query: string[]): number {
  const label = entry.label.toLowerCase();
  const labelWords = words(entry.label);
  const pathWords = words(entry.path);
  const title = entry.title.toLowerCase();
  const description = entry.description.toLowerCase();
  let total = 0;
  for (const w of query) {
    let s = 0;
    if (labelWords.some((lw) => lw.startsWith(w))) s += 6;
    else if (label.includes(w)) s += 4;
    if (pathWords.some((pw) => pw.startsWith(w))) s += 3;
    else if (pathWords.some((pw) => pw.includes(w))) s += 2;
    if (!s && title.includes(w)) s += 1;
    if (description.includes(w)) s += 1;
    if (!s) return 0;
    total += s;
  }
  const whole = query.join(' ');
  if (label === whole) total += 10;
  else if (label.startsWith(whole)) total += 5;
  return total;
}

/**
 * The pages that hold every word typed, best first: a word at the start of a page's name counts most,
 * then its address, then its description. Ties go to the shallower page. An empty search offers the
 * top of each part of the site.
 */
export function search(entries: readonly IndexEntry[], query: string, limit = 8): Hit[] {
  const pages = searchable(entries);
  const sectionOf = sections(entries);
  const q = words(query);
  const hits = q.length
    ? pages.map((entry) => ({ entry, score: score(entry, q) })).filter((h) => h.score > 0)
    : pages.filter((e) => depth(e.path) <= 1).map((entry) => ({ entry, score: 0 }));
  return hits
    .sort((a, b) => b.score - a.score || depth(a.entry.path) - depth(b.entry.path) || a.entry.label.localeCompare(b.entry.label))
    .slice(0, limit)
    .map((h) => ({ ...h, section: sectionOf(h.entry.path) }));
}

/** The parts of a text that a search word starts or sits in, for marking: [text, marked][] in order. */
export function marks(text: string, query: string): [string, boolean][] {
  const q = words(query);
  if (!q.length) return [[text, false]];
  const lower = text.toLowerCase();
  const on = new Array<boolean>(text.length).fill(false);
  for (const w of q) {
    for (let at = lower.indexOf(w); at >= 0; at = lower.indexOf(w, at + 1)) on.fill(true, at, at + w.length);
  }
  const out: [string, boolean][] = [];
  for (let i = 0; i < text.length; i++) {
    const last = out[out.length - 1];
    if (last && last[1] === on[i]) last[0] += text[i];
    else out.push([text[i] ?? '', on[i] ?? false]);
  }
  return out;
}
