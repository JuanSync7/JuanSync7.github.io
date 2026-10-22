import { useEffect, useState } from 'react';
import type { CategorisedLesson, LessonCategoryLabel } from './types';
import './lesson-index.css';

interface Props {
  /** Newest first. */
  lessons: readonly CategorisedLesson[];
  /** In the order the category view lists them. */
  categories: readonly LessonCategoryLabel[];
}

type View = 'month' | 'category';

interface Group {
  key: string;
  label: string;
  items: CategorisedLesson[];
}

const ALL = 'all';
const month = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const asDate = (iso: string): Date => new Date(`${iso}T00:00:00Z`);

function byMonth(lessons: readonly CategorisedLesson[]): Group[] {
  const groups: Group[] = [];
  for (const l of lessons) {
    const label = month.format(asDate(l.iso));
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(l);
    else groups.push({ key: l.iso.slice(0, 7), label, items: [l] });
  }
  return groups;
}

function byCategory(lessons: readonly CategorisedLesson[], categories: readonly LessonCategoryLabel[]): Group[] {
  return categories
    .map((c) => ({ key: c.id, label: c.label, items: lessons.filter((l) => l.category === c.id) }))
    .filter((g) => g.items.length > 0);
}

/** The whole lesson log, read straight down, either by month or by category, and narrowed to one
 *  category with the pills. The choice is kept in the address (?view=category&c=agents), so a
 *  filtered list can be linked to. Without JavaScript the page is the by-month list. */
export default function LessonIndex({ lessons, categories }: Props) {
  const [view, setView] = useState<View>('month');
  const [filter, setFilter] = useState(ALL);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('view') === 'category') setView('category');
    const c = q.get('c');
    if (c && categories.some((k) => k.id === c)) setFilter(c);
  }, [categories]);

  const choose = (nextView: View, nextFilter: string): void => {
    setView(nextView);
    setFilter(nextFilter);
    const q = new URLSearchParams();
    if (nextView === 'category') q.set('view', 'category');
    if (nextFilter !== ALL) q.set('c', nextFilter);
    const search = q.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${search ? `?${search}` : ''}`);
  };

  const shown = filter === ALL ? lessons : lessons.filter((l) => l.category === filter);
  const groups = view === 'month' ? byMonth(shown) : byCategory(shown, categories);
  const labelOf = new Map(categories.map((c) => [c.id, c.label]));
  const pills = [
    { id: ALL, label: 'all', count: lessons.length },
    ...categories.map((c) => ({ id: c.id, label: c.label, count: lessons.filter((l) => l.category === c.id).length })),
  ].filter((p) => p.count > 0);

  return (
    <div className="lx">
      <div className="lx-controls">
        <div className="lx-row" role="group" aria-label="Order lessons">
          <span className="lx-key">// view</span>
          <div className="lx-pills">
            {(['month', 'category'] as const).map((v) => (
              <button
                key={v}
                type="button"
                className="lx-pill"
                aria-pressed={v === view}
                onClick={() => choose(v, filter)}
              >
                by {v}
              </button>
            ))}
          </div>
        </div>
        <div className="lx-row" role="group" aria-label="Filter lessons by category">
          <span className="lx-key">// category</span>
          <div className="lx-pills">
            {pills.map((p) => (
              <button
                key={p.id}
                type="button"
                className="lx-pill"
                aria-pressed={p.id === filter}
                onClick={() => choose(view, p.id)}
              >
                {p.label}
                <span className="lx-count">{p.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      {groups.map((g) => (
        <section key={`${view}-${g.key}`} className="lx-group" aria-label={g.label}>
          <h2>
            {g.label}
            <span className="lx-count">{g.items.length}</span>
          </h2>
          <ol>
            {g.items.map((l) => (
              <li key={`${l.iso}-${l.title}`}>
                <p className="lx-meta">
                  <time dateTime={l.iso}>{day.format(asDate(l.iso))}</time>
                  {view === 'month' && filter === ALL ? (
                    <span className="lx-cat">{labelOf.get(l.category)}</span>
                  ) : null}
                  <span className="lx-tag">{l.tag}</span>
                </p>
                <h3>{l.title}</h3>
                <p className="lx-why">{l.why}</p>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
