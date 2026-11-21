import { getCollection, type CollectionEntry } from 'astro:content';
import type { PostSummary } from '../components/writing/types';
import { learnCard, learnEntries } from './learn';
import { pieceHref } from './library';

const fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** The grid's label for an article: its form, since an article has no post category. */
export const ARTICLE = 'article';

/** Newest first. */
export async function libraryPosts(): Promise<CollectionEntry<'blog'>[]> {
  return (await getCollection('blog')).sort((a, b) => b.data.date.getTime() - a.data.date.getTime() || a.slug.localeCompare(b.slug));
}

/** Every post and article as one list of cards, newest first. */
export async function libraryCards(): Promise<PostSummary[]> {
  const posts = (await libraryPosts()).map((e) => ({
    at: e.data.date.getTime(),
    card: { slug: e.slug, title: e.data.title, excerpt: e.data.excerpt, category: e.data.category, date: fmt.format(e.data.date), read: e.data.readTime, cover: e.data.cover ?? null, href: pieceHref(e.slug) }, // prettier-ignore
  }));
  const articles = (await learnEntries()).map((e) => ({ at: e.data.date.getTime(), card: { ...learnCard(e), category: ARTICLE } }));
  return [...posts, ...articles].sort((a, b) => b.at - a.at || a.card.slug.localeCompare(b.card.slug)).map((x) => x.card);
}
