import trackers from '../config/trackers.json';

/**
 * The words on the blog page (/blog) and the library page (/library). Post titles, dates and read times come from the
 * blog collection; this file holds what the page says around them.
 */

export const WRITING_HERO = {
  title: 'Where silicon meets syntax.',
  body: 'Explainers on how AI inference really works, from the transistor to the token. Plus chip design, tooling, and the lessons I pick up building with agents.',
  primary: { label: 'Start with inference', href: '/library/inference-end-to-end' },
  secondary: { label: 'Browse the library', href: '/library/' },
  hint: 'Move across the lattice. Click to send a pulse.',
} as const;

// The shelf's pages are the learn articles flagged `featured` (data/learn.ts).
export const FEATURED = {
  title: 'Featured explainers',
  body: 'Long reads with diagrams, one way into each subject. Turn the page.',
} as const;

export const LESSONS_COPY = {
  title: 'Lessons, logged daily',
  body: 'One thing I learned, most days. Point at a day in the field, or slide through them, newest first.',
  key: 'Each tile is a day. A lesson stands it up as a column, taller for more; today is outlined and the lesson you are reading is lit.',
} as const;

export const POSTS_COPY = {
  title: 'Posts',
  body: 'Newest first. Every cover is a live drawing: point at it and it answers.',
  all: 'Everything is in the library',
} as const;

export const LIBRARY_COPY = {
  title: 'The library',
  body: 'Everything written here, in one place: a shelf for each kind, newest first. Pick a binder to open it on the desk.',
  articles: 'Field guides by topic',
  lessons: 'Every lesson',
} as const;

export const TRACKERS = {
  title: 'Weekly trackers',
  body: 'An agent reads the release notes every week and writes up what moved, so I don’t keep twenty tabs open.',
  items: trackers.map((t) => ({ name: t.name, href: `/trackers/${t.id}`, body: t.body })),
} as const;

export const FOLLOW = {
  title: 'New posts, no spam.',
  body: 'Follow the feed in any reader, or email me and I’ll tell you when something new goes up.',
  feed: { label: 'RSS feed', href: '/rss.xml' },
} as const;

export const CATEGORY_LABEL: Record<string, string> = {
  silicon: 'silicon',
  software: 'software',
  tutorials: 'tutorial',
  thoughts: 'thoughts',
  projects: 'project',
  article: 'article',
};
