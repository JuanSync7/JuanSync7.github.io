import type { Box } from './dom';
import type { Measured, P } from './measure';

/** How tall a break band is on a broken template view, in CSS px. */
export const BREAK = 40;

/** A template drawn for its sheet. A live overlay on a frame one window tall passes `broken =
 *  false` and gets that window from the root's top. A sheet gets a broken view (ISO 128's
 *  interrupted view) that draws every part it numbers (R-BP-10): it keeps the first window and one
 *  half-window from the top of each part's box, and cuts the page between them to a band `BREAK`
 *  tall, listed in `breaks` for the sheet to draw as break lines. Sizes inside a cut are dropped. */
export function inWindow(m: Measured, broken = true): Measured {
  if (m.spec.kind === 'component') return m;
  const vh = m.view.height;
  const one = vh - Math.max(0, Math.min(m.top, vh / 2));
  const spans: [number, number][] = [[0, one]];
  if (broken) for (const b of Object.values(m.boxes)) spans.push([b.y, b.y + Math.min(b.h, vh / 2)]);
  spans.sort((p, q) => p[0] - q[0]);
  const keep: [number, number][] = [];
  for (const [s0, s1] of spans) {
    const last = keep[keep.length - 1];
    if (last && s0 <= last[1] + 2 * BREAK) last[1] = Math.max(last[1], s1);
    else keep.push([s0, s1]);
  }
  const ends: number[] = [];
  let at = 0;
  for (const [s0, s1] of keep) ends.push((at += s1 - s0 + BREAK));
  // Where a page height lands on the drawing, and whether it is drawn at all.
  const map = (y: number): { y: number; cut: boolean } => {
    for (const [k, [s0, s1]] of keep.entries()) {
      const top = (ends[k] ?? 0) - (s1 - s0) - BREAK;
      if (y < s0) return { y: top - BREAK / 2, cut: true };
      if (y <= s1) return { y: top + y - s0, cut: false };
    }
    return { y: at - BREAK, cut: true };
  };
  const boxes: Record<number, Box> = {};
  for (const [id, b] of Object.entries(m.boxes)) {
    const [y0, y1] = [map(b.y), map(b.y + b.h)];
    if (!y0.cut) boxes[Number(id)] = { ...b, y: y0.y, h: y1.y - y0.y };
  }
  const sizes = m.sizes
    .filter((x) => !map(x.a[1]).cut && (!x.b || !map(x.b[1]).cut))
    .map((x) => ({
      ...x,
      a: [x.a[0], map(x.a[1]).y] as P,
      b: x.b ? ([x.b[0], map(x.b[1]).y] as P) : null,
    }));
  return {
    ...m,
    boxes,
    sizes,
    breaks: ends.slice(0, -1).map((e) => e - BREAK),
  };
}
