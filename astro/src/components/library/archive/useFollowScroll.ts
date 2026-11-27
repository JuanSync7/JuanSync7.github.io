import { useEffect, type RefObject } from 'react';
import type { Phase } from './types';

/** A CSS cubic-bezier() as a function of time, solved the way the browser solves it, so a step
 *  driven from script keeps time and shape with the transition beside it. */
export function bezier(css: string): (t: number) => number {
  const n = css.match(/-?[\d.]+/g)?.map(Number) ?? [];
  if (n.length !== 4) return (t) => t;
  const [x1, y1, x2, y2] = n;
  const at = (a: number, b: number, s: number): number => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  return (t) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (at(x1, x2, mid) < t) lo = mid;
      else hi = mid;
    }
    return at(y1, y2, (lo + hi) / 2);
  };
}

/** The page follows the binder in the air. A binder's flight down to the desk, or back up to its
 *  shelf, is longer than the screen, so the page scrolls with it: from where it is to the desk
 *  (or the wall) over the flight's own time and with its own vertical ease, so the binder stays
 *  on screen the whole way instead of leaving it and arriving from off screen. A wheel or touch
 *  from the reader stops the follow; under reduced motion the page jumps. */
export function useFollowScroll(
  phase: Phase,
  wall: RefObject<HTMLElement | null>,
  desk: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (phase !== 'fly' && phase !== 'back') return undefined;
    const to = phase === 'fly' ? desk.current : wall.current;
    const host = wall.current;
    if (!to || !host || !desk.current) return undefined;
    const margin = parseFloat(getComputedStyle(desk.current).scrollMarginTop) || 0;
    const from = window.scrollY;
    const end = Math.max(0, to.getBoundingClientRect().top + from - margin);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo({ top: end, behavior: 'instant' });
      return undefined;
    }
    const st = getComputedStyle(host);
    const ms = parseFloat(st.getPropertyValue('--pp-lib-dur-fly')) || 0;
    const ease = bezier(st.getPropertyValue(phase === 'fly' ? '--pp-lib-ease-y' : '--pp-lib-ease-y-back'));
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number): void => {
      const t = ms > 0 ? Math.min(1, (now - t0) / ms) : 1;
      window.scrollTo({ top: from + (end - from) * ease(t), behavior: 'instant' });
      if (t < 1) raf = window.requestAnimationFrame(step);
    };
    raf = window.requestAnimationFrame(step);
    const stop = (): void => window.cancelAnimationFrame(raf);
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    return () => {
      stop();
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchstart', stop);
    };
  }, [phase, wall, desk]);
}
