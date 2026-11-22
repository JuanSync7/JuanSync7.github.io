import { getCollection, type CollectionEntry } from 'astro:content';
import taxonomy from '../config/lesson-taxonomy.json';
import trackers from '../config/trackers.json';
import type { FeaturedPage, PostSummary } from '../components/writing/types';
import { LIBRARY, pieceHref } from './library';

export const LEARN_COPY = {
  title: 'Field guides',
  body: 'Long explainers on how inference runs, how the silicon under it is built, and how I build with agents. Where a weekly tracker follows the same ground, the guide links to it.',
  all: { label: 'All field guides', href: LIBRARY.articles },
} as const;

/** The library's topics, by id: the shelf an article sits on, shared with the lessons. */
export const TOPIC_LABEL: Record<string, string> = Object.fromEntries(taxonomy.categories.map((c) => [c.id, c.label]));

export function topicLabel(id: string): string {
  const label = TOPIC_LABEL[id];
  if (!label) throw new Error(`unknown topic "${id}"`);
  return label;
}

/** The topics that hold a guide, in the taxonomy's order, each with its guides newest first. */
export function learnTopics<T extends { data: { topic: string } }>(entries: readonly T[]): { id: string; label: string; entries: T[] }[] {
  return taxonomy.categories
    .map((c) => ({ id: c.id, label: c.label, entries: entries.filter((e) => e.data.topic === c.id) }))
    .filter((t) => t.entries.length > 0);
}

/** The weekly tracker an article names, so an explainer and the week's news link to each other. */
export function learnTracker(id: string): { name: string; href: string } {
  const tracker = trackers.find((t) => t.id === id);
  if (!tracker) throw new Error(`unknown tracker "${id}"`);
  return { name: tracker.name, href: `/trackers/${tracker.id}` };
}

const fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Minutes at the posts check's 200 words a minute, so a learn card and a post card agree. */
export function readTime(body: string): string {
  return `${Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200))} min`;
}

/** Newest first. */
export async function learnEntries(): Promise<CollectionEntry<'learn'>[]> {
  return (await getCollection('learn')).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function learnCard(e: CollectionEntry<'learn'>): PostSummary {
  return {
    slug: e.slug,
    title: e.data.title,
    excerpt: e.data.summary ?? '',
    category: e.data.topic,
    date: fmt.format(e.data.date),
    read: readTime(e.body),
    cover: e.data.cover ?? null,
    href: pieceHref(e.slug),
  };
}

/** The library page's shelf: every featured article, newest first. */
export function learnShelf(entries: readonly CollectionEntry<'learn'>[]): FeaturedPage[] {
  return entries
    .filter((e) => e.data.featured)
    .map((e) => {
      const figure = e.data.shelfFigure ?? e.data.cover;
      if (!figure || !e.data.shelfNotes) {
        throw new Error(`featured learn article "${e.slug}" needs a cover (or shelfFigure) and shelfNotes`);
      }
      return {
        slug: e.slug,
        href: pieceHref(e.slug),
        title: e.data.title,
        kind: topicLabel(e.data.topic),
        date: fmt.format(e.data.date),
        read: readTime(e.body),
        blurb: e.data.summary ?? '',
        cta: 'Read the explainer',
        figure,
        notes: e.data.shelfNotes,
      };
    });
}
