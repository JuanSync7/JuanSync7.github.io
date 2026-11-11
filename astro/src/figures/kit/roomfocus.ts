import {
  BufferGeometry,
  DoubleSide,
  Group,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Vector2,
  type Camera,
} from 'three';
import { hexOf } from './ink';
import { corners, type PropModel } from './tableparts';
import { roomProject, type RoomView } from './roomview';

export interface RoomFocus {
  marker: Mesh<PlaneGeometry, MeshBasicMaterial>;
  outline: LineLoop<BufferGeometry, LineBasicMaterial>;
  fill: Mesh<PlaneGeometry, MeshBasicMaterial>;
}
export function createRoomFocus(group: Group): RoomFocus {
  const marker = new Mesh(
    new PlaneGeometry(1, 1),
    new MeshBasicMaterial({
      color: hexOf('signal'),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      side: DoubleSide,
    }),
  );
  marker.rotation.x = -Math.PI / 2;
  const outline = new LineLoop(
    new BufferGeometry().setFromPoints([
      new Vector2(-0.5, -0.5),
      new Vector2(0.5, -0.5),
      new Vector2(0.5, 0.5),
      new Vector2(-0.5, 0.5),
    ]),
    new LineBasicMaterial({ color: hexOf('signal'), transparent: true, opacity: 0.95, depthTest: false }),
  );
  const fill = new Mesh(
    new PlaneGeometry(1, 1),
    new MeshBasicMaterial({
      color: hexOf('signal'),
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
    }),
  );
  marker.visible = outline.visible = fill.visible = false;
  fill.renderOrder = 99;
  outline.renderOrder = 100;
  group.add(marker, fill, outline);
  return { marker, outline, fill };
}
export function focusRoom(
  focus: RoomFocus,
  model: PropModel | undefined,
  tableItem: boolean,
  view: RoomView,
  camera: Camera,
): void {
  const { marker, outline, fill } = focus;
  marker.visible = Boolean(model && tableItem);
  outline.visible = fill.visible = Boolean(model);
  if (!model) return;
  const { lo, hi } = model.bounds;
  marker.position.set((lo[0] + hi[0]) / 2, 0.01, (lo[2] + hi[2]) / 2);
  marker.scale.set(Math.max(2.1, hi[0] - lo[0] + 0.32), Math.max(1.5, hi[2] - lo[2] + 0.32), 1);
  const centre: [number, number, number] = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
  const projected = corners(model.bounds).map((q) => roomProject(view, q));
  const xs = projected.map((q) => q[0]),
    ys = projected.map((q) => q[1]),
    at = roomProject(view, centre);
  const scale =
    view.projection.scale *
    (Number.isFinite(view.projection.dist) ? view.projection.dist / (view.projection.dist - at[2]) : 1);
  outline.position.set(...centre);
  outline.quaternion.copy(camera.quaternion);
  outline.scale.set(
    Math.max(64, Math.max(...xs) - Math.min(...xs) + 10) / scale,
    Math.max(40, Math.max(...ys) - Math.min(...ys) + 10) / scale,
    1,
  );
  fill.position.copy(outline.position);
  fill.quaternion.copy(outline.quaternion);
  fill.scale.copy(outline.scale);
}
