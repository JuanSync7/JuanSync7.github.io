/** Shapes the writing page hands to its islands: plain, serialisable data. */

export interface PostSummary {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  /** Display date, e.g. "Jun 14, 2026". */
  date: string;
  read: string;
  cover: string | null;
  href: string;
}

export interface FeaturedPage {
  slug: string;
  /** Where the post is read: its page, or its external home. */
  href: string;
  title: string;
  kind: string;
  date: string;
  read: string;
  blurb: string;
  cta: string;
  figure: string;
  notes: readonly [string, string];
}

export interface Lesson {
  /** yyyy-mm-dd, UTC. */
  iso: string;
  tag: string;
  title: string;
  why: string;
}

export interface CategorisedLesson extends Lesson {
  /** A LessonCategory id, from the lesson's tag. */
  category: string;
}
