import { useEffect, useState } from 'react';
import FigureCanvas from '../ui/FigureCanvas';
import type { FeaturedPage } from './types';
import './featured-book.css';

interface Props {
  pages: readonly FeaturedPage[];
}

type Dir = 'next' | 'prev';

const DWELL_MS = 8000;

/** The featured explainers as a book: each page turns away on its left hinge to show the
 *  next underneath, or turns back over it. It advances on its own every few seconds unless
 *  the reader is on it, or has asked for reduced motion. */
export default function FeaturedBook({ pages }: Props) {
  const [slide, setSlide] = useState(0);
  const [prev, setPrev] = useState(-1);
  const [dir, setDir] = useState<Dir>('next');
  const [held, setHeld] = useState(false);
  const [still, setStill] = useState(false);
  // An explicit stop, for readers who can't hover: touch, keyboard, screen reader.
  const [paused, setPaused] = useState(false);
  const n = pages.length;

  const go = (to: number, d: Dir): void => {
    const next = ((to % n) + n) % n;
    if (next === slide) return;
    setPrev(slide);
    setDir(d);
    setSlide(next);
  };

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = (): void => setStill(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (held || paused || still || n < 2) return undefined;
    const id = window.setTimeout(() => {
      setPrev(slide);
      setDir('next');
      setSlide((slide + 1) % n);
    }, DWELL_MS);
    return () => window.clearTimeout(id);
  }, [slide, held, paused, still, n]);

  const state = (i: number): string => {
    if (i === slide) return `page is-active dir-${dir}`;
    if (i === prev) return `page is-out dir-${dir}`;
    return 'page';
  };

  return (
    <div
      className={held || paused ? 'book is-held' : 'book'}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <div className="book-controls">
        {still ? null : (
          <button type="button" className="book-ctl book-pause" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
            {paused ? 'play' : 'pause'}
          </button>
        )}
        <button type="button" className="book-ctl" aria-label="Previous explainer" onClick={() => go(slide - 1, 'prev')}>
          ←
        </button>
        <span className="book-count" aria-live="polite">
          {slide + 1} / {n}
        </span>
        <button type="button" className="book-ctl" aria-label="Next explainer" onClick={() => go(slide + 1, 'next')}>
          →
        </button>
      </div>
      <div className="book-stage">
        {pages.map((p, i) => {
          const shown = i === slide || i === prev;
          return (
            <article key={p.slug} className={state(i)} aria-hidden={i !== slide} onAnimationEnd={(e) => e.target === e.currentTarget && i === prev && setPrev(-1)}>
              <div className="page-copy">
                <p className="page-meta st">
                  <span className="page-kind">{p.kind}</span>
                  <span>{p.date}</span>
                  <span>{p.read}</span>
                </p>
                <h3 className="st">
                  {p.title}
                </h3>
                <p className="page-blurb st">
                  {p.blurb}
                </p>
                <a className="page-cta st" href={p.href} tabIndex={i === slide ? 0 : -1}>
                  {p.cta} →
                </a>
              </div>
              <div className="page-art">
                <div className="page-figure">{shown ? <FigureCanvas id={p.figure} readout /> : null}</div>
                <p className="page-notes">
                  <span>{p.notes[0]}</span>
                  <span>{p.notes[1]}</span>
                </p>
              </div>
              <span className="page-bar" aria-hidden="true" />
              <span className="page-shade" aria-hidden="true" />
              <span className="page-gloss" aria-hidden="true" />
            </article>
          );
        })}
      </div>
    </div>
  );
}
