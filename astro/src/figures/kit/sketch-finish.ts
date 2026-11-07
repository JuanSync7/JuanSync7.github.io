import { outside, inside } from './sketch-clip';
import type { Sketch, Plan, Seg } from './sketch';

/** The finished plan: everything inside the window cut away, for the next plan to fill. */
export function finish(S: Sketch): Plan {
  const clip = (l: Seg[]): Seg[] => l.flatMap((s) => outside(s, S.win));
  const [x0, y0, x1, y1] = S.win;
  const detail = (l: Seg[]): Seg[] => l.flatMap((s) => inside(s, S.win));
  return {
    segs: [clip(S.segs[0]), clip(S.segs[1]), clip(S.segs[2])],
    dots: S.dots.filter(([x, y]) => x < x0 || x > x1 || y < y0 || y > y1),
    w: [...S.w],
    model: S.model,
    selectedKind: S.selectedKind,
    detail: S.keepDetail
      ? {
          segs: [detail(S.segs[0]), detail(S.segs[1]), detail(S.segs[2])],
          dots: S.dots.filter(([x, y]) => x >= x0 && x <= x1 && y >= y0 && y <= y1),
        }
      : undefined,
    interfaces: S.interfaceLinework.some((segs) => segs.length)
      ? {
          segs: [detail(S.interfaceLinework[0]), detail(S.interfaceLinework[1]), detail(S.interfaceLinework[2])],
          dots: [],
        }
      : undefined,
  };
}
