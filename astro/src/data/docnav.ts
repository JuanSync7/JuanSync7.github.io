import type { CollectionEntry } from 'astro:content';
import { LEARN_SUBJECTS } from '../content/config';
import { CATEGORY_LABEL } from './writing';
import { LEARN_SUBJECT } from './learn';

export interface DocLink {
  href: string;
  title: string;
}
export interface DocGroup {
  label: string;
  links: DocLink[];
}

/** The posts of the writing section, grouped by category, newest first inside each. */
export function blogGroups(entries: readonly CollectionEntry<'blog'>[]): DocGroup[] {
  return Object.keys(CATEGORY_LABEL)
    .map((c) => ({
      label: CATEGORY_LABEL[c] ?? c,
      links: entries.filter((e) => e.data.category === c).map((e) => ({ href: `/blog/${e.slug}`, title: e.data.title })),
    }))
    .filter((g) => g.links.length > 0);
}

/** The field guides, grouped by subject in subject order. */
export function learnGroups(entries: readonly CollectionEntry<'learn'>[]): DocGroup[] {
  return LEARN_SUBJECTS.map((s) => ({
    label: LEARN_SUBJECT[s].label,
    links: entries.filter((e) => e.data.subject === s).map((e) => ({ href: `/learn/${e.slug}`, title: e.data.title })),
  })).filter((g) => g.links.length > 0);
}
