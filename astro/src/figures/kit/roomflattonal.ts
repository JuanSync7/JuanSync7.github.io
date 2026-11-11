import type { Bounds, TableSurface } from './tableparts';
import { roomProject, type RoomView } from './roomview';

/** World-anchored Canvas approximation. GPU contact shadows remain a separate path. */
export function flatRoomTonal(
  ctx: CanvasRenderingContext2D,
  bounds: Bounds,
  surface: TableSurface,
  view: RoomView,
  colour: (gain: number) => string,
): string | CanvasGradient {
  const horizontal = surface.points.every((p) => Math.abs(p[1] - surface.points[0][1]) < 1e-6),
    axis = horizontal ? 2 : 1,
    center: [number, number, number] = [
      (bounds.lo[0] + bounds.hi[0]) / 2,
      (bounds.lo[1] + bounds.hi[1]) / 2,
      (bounds.lo[2] + bounds.hi[2]) / 2,
    ],
    low: [number, number, number] = [...center],
    high: [number, number, number] = [...center];
  low[axis] = bounds.lo[axis];
  high[axis] = bounds.hi[axis];
  const a = roomProject(view, low),
    b = roomProject(view, high);
  if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 1) return colour(1);
  const gradient = ctx.createLinearGradient(a[0], a[1], b[0], b[1]),
    amount = view.controls.appearance === 'colour' ? 0.45 : 1;
  gradient.addColorStop(0, colour(1 + ((horizontal ? 0.86 : 0.72) - 1) * amount));
  gradient.addColorStop(1, colour(1 + ((horizontal ? 1.08 : 1.12) - 1) * amount));
  return gradient;
}
