import { roomTone } from './ink';
import type { MaterialPattern } from './roompaint';
import { roomProject, type RoomView } from './roomview';
import type { TableSurface } from './tableparts';
import { poly } from './draw';

export function flatRoomTexture(
  ctx: CanvasRenderingContext2D,
  surface: TableSurface,
  view: RoomView,
  pattern: MaterialPattern,
): void {
  if (
    !['top', 'floor', 'floorAlt', 'rug'].includes(surface.finish ?? '') ||
    !['wood', 'stone', 'fabric'].includes(pattern)
  )
    return;
  const y = surface.points[0]?.[1];
  if (y === undefined || !surface.points.every((q) => Math.abs(q[1] - y) < 1e-6)) return;
  const xs = surface.points.map((q) => q[0]),
    zs = surface.points.map((q) => q[2]);
  const loX = Math.min(...xs),
    hiX = Math.max(...xs),
    loZ = Math.min(...zs),
    hiZ = Math.max(...zs);
  if ((hiX - loX) * (hiZ - loZ) < 0.3) return;
  ctx.save();
  poly(
    ctx,
    surface.points.map((q) => roomProject(view, q)),
    true,
  );
  ctx.clip();
  ctx.strokeStyle = roomTone(pattern === 'wood' ? 'walnut' : 'steel', 0.75);
  ctx.globalAlpha = pattern === 'stone' ? 0.12 : 0.15;
  const floor = surface.finish === 'floor' || surface.finish === 'floorAlt';
  const count = pattern === 'stone' ? 4 : 18;
  for (let i = 0; i < count; i++) {
    const z = loZ + ((i + 0.4) / count) * (hiZ - loZ);
    const points = Array.from({ length: 12 }, (_, j) => {
      const x = loX + ((hiX - loX) * j) / 11;
      return floor && pattern === 'wood'
        ? roomProject(view, [
            loX + ((i + 0.4) / count) * (hiX - loX) + Math.sin(j * 0.7 + i) * 0.02,
            y,
            loZ + ((hiZ - loZ) * j) / 11,
          ])
        : roomProject(view, [x, y, z + Math.sin(x * 0.7 + i) * ((hiZ - loZ) / count) * 0.15]);
    });
    poly(ctx, points, false);
    ctx.stroke();
  }
  ctx.restore();
}
