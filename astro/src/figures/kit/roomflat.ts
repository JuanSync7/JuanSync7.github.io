import { roomClip } from './roomclip';
import { poly } from './draw';
import { ink, mix } from './ink';
import { tableFinish } from './tablefinish';
import { sceneModels } from './roomscene';
import { roomProject, roomView, roomVisible } from './roomview';
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
function shade(points: Vec3[]): number {
  const a = points[0],
    b = points[1],
    c = points[2];
  if (!a || !b || !c) return 0.6;
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
    v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const nx = (u[1] ?? 0) * (v[2] ?? 0) - (u[2] ?? 0) * (v[1] ?? 0),
    ny = (u[2] ?? 0) * (v[0] ?? 0) - (u[0] ?? 0) * (v[2] ?? 0),
    nz = (u[0] ?? 0) * (v[1] ?? 0) - (u[1] ?? 0) * (v[0] ?? 0);
  return 0.45 + 0.5 * Math.abs((nx * 0.3 + ny * 0.85 + nz * 0.4) / (Math.hypot(nx, ny, nz) || 1));
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
  const visible = models.map(
    (s) => !s.side || (s.cutaway ? !roomVisible(p, s.side, view, s.mount) : roomVisible(p, s.side, view, s.mount)),
  );
  const surfaces = models.flatMap((s, index) =>
    visible[index]
      ? s.model.surfaces.map((surface) => ({
          surface,
          index,
          points: roomClip(view, surface.points, surface.face).map((v) => roomProject(view, v)),
          layer:
            s.label === 'Woven area rug'
              ? -3.5
              : s.mount === 'floor'
                ? 2
                : s.side === 'floor'
                  ? -4 + surface.solid * 0.00001
                  : s.kind === 'room'
                    ? s.interactive
                      ? -1
                      : -3 + surface.solid * 0.00001
                    : s.kind === 'table'
                      ? 0
                      : 1,
        }))
      : [],
  );
  const clipped = surfaces.filter((s) => s.points.length >= (s.surface.face ? 3 : 2));
  clipped.sort(
    (a, b) =>
      a.layer - b.layer ||
      a.points.reduce((n, q) => n + q[2] / a.points.length, 0) -
        b.points.reduce((n, q) => n + q[2] / b.points.length, 0),
  );
  const pick = (x: number, y: number): number => {
    const hit = clipped.findLast((s) => s.surface.face && inside(s.points, x, y));
    return hit && models[hit.index]?.interactive ? hit.index : -1;
  };
  let selected = pointer.active ? pick(pointer.x * w, pointer.y * h) : -1;
  if (pointer.active && selected < 0) {
    const candidates = models
      .flatMap((s, i) => {
        if (!s.interactive || !visible[i]) return [];
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
      ctx.fillStyle = active
        ? mix('signalLine', 'signal', shade(surface.points))
        : mix('ground', finish.tone, shade(surface.points) * Math.sqrt(finish.strength));
      ctx.fill();
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
