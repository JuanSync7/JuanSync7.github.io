import { useEffect, useState } from 'react';
import type { Lesson } from './types';
import './lesson-log.css';

interface Props {
  /** Newest first. */
  lessons: readonly Lesson[];
  note: string;
}

const DAY = 86_400_000;
const WEEKS = 16;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const utcDay = (iso: string): number => Date.parse(`${iso}T00:00:00Z`);
const longDate = (iso: string): string => {
  const d = new Date(utcDay(iso));
  return `${MONTHS[d.getUTCMonth()] ?? ''} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
};

interface Cell {
  iso: string;
  count: number;
  future: boolean;
  today: boolean;
  label: string;
}

/** Sixteen weeks of days ending this week, Sunday at the top of each column. */
function grid(today: number, counts: Map<string, number>): { cells: Cell[]; months: string[] } {
  const start = today - (new Date(today).getUTCDay() + 7 * (WEEKS - 1)) * DAY;
  const cells: Cell[] = [];
  const months: string[] = [];
  for (let col = 0; col < WEEKS; col++) {
    // Label the first column of each month; column 0 only if its month carries on into
    // column 1, so two labels never crowd the first two columns.
    const month = (c: number): number => new Date(start + c * 7 * DAY).getUTCMonth();
    const first = col === 0 ? month(1) === month(0) : month(col) !== month(col - 1);
    months.push(first ? MONTHS[month(col)] ?? '' : '');
    for (let row = 0; row < 7; row++) {
      const ts = start + (col * 7 + row) * DAY;
      const iso = new Date(ts).toISOString().slice(0, 10);
      const count = counts.get(iso) ?? 0;
      const d = new Date(ts);
      cells.push({ iso, count, future: ts > today, today: ts === today, label: `${MONTHS[d.getUTCMonth()] ?? ''} ${d.getUTCDate()}: ${count ? `${count} ${count === 1 ? 'lesson' : 'lessons'}` : 'no lesson'}` });
    }
  }
  return { cells, months };
}

/** The lesson log: a contribution grid of the last sixteen weeks beside a deck of lesson
 *  cards. Picking a lit day, or stepping newer and older, flips the top card over. */
export default function LessonLog({ lessons, note }: Props) {
  const [index, setIndex] = useState(0);
  const [flips, setFlips] = useState(0);
  // The build knows only its own date, so the grid is anchored to the newest lesson until
  // the reader's clock is available, then to the reader's today.
  const [today, setToday] = useState(() => utcDay(lessons[0]?.iso ?? '2026-01-01'));
  useEffect(() => {
    const now = new Date();
    setToday(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }, []);

  const counts = new Map<string, number>();
  const first = new Map<string, number>();
  lessons.forEach((l, i) => {
    counts.set(l.iso, (counts.get(l.iso) ?? 0) + 1);
    if (!first.has(l.iso)) first.set(l.iso, i);
  });
  const { cells, months } = grid(today, counts);
  const lesson = lessons[index];
  const show = (i: number): void => {
    if (i === index || i < 0 || i >= lessons.length) return;
    setIndex(i);
    setFlips((f) => f + 1);
  };

  return (
    <div className="log">
      <div className="log-grid-panel">
        <div className="log-head">
          <span className="log-count">
            {lessons.length} lessons in {WEEKS} weeks
          </span>
          <span className="log-key" aria-hidden="true">
            less
            <span className="swatch l0" />
            <span className="swatch l1" />
            <span className="swatch l2" />
            <span className="swatch l3" />
            more
          </span>
        </div>
        <div className="log-months" aria-hidden="true">
          {months.map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
        <div className="log-cells" role="group" aria-label="Days with lessons">
          {cells.map((c) => {
            const pick = first.get(c.iso);
            const sel = lesson?.iso === c.iso;
            const cls = ['cell', `l${Math.min(3, c.count)}`, c.future ? 'is-future' : '', c.today ? 'is-today' : '', sel ? 'is-sel' : ''].filter(Boolean).join(' ');
            return <button key={c.iso} type="button" className={cls} disabled={pick === undefined} aria-label={c.label} aria-pressed={sel} onClick={() => pick !== undefined && show(pick)} />;
          })}
        </div>
        <span className="log-note">{note}</span>
      </div>

      <div className="deck">
        <span className="deck-back far" aria-hidden="true" />
        <span className="deck-back near" aria-hidden="true" />
        {lesson ? (
          <article key={flips} className={`leaf ${flips % 2 ? 'a' : 'b'}`} aria-live="polite">
            <span className="leaf-edge" aria-hidden="true" />
            <span className="leaf-meta">
              <span>{longDate(lesson.iso)}</span>
              <span className="leaf-tag">{lesson.tag}</span>
            </span>
            <h3>{lesson.title}</h3>
            <p>{lesson.why}</p>
            <div className="leaf-foot">
              <span className="leaf-no">
                {index + 1} of {lessons.length}
              </span>
              <span className="leaf-nav">
                <button type="button" className="leaf-btn" onClick={() => show(index - 1)} disabled={index === 0}>
                  Newer
                </button>
                <button type="button" className="leaf-btn" onClick={() => show(index + 1)} disabled={index === lessons.length - 1}>
                  Older
                </button>
              </span>
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
}
