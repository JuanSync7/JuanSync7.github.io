import { useEffect, useRef, useState } from 'react';
import FigureCanvas from '../ui/FigureCanvas';
import type { LessonFieldData } from '../../figures/lesson-field';
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
const shortDate = (iso: string): string => {
  const d = new Date(utcDay(iso));
  return `${MONTHS[d.getUTCMonth()] ?? ''} ${d.getUTCDate()}`;
};
const longDate = (iso: string): string => `${shortDate(iso)}, ${new Date(utcDay(iso)).getUTCFullYear()}`;

/** Sixteen weeks of days ending this week, a week to a column, Sunday first. */
function field(today: number, counts: Map<string, number>, selected: string | null): LessonFieldData {
  const start = today - (new Date(today).getUTCDay() + 7 * (WEEKS - 1)) * DAY;
  const days = Array.from({ length: WEEKS * 7 }, (_, i) => {
    const ts = start + i * DAY;
    const iso = new Date(ts).toISOString().slice(0, 10);
    return { iso, count: counts.get(iso) ?? 0, future: ts > today, today: ts === today };
  });
  return { days, weeks: WEEKS, selected };
}

/** The lesson log: the last sixteen weeks as a field of voxel days, lessons standing up as
 *  columns, beside the chosen lesson set as plain type. Pointing at a day names it; clicking
 *  a day with a lesson, a date in the list, or newer and older, changes the lesson. */
export default function LessonLog({ lessons, note }: Props) {
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState('rest');
  // The date list scrolls on its own; keep the chosen lesson in view without moving the page.
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const list = listRef.current;
    const item = list?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!list || !item) return;
    if (item.offsetTop < list.scrollTop) list.scrollTop = item.offsetTop;
    else if (item.offsetTop + item.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = item.offsetTop + item.offsetHeight - list.clientHeight;
  }, [index]);
  // The build knows only its own date, so the field is anchored to the newest lesson until
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
  const lesson = lessons[index];
  const data = field(today, counts, lesson?.iso ?? null);
  // The log reaches further back than the field, so the count is only of the days shown.
  const inField = data.days.reduce((n, d) => n + d.count, 0);
  const show = (i: number): void => {
    if (i >= 0 && i < lessons.length) setIndex(i);
  };
  const target = first.get(hover);
  const hint = hover === 'rest' ? '' : target === undefined ? `${shortDate(hover)} · no lesson` : `${shortDate(hover)} · click to read`;

  return (
    <div className="log">
      {/* Clicking reads the day under the pointer; the date list below is the keyboard way in. */}
      <div className={`log-field${target === undefined ? '' : ' is-live'}`} onClick={() => target !== undefined && show(target)}>
        <FigureCanvas id="lesson-field" data={data} onReadout={setHover} />
        <span className="log-hint" aria-hidden="true">
          {hint}
        </span>
      </div>

      <div className="log-body">
        {/* The live region stays mounted; only the article inside it is re-keyed (for its
            entrance), so a change of lesson is announced. */}
        <div className="log-live" aria-live="polite">
        {lesson ? (
          <article key={index} className="log-entry">
            <p className="log-meta">
              <time dateTime={lesson.iso}>{longDate(lesson.iso)}</time>
              <span className="log-tag">{lesson.tag}</span>
            </p>
            <h3 className="log-title">{lesson.title}</h3>
            <p className="log-why">{lesson.why}</p>
          </article>
        ) : null}
        </div>

        <div className="log-side">
          <p className="log-count">
            {inField} lessons in {WEEKS} weeks
          </p>
          <div className="log-nav">
            <button type="button" className="log-step" onClick={() => show(index - 1)} disabled={index === 0}>
              ← Newer
            </button>
            <span className="log-no">
              {index + 1} / {lessons.length}
            </span>
            <button type="button" className="log-step" onClick={() => show(index + 1)} disabled={index === lessons.length - 1}>
              Older →
            </button>
          </div>
          <ol ref={listRef} className="log-days" aria-label="Lessons by date">
            {lessons.map((l, i) => (
              <li key={`${l.iso}-${i}`}>
                <button type="button" className="log-day" aria-pressed={i === index} onClick={() => show(i)}>
                  <span className="log-day-date">{shortDate(l.iso)}</span>
                  <span className="log-day-title">{l.title}</span>
                </button>
              </li>
            ))}
          </ol>
          <p className="log-note">{note}</p>
        </div>
      </div>
    </div>
  );
}
