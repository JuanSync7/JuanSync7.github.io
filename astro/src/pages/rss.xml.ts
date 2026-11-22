import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { learnEntries } from '../data/learn';
import { feedId, pieceHref } from '../data/library';
import { libraryPosts } from '../data/library-cards';

/** The library's feed: every post and article, newest first. A piece that was in the feed before
 *  the library keeps the id it had there, so a reader's app does not show it as new. */
export async function GET(context: APIContext): Promise<Response> {
  const posts = (await libraryPosts()).map((p) => ({ slug: p.slug, title: p.data.title, description: p.data.excerpt, pubDate: p.data.date }));
  const articles = (await learnEntries()).map((a) => ({ slug: a.slug, title: a.data.title, description: a.data.summary ?? '', pubDate: a.data.date }));
  const pieces = [...posts, ...articles].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime() || a.slug.localeCompare(b.slug));
  return rss({
    title: 'Juan Kok · writing',
    description: 'How AI inference works, from the transistor to the token, plus chip design and building with agents.',
    site: context.site ?? 'https://juansync7.github.io',
    items: pieces.map(({ slug, ...item }) => {
      const kept = feedId(slug);
      return { ...item, link: `${pieceHref(slug)}/`, ...(kept ? { customData: `<guid isPermaLink="true">${kept}</guid>` } : {}) };
    }),
  });
}
