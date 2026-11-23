import type { ArchiveShelf } from '../components/library/archive/types';
import { libraryCards } from './library-cards';
import { CATEGORY_LABEL } from './writing';

/** The library as shelves: one shelf per kind of writing, in the order the kinds first appear
 *  newest first, each shelf newest first. Numbers count down a shelf from 01; the newest piece in
 *  the whole library is marked. */
export async function libraryShelves(): Promise<ArchiveShelf[]> {
  const cards = await libraryCards();
  const ids = Array.from(new Set(cards.map((c) => c.category)));
  return ids.map((id) => ({
    id,
    label: CATEGORY_LABEL[id] ?? id,
    pieces: cards
      .filter((c) => c.category === id)
      .map((c, i) => ({
        slug: c.slug,
        href: c.href,
        title: c.title,
        excerpt: c.excerpt,
        date: c.date,
        read: c.read,
        cover: c.cover,
        num: String(i + 1).padStart(2, '0'),
        latest: c.slug === cards[0]?.slug,
      })),
  }));
}
