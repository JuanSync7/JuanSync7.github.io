import type { SlideStroke, SlideDrawing } from './types';

export type Point = readonly [number, number];
export const stroke = (d: string, role: SlideStroke['role'] = 'line'): SlideStroke => ({ d, role });
export const signal = (d: string): SlideStroke => stroke(d, 'signal');
export const quiet = (d: string): SlideStroke => stroke(d, 'quiet');
export function line(points: readonly Point[], role: SlideStroke['role'] = 'line', closed = false): SlideStroke {
  return stroke(points.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join('') + (closed ? 'Z' : ''), role);
}
export function ellipse(x: number, y: number, rx: number, ry: number, role: SlideStroke['role'] = 'line'): SlideStroke {
  return stroke(`M${x - rx},${y}a${rx},${ry} 0 1 0 ${2 * rx},0a${rx},${ry} 0 1 0 ${-2 * rx},0`, role);
}
/** Visible edges only: an icon keeps the silhouette, rather than rear construction lines. */
export function box(x: number, y: number, w: number, d: number, h: number): SlideDrawing {
  const a: Point = [x, y],
    b: Point = [x + w, y + w / 2];
  const c: Point = [x + w - d, y + (w + d) / 2],
    e: Point = [x - d, y + d / 2];
  return [
    line([a, b, c, e], 'line', true),
    quiet(`M${b[0]},${b[1]}v${h}l${-d},${d / 2}l${-w},${-w / 2}v${-h}M${c[0]},${c[1]}v${h}`),
  ];
}
