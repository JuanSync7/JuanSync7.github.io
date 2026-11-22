import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import FigureCanvas from '../../ui/FigureCanvas';
import '../../ui/pixel-button.css';
import { PLATE } from './geometry';
import type { ArchivePiece, Phase } from './types';

interface Props {
  piece: ArchivePiece;
  shelf: string;
  phase: Phase;
  /** The archive's width in CSS px, the stage scale, and the design sizes it is placed by. */
  width: number;
  k: number;
  unit: number;
  band: number;
  sheetW: number;
  /** The picked binder's thickness: where its paper block starts. */
  thick: number;
  heading: RefObject<HTMLHeadingElement>;
  onHeight: (h: number) => void;
  onClose: () => void;
}

/** The paper pulled out of the binder: it starts edge on in the paper block, rises to hang over
 *  the binder turned to face you, then settles open at full size over the desk. It is drawn at
 *  the page's own size, never scaled with the stage, so its words stay readable on a phone. The
 *  left of it plays the piece's cover; the right says what it is and leads to it. */
export default function ArchiveSheet(p: Props) {
  const box = useRef<HTMLElement | null>(null);
  const { width: w, k } = p;
  const stacked = w < p.sheetW;
  const sw = Math.min(p.sheetW, w);
  const left = (w - sw) / 2;
  const deskTop = (p.unit + p.band) * k;
  const top = stacked ? deskTop : deskTop + PLATE.sheetTop * k;
  const px = w / 2 - (left + sw / 2);
  const py = (p.unit + p.band + PLATE.deskTop - p.thick + PLATE.board) * k - top;
  const s = (PLATE.sheetInBinder * k) / sw;
  const at: Partial<Record<Phase, string>> = {
    pull: `translate(${px}px, ${py}px) scale(${s}) rotateX(90deg)`,
    sink: `translate(${px}px, ${py}px) scale(${s}) rotateX(90deg)`,
    rise: `translate(${px}px, ${py - PLATE.sheetHover * k}px) scale(${s}) rotate(-3deg)`,
    unshow: `translate(${px}px, ${py - PLATE.sheetHover * k}px) scale(${s}) rotate(-3deg)`,
  };
  const style = { left, top, width: sw, transform: at[p.phase] ?? 'none' } as CSSProperties;
  const open = p.phase === 'show';
  // A figure sizes its canvas from its box on the screen, transforms included, so it is mounted
  // only once the paper has finished opening, never while it is small and turning.
  const [settled, setSettled] = useState(false);
  const played = settled && (open || p.phase === 'unshow' || p.phase === 'sink');
  useEffect(() => {
    const el = box.current;
    if (!open || !el) return undefined;
    if (!parseFloat(getComputedStyle(el).transitionDuration)) {
      setSettled(true);
      return undefined;
    }
    const done = (e: TransitionEvent): void => {
      if (e.target === el && e.propertyName === 'transform') setSettled(true);
    };
    el.addEventListener('transitionend', done);
    return () => el.removeEventListener('transitionend', done);
  }, [open]);
  const { onHeight } = p;

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => onHeight(el.offsetTop + el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [onHeight]);

  return (
    <article
      ref={box}
      className="lib-sheet"
      data-stacked={stacked || undefined}
      data-open={open || undefined}
      data-still={p.phase === 'pull' || undefined}
      style={style}
      aria-labelledby="lib-sheet-title"
      aria-hidden={open ? undefined : true}
    >
      <span className="ls-holes" aria-hidden="true" />
      <span className="ls-margin" aria-hidden="true" />
      <div className="ls-figure">{p.piece.cover && played ? <FigureCanvas id={p.piece.cover} /> : null}</div>
      <div className="ls-copy">
        <p className="ls-meta">
          <span>// {p.shelf}</span>
          <span>{p.piece.num}</span>
        </p>
        <h2 id="lib-sheet-title" ref={p.heading} tabIndex={-1}>
          {p.piece.title}
        </h2>
        <p className="ls-excerpt">{p.piece.excerpt}</p>
        <p className="ls-when">
          {p.piece.date} · {p.piece.read}
        </p>
        <div className="ls-actions">
          <a className="pixel-button" data-variant="signal" href={p.piece.href} tabIndex={open ? undefined : -1}>
            <span className="pb-edge" />
            <span className="pb-label">Read</span>
          </a>
          <button type="button" className="ls-back" onClick={p.onClose} tabIndex={open ? undefined : -1}>
            Back to the shelf
          </button>
        </div>
      </div>
    </article>
  );
}
