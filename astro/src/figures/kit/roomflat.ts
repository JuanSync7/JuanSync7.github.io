import { poly } from './draw';
import { ink, mix, roomTone } from './ink';
import { roomPaint } from './roompaint';
import { roomLightPlan } from './roomlightplan';
import { roomPlan } from './roomplan';
import { roomFaceLight } from './roomshade';
import { flatRoomTexture } from './roomflattexture';
import { tableFinish } from './tablefinish';
import { sceneModels } from './roomscene';
import { roomProject, roomView, roomVisible } from './roomview';
import { flatRoomSurfaces } from './roomflatorder';
import type { TableScene } from './tabletop';
import type { Vec3 } from './camera';
import type { Pointer } from '../types';

function inside(points: readonly Vec3[], x: number, y: number): boolean {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i],
      b = points[j];
    if (a && b && a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) hit = !hit;
  }
  return hit;
}
export function flatRoom(
  p: TableScene,
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pointer: Pointer,
  data?: unknown,
): string {
  const view = roomView(p, w, h, data),
    models = sceneModels(p);
  const clipped = flatRoomSurfaces(p, models, view),
    lighting = roomLightPlan(p),
    plan = roomPlan(p);
  const pick = (x: number, y: number): number => {
    const hit = clipped.findLast((s) => s.surface.face && inside(s.points, x, y));
    return hit && models[hit.index]?.interactive ? hit.index : -1;
  };
  let selected = pointer.active ? pick(pointer.x * w, pointer.y * h) : -1;
  if (pointer.active && selected < 0) {
    const candidates = models
      .flatMap((s, i) => {
        if (
          !s.interactive ||
          (s.side && !(s.cutaway ? !roomVisible(p, s.side, view, s.mount) : roomVisible(p, s.side, view, s.mount)))
        )
          return [];
        const { lo, hi } = s.model.bounds,
          q = roomProject(view, [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2]);
        return [{ i, q, distance: Math.hypot(q[0] - pointer.x * w, q[1] - pointer.y * h) }];
      })
      .filter((q) => q.distance < h * 0.28)
      .sort((a, b) => a.distance - b.distance);
    for (const c of candidates)
      if (pick(c.q[0], c.q[1]) === c.i) {
        selected = c.i;
        break;
      }
  }
  for (const { surface, index, points } of clipped) {
    const s = models[index];
    if (!s) continue;
    const active = index === (selected < 0 ? p.lit : selected),
      finish = tableFinish(s.kind, surface.solid, p.theme.id, surface.finish);
    poly(ctx, points, surface.face);
    if (surface.face) {
      const phase = Math.abs(
        Math.floor(
          (s.model.bounds.lo[0] + s.model.bounds.hi[0]) * 3 + (s.model.bounds.lo[2] + s.model.bounds.hi[2]) * 7,
        ),
      );
      const paint = roomPaint(s.kind, p.theme.id, surface.finish, surface.solid, phase, p.paletteVariant);
      const illumination = roomFaceLight(p, surface.points, lighting, plan);
      const coloured = view.controls.appearance === 'colour';
      ctx.fillStyle = active
        ? mix('signalLine', 'signal', illumination)
        : coloured
          ? roomTone(paint.tone, paint.strength * (0.3 + illumination * 0.8), lighting.mood.key)
          : mix('ground', finish.tone, illumination * Math.sqrt(finish.strength));
      ctx.fill();
      if (coloured && !active) {
        ctx.save();
        poly(ctx, points, true);
        ctx.clip();
        flatRoomTexture(ctx, surface, view, paint.pattern);
        ctx.restore();
      }
    } else {
      ctx.strokeStyle = active ? ink.signal(0.85) : ink.faint(s.kind === 'room' ? 0.25 : 0.5);
      ctx.stroke();
    }
  }
  const selectedModel = models[selected];
  if (selectedModel) {
    const { lo, hi } = selectedModel.model.bounds;
    const centre = roomProject(view, [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2]);
    const points = [lo[0], hi[0]].flatMap((x) =>
      [lo[1], hi[1]].flatMap((y) => [lo[2], hi[2]].map((z) => roomProject(view, [x, y, z]))),
    );
    const width = Math.max(64, Math.max(...points.map((q) => q[0])) - Math.min(...points.map((q) => q[0])) + 10);
    const height = Math.max(40, Math.max(...points.map((q) => q[1])) - Math.min(...points.map((q) => q[1])) + 10);
    ctx.fillStyle = ink.signal(0.12);
    ctx.fillRect(centre[0] - width / 2, centre[1] - height / 2, width, height);
    ctx.strokeStyle = ink.signal(0.95);
    ctx.strokeRect(centre[0] - width / 2, centre[1] - height / 2, width, height);
  }
  return models[selected]?.label ?? 'rest';
}
