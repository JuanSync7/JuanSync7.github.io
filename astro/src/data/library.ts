import legacy from './library-legacy.json';

/** The library: every post and article is read at one address, whatever its kind, so a piece can
 *  change kind or topic without its link changing. The slug rules are scripts/library/check.mjs. */
export const LIBRARY = {
  label: 'Library',
  href: '/library/',
  lessons: '/library/lessons/',
  articles: '/library/articles/',
} as const;

/** The blog: the front page of the writing, where a few pieces are featured. Everything written is
 *  in the library, and the blog links there. */
export const BLOG = {
  label: 'Blog',
  href: '/blog/',
  lessonLog: '/blog/#lessons',
} as const;

export function pieceHref(slug: string): string {
  return `/library/${slug}`;
}

const FEED_IDS: Readonly<Record<string, string>> = legacy.feedIds;

/** The id a piece had in the feed before the library, so a reader's app does not show it as new. */
export function feedId(slug: string): string | undefined {
  return FEED_IDS[slug];
}
