import { getCollection, type CollectionEntry } from 'astro:content';
import { LEARN_SUBJECTS } from '../content/config';
import type { FeaturedPage, PostSummary } from '../components/writing/types';

/** The words and the order of the learn pages. Each subject names the weekly tracker that
 *  follows it, so an explainer and the week's news about the same thing link to each other. */
export type LearnSubject = (typeof LEARN_SUBJECTS)[number];

export const LEARN_SUBJECT: Record<LearnSubject, { label: string; tracker: { name: string; href: string } }> = {
  inference: { label: 'inference', tracker: { name: 'Inference engines', href: '/trackers/inference-engines' } },
  silicon: { label: 'silicon', tracker: { name: 'Inference silicon', href: '/trackers/inference-silicon' } },
  agents: { label: 'agents', tracker: { name: 'Frontier models', href: '/trackers/frontier-models' } },
};

export const LEARN_COPY = {
  title: 'Field guides',
  body: 'Long explainers on how inference runs, how the silicon under it is built, and how I build with agents. Each subject has a weekly tracker that follows it.',
  all: { label: 'All field guides', href: '/learn/' },
} as const;

export const LEARN_SUBJECT_LABEL: Record<string, string> = Object.fromEntries(
  LEARN_SUBJECTS.map((s) => [s, LEARN_SUBJECT[s].label]),
);

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
    category: e.data.subject,
    date: fmt.format(e.data.date),
    read: readTime(e.body),
    cover: e.data.cover ?? null,
    href: `/learn/${e.slug}`,
  };
}

/** The writing page's shelf: the featured article of each subject, in subject order. A subject
 *  with two featured articles fails the build: the rule is one way in per subject. */
export function learnShelf(entries: readonly CollectionEntry<'learn'>[]): FeaturedPage[] {
  return LEARN_SUBJECTS.flatMap((s) => {
    const picked = entries.filter((e) => e.data.subject === s && e.data.featured);
    if (picked.length > 1) {
      throw new Error(`learn subject "${s}" has ${picked.length} featured articles (${picked.map((e) => e.slug).join(', ')}): feature one`);
    }
    return picked.map((e) => {
      const figure = e.data.shelfFigure ?? e.data.cover;
      if (!figure || !e.data.shelfNotes) {
        throw new Error(`featured learn article "${e.slug}" needs a cover (or shelfFigure) and shelfNotes`);
      }
      return {
        slug: e.slug,
        href: `/learn/${e.slug}`,
        title: e.data.title,
        kind: LEARN_SUBJECT[s].label,
        date: fmt.format(e.data.date),
        read: readTime(e.body),
        blurb: e.data.summary ?? '',
        cta: 'Read the explainer',
        figure,
        notes: e.data.shelfNotes,
      };
    });
  });
}
