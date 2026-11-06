import {
  Color,
  BufferGeometry,
  DoubleSide,
  Group,
  LineBasicMaterial,
  LineSegments,
  LineLoop,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Vector2,
} from 'three';
import { hexOf } from './ink';
import { solidMesh } from './tablemesh';
import { sceneModels, type SceneModel } from './roomscene';
import { roomProject, roomVisible, type RoomView } from './roomview';
import { corners } from './tableparts';
import type { TableScene } from './tabletop';
import type { Pointer } from '../types';

interface Entity {
  source: SceneModel;
  group: Group;
  faces: { material: MeshStandardMaterial; base: Color }[];
  edges: { material: LineBasicMaterial; base: Color; opacity: number }[];
}
export interface RoomState {
  entities: Entity[];
  pickables: Mesh[];
  ray: Raycaster;
  at: Vector2;
  marker: Mesh<PlaneGeometry, MeshBasicMaterial>;
  focus: LineLoop<BufferGeometry, LineBasicMaterial>;
}
const SIGNAL = new Color(hexOf('signal')),
  FOCUS = new Color(hexOf('inkStrong'));
export function buildRoom(p: TableScene): { group: Group; state: RoomState } {
  const group = new Group(),
    pickables: Mesh[] = [];
  const entities = sceneModels(p).map((source, i): Entity => {
    const model = solidMesh(source.model, source.kind, p.theme.id);
    const faces: Entity['faces'] = [],
      edges: Entity['edges'] = [];
    model.traverse((o) => {
      if (o instanceof Mesh && o.material instanceof MeshStandardMaterial) {
        faces.push({ material: o.material, base: o.material.color.clone() });
        o.userData.target = source.interactive ? i : -1;
        o.userData.entity = i;
        pickables.push(o);
      }
      if (o instanceof LineSegments && o.material instanceof LineBasicMaterial)
        edges.push({ material: o.material, base: o.material.color.clone(), opacity: o.material.opacity });
    });
    group.add(model);
    return { source, group: model, faces, edges };
  });
  const marker = new Mesh(
    new PlaneGeometry(1, 1),
    new MeshBasicMaterial({
      color: hexOf('signal'),
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      side: DoubleSide,
    }),
  );
  marker.rotation.x = -Math.PI / 2;
  marker.visible = false;
  const focus = new LineLoop(
    new BufferGeometry().setFromPoints([
      new Vector2(-0.5, -0.5),
      new Vector2(0.5, -0.5),
      new Vector2(0.5, 0.5),
      new Vector2(-0.5, 0.5),
    ]),
    new LineBasicMaterial({ color: hexOf('signal'), transparent: true, opacity: 0.95, depthTest: false }),
  );
  focus.visible = false;
  focus.renderOrder = 100;
  group.add(marker, focus);
  group.updateMatrixWorld(true);
  return { group, state: { entities, pickables, marker, focus, ray: new Raycaster(), at: new Vector2() } };
}
export function applyRoomView(
  camera: PerspectiveCamera | OrthographicCamera,
  view: RoomView,
  w: number,
  h: number,
): void {
  if (camera instanceof OrthographicCamera) {
    camera.left = (-view.height * w) / h / 2;
    camera.right = -camera.left;
    camera.top = view.height / 2;
    camera.bottom = -camera.top;
  } else {
    camera.fov = 30;
    camera.aspect = w / h;
  }
  camera.far = 120;
  camera.position.set(...view.position);
  camera.lookAt(...view.target);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}
export function updateRoom(
  p: TableScene,
  state: RoomState,
  view: RoomView,
  camera: PerspectiveCamera | OrthographicCamera,
  pointer: Pointer,
  w: number,
  h: number,
): string {
  for (const entity of state.entities) {
    const s = entity.source;
    entity.group.visible = !s.side || (s.cutaway ? !roomVisible(p, s.side, view) : roomVisible(p, s.side, view));
  }
  const pickables = state.pickables.filter((m) => state.entities[m.userData.entity]?.group.visible);
  const pick = (x: number, y: number): number => {
    state.at.set(x * 2 - 1, 1 - y * 2);
    state.ray.setFromCamera(state.at, camera);
    const hit = state.ray.intersectObjects(pickables, false)[0];
    return hit && typeof hit.object.userData.target === 'number' ? hit.object.userData.target : -1;
  };
  let selected = pointer.active ? pick(pointer.x, pointer.y) : -1;
  if (pointer.active && selected < 0) {
    const candidates = state.entities
      .flatMap((entity, i) => {
        if (!entity.source.interactive || !entity.group.visible) return [];
        const { lo, hi } = entity.source.model.bounds;
        const q = roomProject(view, [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2]);
        return [{ i, q, distance: Math.hypot(q[0] - pointer.x * w, q[1] - pointer.y * h) }];
      })
      .filter((q) => q.distance < h * 0.28)
      .sort((a, b) => a.distance - b.distance);
    for (const c of candidates)
      if (pick(c.q[0] / w, c.q[1] / h) === c.i) {
        selected = c.i;
        break;
      }
  }
  state.entities.forEach((entity, i) => {
    const active = i === (selected < 0 ? p.lit : selected);
    for (const { material, base } of entity.faces) {
      material.color.copy(base);
      if (active) material.color.lerp(i === selected ? FOCUS : SIGNAL, i === selected ? 0.95 : 0.7);
    }
    for (const { material, base, opacity } of entity.edges) {
      material.color.copy(base);
      if (active) material.color.copy(SIGNAL);
      material.opacity = active ? 0.9 : opacity;
    }
  });
  const entity = state.entities[selected];
  state.marker.visible = Boolean(entity && selected < p.items.length);
  state.focus.visible = Boolean(entity);
  if (entity) {
    const { lo, hi } = entity.source.model.bounds;
    state.marker.position.set((lo[0] + hi[0]) / 2, 0.01, (lo[2] + hi[2]) / 2);
    state.marker.scale.set(Math.max(1.4, hi[0] - lo[0] + 0.24), Math.max(1.1, hi[2] - lo[2] + 0.24), 1);
    const centre: [number, number, number] = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
    const projected = corners(entity.source.model.bounds).map((q) => roomProject(view, q));
    const xs = projected.map((q) => q[0]),
      ys = projected.map((q) => q[1]),
      at = roomProject(view, centre);
    const scale =
      view.projection.scale *
      (Number.isFinite(view.projection.dist) ? view.projection.dist / (view.projection.dist - at[2]) : 1);
    state.focus.position.set(...centre);
    state.focus.quaternion.copy(camera.quaternion);
    state.focus.scale.set(
      Math.max(48, Math.max(...xs) - Math.min(...xs) + 10) / scale,
      Math.max(32, Math.max(...ys) - Math.min(...ys) + 10) / scale,
      1,
    );
  }
  return entity?.source.label ?? 'rest';
}
