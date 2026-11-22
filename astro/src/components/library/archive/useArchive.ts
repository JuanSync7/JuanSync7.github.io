import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { readMetrics, shelfAt, turn, type Metrics } from './geometry';
import type { Phase, Picked } from './types';

/** A short beat between steps that only swap what is drawn (no travel to wait for). */
const BEAT = 40;

export interface Archive {
  pos: number;
  still: boolean;
  phase: Phase;
  picked: Picked | null;
  shelf: number;
  move: (d: number) => void;
  goTo: (shelf: number) => void;
  pick: (p: Picked) => void;
  close: () => void;
}

function reduced(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** The archive's state: which shelf faces you (a position over three copies of the shelves, so
 *  the carousel turns either way without end) and how far a picked binder has got. Every step's
 *  length comes from the stylesheet's tokens. Under reduced motion each change is one jump. */
export function useArchive(n: number, stage: RefObject<HTMLElement | null>): Archive {
  const [pos, setPos] = useState(n);
  const [still, setStill] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [picked, setPicked] = useState<Picked | null>(null);
  const timers = useRef<number[]>([]);
  const posRef = useRef(n);
  const phaseRef = useRef<Phase>('idle');
  phaseRef.current = phase;

  const clear = (): void => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clear, []);
  const later = (ms: number, fn: () => void): void => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const metrics = (): Metrics | null => (stage.current ? readMetrics(stage.current) : null);
  /** Runs steps one after another, each after the time the one before it takes. */
  const run = (steps: readonly (readonly [Phase, number])[], end?: () => void): void => {
    let at = 0;
    for (const [p, ms] of steps) {
      later(at, () => setPhase(p));
      at += ms;
    }
    if (end) later(at, end);
  };

  const settle = useCallback((): void => {
    const p = posRef.current;
    if (p >= n && p < 2 * n) return;
    posRef.current = p < n ? p + n : p - n;
    setStill(true);
    setPos(posRef.current);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => setStill(false)));
  }, [n]);

  const move = (d: number): void => {
    if (phaseRef.current !== 'idle' || d === 0) return;
    posRef.current += d;
    setStill(false);
    setPos(posRef.current);
    const m = metrics();
    if (reduced() || !m) settle();
    else later(m.dur.slide + BEAT, settle);
  };

  const pick = (p: Picked): void => {
    if (phaseRef.current !== 'idle') return;
    clear();
    setPicked(p);
    const m = metrics();
    if (reduced() || !m) {
      setPhase('show');
      return;
    }
    const { lift, fly, plop, open, sheet } = m.dur;
    run([
      ['lift', lift],
      ['fly', fly],
      ['land', plop],
      ['open', open],
      ['pull', BEAT],
      ['rise', sheet],
      ['show', 0],
    ]);
  };

  const close = (): void => {
    if (phaseRef.current !== 'show') return;
    clear();
    const m = metrics();
    const done = (): void => {
      setPhase('idle');
      setPicked(null);
    };
    if (reduced() || !m) {
      done();
      return;
    }
    const { fly, open, sheet } = m.dur;
    run(
      [
        ['unshow', sheet],
        ['sink', sheet],
        ['shut', open],
        ['return', BEAT],
        ['back', fly],
      ],
      done,
    );
  };

  const shelf = shelfAt(pos, n);
  return { pos, still, phase, picked, shelf, move, goTo: (to) => move(turn(shelf, to, n)), pick, close };
}
