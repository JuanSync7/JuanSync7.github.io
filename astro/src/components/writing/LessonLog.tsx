import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import FigureCanvas from '../ui/FigureCanvas';
import type { LessonFieldData } from '../../figures/lesson-field';
import { categoryLabel } from '../../data/lesson-categories';
import type { Lesson } from './types';
import './lesson-log.css';

interface Props {
  /** Newest first. */
  lessons: readonly Lesson[];
  note: string;
  /** Where every lesson is listed. */
  allHref: string;
}

const DAY = 86_400_000;
/** The field's reach; the writing page hands over only the lessons inside it. */
export const WEEKS = 16;
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
 *  columns, over a row of lessons that slides left and right (swipe, the arrows, or the
 *  arrow keys), newest first. The lesson at the row's left edge is the one lit in the
 *  field; clicking a day slides to its lesson. Every lesson is on its own page. */
export default function LessonLog({ lessons, note, allHref }: Props) {
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState('rest');
  const track = useRef<HTMLOListElement>(null);
  // While a slide the buttons asked for is under way, that lesson is the current one, so
  // quick clicks add up instead of reading back where the row has scrolled to so far.
  const going = useRef<number | null>(null);
  // The build knows only its own date, so the field is anchored to the newest lesson until
  // the reader's clock is available, then to the reader's today.
  const [today, setToday] = useState(() => utcDay(lessons[0]?.iso ?? '2026-01-01'));
  useEffect(() => {
    const now = new Date();
    setToday(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }, []);

  /** The width of one card plus the gap after it: how far one step slides. */
  const step = (): number => {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return 1;
    return card.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0');
  };
  const slide = (i: number): void => {
    const el = track.current;
    const to = Math.max(0, Math.min(lessons.length - 1, i));
    if (!el) return;
    going.current = to;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: to * step(), behavior: smooth ? 'smooth' : 'auto' });
    setIndex(to);
  };
  // Whatever moved the row (a swipe, a trackpad, the buttons), the lesson at its left edge
  // is the one the field lights.
  useEffect(() => {
    const el = track.current;
    if (!el) return undefined;
    const onScroll = (): void => {
      const at = Math.max(0, Math.min(lessons.length - 1, Math.round(el.scrollLeft / step())));
      if (going.current !== null && at !== going.current) return;
      going.current = null;
      setIndex(at);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [lessons.length]);

  const counts = new Map<string, number>();
  const first = new Map<string, number>();
  lessons.forEach((l, i) => {
    counts.set(l.iso, (counts.get(l.iso) ?? 0) + 1);
    if (!first.has(l.iso)) first.set(l.iso, i);
  });
  const data = field(today, counts, lessons[index]?.iso ?? null);
  // The log reaches further back than the field, so the count is only of the days shown.
  const inField = data.days.reduce((n, d) => n + d.count, 0);
  const target = first.get(hover);
  const hint = hover === 'rest' ? '' : target === undefined ? `${shortDate(hover)} · no lesson` : `${shortDate(hover)} · click to read`;
  const keys = (e: KeyboardEvent<HTMLElement>): void => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    slide((going.current ?? index) + (e.key === 'ArrowRight' ? 1 : -1));
  };

  return (
    <div className="log">
      <div className={`log-field${target === undefined ? '' : ' is-live'}`} onClick={() => target !== undefined && slide(target)}>
        <FigureCanvas id="lesson-field" data={data} onReadout={setHover} />
        <span className="log-hint" aria-hidden="true">
          {hint}
        </span>
      </div>

      <div className="log-head">
        <p className="log-count">
          {inField} lessons in {WEEKS} weeks
        </p>
        <div className="log-nav">
          <span className="log-no">
            {index + 1} / {lessons.length}
          </span>
          <button type="button" className="log-step" aria-label="Newer lesson" onClick={() => slide((going.current ?? index) - 1)} disabled={index === 0}>
            ←
          </button>
          <button
            type="button"
            className="log-step"
            aria-label="Older lesson"
            onClick={() => slide((going.current ?? index) + 1)}
            disabled={index === lessons.length - 1}
          >
            →
          </button>
        </div>
      </div>

      <section className="log-slider" aria-label="Lessons, newest first" tabIndex={0} onKeyDown={keys}>
        <ol ref={track} className="log-track">
          {lessons.map((l, i) => (
            <li key={`${l.iso}-${i}`} className={`log-card${i === index ? ' is-on' : ''}`}>
              <p className="log-meta">
                <time dateTime={l.iso}>{longDate(l.iso)}</time>
                <span className="log-tag">{categoryLabel(l.category)}</span>
                {l.tag !== categoryLabel(l.category) ? <span>{l.tag}</span> : null}
              </p>
              <h3 className="log-title">{l.title}</h3>
              <p className="log-why">{l.why}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="log-foot">
        <p className="log-note">{note}</p>
        <a className="log-all" href={allHref}>
          See all lessons →
        </a>
      </div>
      <p className="nt-sr" aria-live="polite">
        {lessons[index] ? `${longDate(lessons[index].iso)}: ${lessons[index].title}` : ''}
      </p>
    </div>
  );
}
