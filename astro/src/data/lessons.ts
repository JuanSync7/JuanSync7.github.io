import { getCollection } from 'astro:content';
import type { Lesson } from '../components/writing/types';
import { LESSON_CATEGORIES, categoryOf } from './lesson-categories';

/** The full log is cut into pages at build time so no page grows with the log: one page per
 *  month, and each category in pages of PAGE_SIZE. A page's size is bounded by how much is
 *  logged in a month, or by PAGE_SIZE, never by the length of the whole log. */
export const PAGE_SIZE = 60;
export const LESSONS_HREF = '/blog/lessons/';
export const CATEGORY_HREF = `${LESSONS_HREF}category/`;

export interface LessonGroup {
  key: string;
  label: string;
  items: Lesson[];
  /** How many lessons the group has in all, when the page shows only some of them. */
  total?: number;
  more?: string;
}

export interface LessonMonth {
  /** yyyy-mm */
  key: string;
  label: string;
  href: string;
  count: number;
}

export interface LessonCategoryLink {
  id: string;
  label: string;
  href: string;
  count: number;
}

const monthName = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const monthShort = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const firstOf = (key: string): Date => new Date(`${key}-01T00:00:00Z`);

/** Newest first. */
export async function allLessons(): Promise<Lesson[]> {
  return (await getCollection('lessons'))
    .map((l) => ({
      iso: l.data.date.toISOString().slice(0, 10),
      tag: l.data.tag,
      category: categoryOf(l.data.tag),
      title: l.data.title,
      why: l.data.why,
    }))
    .sort((a, b) => b.iso.localeCompare(a.iso));
}

/** Lessons already newest first stay in order, a group per month. */
export function byMonth(lessons: readonly Lesson[]): LessonGroup[] {
  const groups: LessonGroup[] = [];
  for (const l of lessons) {
    const key = l.iso.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(l);
    else groups.push({ key, label: monthName.format(firstOf(key)), items: [l] });
  }
  return groups;
}

export function months(lessons: readonly Lesson[]): LessonMonth[] {
  return byMonth(lessons).map((g, i) => ({
    key: g.key,
    label: monthShort.format(firstOf(g.key)),
    // The newest month is the log's front page, so it has one address, not two.
    href: i === 0 ? LESSONS_HREF : `${LESSONS_HREF}${g.key}/`,
    count: g.items.length,
  }));
}

export function categoryLinks(lessons: readonly Lesson[]): LessonCategoryLink[] {
  return LESSON_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    href: `${CATEGORY_HREF}${c.id}/`,
    count: lessons.filter((l) => l.category === c.id).length,
  })).filter((c) => c.count > 0);
}
