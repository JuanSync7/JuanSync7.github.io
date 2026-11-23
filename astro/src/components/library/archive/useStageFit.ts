import { useEffect, useState, type RefObject } from 'react';
import { readMetrics } from './geometry';

export interface Fit {
  /** The archive's width on the page, in CSS px. */
  width: number;
  /** How much the drawn stage is scaled: 1 until the page is narrower than the least view. */
  k: number;
}

/** Measures the archive's box and works out the stage scale: the plates keep their drawn size
 *  until the page is narrower than --pp-lib-view-min (one shelf and a little wall), then the
 *  whole stage scales down together, so a binder always matches its shelf. */
export function useStageFit(box: RefObject<HTMLElement | null>): Fit {
  const [fit, setFit] = useState<Fit>({ width: 0, k: 1 });
  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const measure = (): void => {
      const width = el.clientWidth;
      const min = readMetrics(el).viewMin;
      const k = min > 0 ? Math.min(1, width / min) : 1;
      setFit((f) => (f.width === width && f.k === k ? f : { width, k }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [box]);
  return fit;
}
