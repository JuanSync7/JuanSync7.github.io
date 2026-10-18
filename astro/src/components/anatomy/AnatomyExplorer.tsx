import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import FigureCanvas from '../ui/FigureCanvas';
import type { AnatomyData } from '../../figures/chip-anatomy';
import type { AnatomyStep } from '../../data/anatomy';
import './anatomy.css';

interface Props {
  steps: readonly AnatomyStep[];
  /** The figure that takes the object apart; it reads `{ step, target }`. */
  figure: string;
}

/** How long each step holds on the idle tour. */
const TOUR_MS = 4200;

/** An object taken apart one part at a time: the figure on the left, the parts as a list
 *  on the right, a teal leader from the lit part to its name. Steps move with the buttons,
 *  the arrow and number keys, or a click on a name; while nobody is touching it, a tour
 *  walks the steps, and it stops for good under reduced motion. */
export default function AnatomyExplorer({ steps, figure }: Props) {
  const [step, setStep] = useState(0);
  const [held, setHeld] = useState(false);
  const [target, setTarget] = useState<[number, number] | undefined>(undefined);
  const stage = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const root = useRef<HTMLElement>(null);
  const last = steps.length - 1;
  const go = (n: number): void => setStep(Math.max(0, Math.min(last, n)));

  // Where the lit step's name is, as a fraction of the stage: the figure aims its leader there.
  useEffect(() => {
    const measure = (): void => {
      const s = stage.current?.getBoundingClientRect();
      const li = items.current[step]?.getBoundingClientRect();
      if (!s || !li || s.width === 0) return;
      setTarget([(li.left - s.left) / s.width, (li.top + Math.min(li.height, 28) / 2 - s.top) / s.height]);
    };
    measure();
    const watch = new ResizeObserver(measure);
    if (root.current) watch.observe(root.current);
    return () => watch.disconnect();
  }, [step]);

  // The idle tour: only while visible, untouched, and motion is welcome.
  useEffect(() => {
    if (held || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let visible = false;
    const seen = new IntersectionObserver(([e]) => {
      visible = e?.isIntersecting ?? false;
    });
    if (root.current) seen.observe(root.current);
    const timer = window.setInterval(() => {
      if (visible) setStep((s) => (s >= last ? 0 : s + 1));
    }, TOUR_MS);
    return () => {
      window.clearInterval(timer);
      seen.disconnect();
    };
  }, [held, last]);

  const keys = (e: KeyboardEvent<HTMLElement>): void => {
    const n = Number(e.key);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(step + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(step - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(last);
    else if (Number.isInteger(n) && e.key.length === 1) go(n);
    else return;
    e.preventDefault();
    setHeld(true);
  };
  const data: AnatomyData = { step, ...(target ? { target } : {}) };
  const current = steps[step];

  return (
    <section
      ref={root}
      className="anatomy"
      aria-label="Step through the parts"
      tabIndex={0}
      onKeyDown={keys}
      onPointerEnter={() => setHeld(true)}
      onFocus={() => setHeld(true)}
    >
      <div ref={stage} className="anatomy-stage">
        <FigureCanvas id={figure} data={data} />
      </div>
      <div className="anatomy-side">
        <ol className="anatomy-parts">
          {steps.map((s, i) => (
            <li
              key={s.name}
              ref={(el) => {
                items.current[i] = el;
              }}
              className={i === step ? 'is-on' : undefined}
            >
              <button type="button" onClick={() => {
                  go(i);
                  setHeld(true);
                }} aria-current={i === step ? 'step' : undefined}>
                <span className="anatomy-index">{String(i).padStart(2, '0')}</span>
                <span className="anatomy-name">{s.name}</span>
              </button>
              {i === step ? <p className="anatomy-body">{s.body}</p> : null}
            </li>
          ))}
        </ol>
        <div className="anatomy-controls">
          <button type="button" onClick={() => {
              go(step - 1);
              setHeld(true);
            }} disabled={step === 0}>
            ← back
          </button>
          <span className="anatomy-count">
            {step} / {last}
          </span>
          <button type="button" onClick={() => {
              go(step + 1);
              setHeld(true);
            }} disabled={step === last}>
            next →
          </button>
        </div>
        <p className="nt-sr" aria-live="polite">
          {current ? `${current.name}. ${current.body}` : ''}
        </p>
      </div>
    </section>
  );
}
