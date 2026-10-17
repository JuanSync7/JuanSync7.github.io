import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

/** The blog's feed: every post, newest first, linking to its page (or its external home). */
export async function GET(context: APIContext): Promise<Response> {
  const posts = (await getCollection('blog')).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  return rss({
    title: 'Juan Kok · writing',
    description: 'How AI inference works, from the transistor to the token, plus chip design and building with agents.',
    site: context.site ?? 'https://juansync7.github.io',
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.excerpt,
      pubDate: p.data.date,
      link: p.data.externalUrl ?? `/blog/${p.slug}/`,
    })),
  });
}
