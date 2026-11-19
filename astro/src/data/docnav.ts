import type { CollectionEntry } from 'astro:content';
import { CATEGORY_LABEL } from './writing';
import { learnTopics } from './learn';
import { pieceHref } from './library';

export interface DocLink {
  href: string;
  title: string;
}
export interface DocGroup {
  label: string;
  links: DocLink[];
}

/** The posts of the library, grouped by category, newest first inside each. */
export function blogGroups(entries: readonly CollectionEntry<'blog'>[]): DocGroup[] {
  return Object.keys(CATEGORY_LABEL)
    .map((c) => ({
      label: CATEGORY_LABEL[c] ?? c,
      links: entries.filter((e) => e.data.category === c).map((e) => ({ href: pieceHref(e.slug), title: e.data.title })),
    }))
    .filter((g) => g.links.length > 0);
}

/** The field guides, grouped by topic in the taxonomy's order. */
export function learnGroups(entries: readonly CollectionEntry<'learn'>[]): DocGroup[] {
  return learnTopics(entries).map((t) => ({ label: t.label, links: t.entries.map((e) => ({ href: pieceHref(e.slug), title: e.data.title })) }));
}
