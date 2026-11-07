import { orderedRoomFaces } from './roomflatbsp';
import { roomClip } from './roomclip';
import { roomProject, roomVisible, type RoomView } from './roomview';
import type { SceneModel } from './roomscene';
import type { TableScene } from './tabletop';

export function flatRoomSurfaces(p: TableScene, models: SceneModel[], view: RoomView) {
  const visible = models.map(
    (s) => !s.side || (s.cutaway ? !roomVisible(p, s.side, view, s.mount) : roomVisible(p, s.side, view, s.mount)),
  );
  const surfaces = models.flatMap((s, index) => {
    if (!visible[index]) return [];
    const ordered = s.kind === 'room' && s.interactive;
    const faces = ordered
      ? orderedRoomFaces(s.model, view)
      : s.model.surfaces.map((surface) => ({ surface, points: surface.points }));
    const { lo, hi } = s.model.bounds;
    const modelDepth = roomProject(view, [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2])[2];
    return faces.map(({ surface, points }, rank) => ({
      surface,
      index,
      rank,
      ordered,
      modelDepth,
      points: roomClip(view, points, surface.face).map((v) => roomProject(view, v)),
      layer: s.support
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
                ? surface.points.every((q) => q[1] < -0.01)
                  ? -0.1
                  : surface.points.some((q) => q[1] > 0.025)
                    ? 0.1
                    : 0
                : 1,
    }));
  });
  const clipped = surfaces.filter((s) => {
    if (s.points.length < (s.surface.face ? 3 : 2)) return false;
    if (!s.surface.face) return true;
    // Outward normals give clockwise screen winding for a visible face. Omitting
    // back faces keeps a curved underside from painting over its own tabletop.
    const area = s.points.reduce((sum, a, i) => {
      const b = s.points[(i + 1) % s.points.length];
      return sum + (b ? a[0] * b[1] - b[0] * a[1] : 0);
    }, 0);
    return area < 0;
  });
  const depth = (a: (typeof clipped)[number]): number =>
    a.ordered ? a.modelDepth : a.points.reduce((n, q) => n + q[2] / a.points.length, 0);
  clipped.sort((a, b) => a.layer - b.layer || depth(a) - depth(b) || a.index - b.index || a.rank - b.rank);
  return clipped;
}
