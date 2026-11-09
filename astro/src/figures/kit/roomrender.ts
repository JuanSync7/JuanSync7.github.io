import {
  BackSide,
  Color,
  type DirectionalLight,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  Raycaster,
  Vector2,
} from 'three';
import { hexOf } from './ink';
import { applyRoomMaterial } from './roommaterial';
import { setRoomLighting, type RoomLighting } from './roomlight';
import type { RoomAppearance } from './roomstyles';
import { roomShadows } from './roomshadows';
import { solidMesh } from './tablemesh';
import { sceneModels, type SceneModel } from './roomscene';
import { roomProject, roomVisible, type RoomView } from './roomview';
import { createRoomFocus, focusRoom, type RoomFocus } from './roomfocus';
import type { TableScene } from './tabletop';
import type { Pointer } from '../types';

interface Entity {
  source: SceneModel;
  group: Group;
  faces: { material: MeshStandardMaterial; base: Color }[];
  edges: { material: LineBasicMaterial; base: Color; opacity: number }[];
}
export interface RoomState {
  drawKey?: string;
  readout?: string;
  key?: DirectionalLight;
  lighting?: RoomLighting;
  appearance?: RoomAppearance;
  entities: Entity[];
  pickables: Mesh[];
  ray: Raycaster;
  at: Vector2;
  focus: RoomFocus;
}
const SIGNAL = new Color(hexOf('signal'));
export function buildRoom(p: TableScene): { group: Group; state: RoomState } {
  const group = new Group(),
    pickables: Mesh[] = [];
  const entities = sceneModels(p).map((source, i): Entity => {
    const model = solidMesh(source.model, source.kind, p.theme.id, p.paletteVariant);
    const faces: Entity['faces'] = [],
      edges: Entity['edges'] = [];
    model.traverse((o) => {
      if (o instanceof Mesh && o.material instanceof MeshStandardMaterial) {
        faces.push({ material: o.material, base: o.material.color.clone() });
        o.material.shadowSide = BackSide;
        roomShadows(o.material);
        o.receiveShadow = true;
        o.castShadow = !source.support && !source.transmitsLight;
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
  const focus = createRoomFocus(group);
  group.updateMatrixWorld(true);
  return { group, state: { entities, pickables, focus, ray: new Raycaster(), at: new Vector2() } };
}
export function applyRoomView(
  camera: PerspectiveCamera | OrthographicCamera,
  view: RoomView,
  w: number,
  h: number,
): void {
  if (camera instanceof OrthographicCamera) {
    camera.left = (-view.height * w) / h / 2;
    camera.right = -camera.left + view.offset[0];
    camera.left += view.offset[0];
    camera.top = view.height / 2 + view.offset[1];
    camera.bottom = -view.height / 2 + view.offset[1];
  } else {
    camera.fov = view.fov;
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
  if (state.appearance !== view.controls.appearance) {
    state.appearance = view.controls.appearance;
    if (state.lighting) setRoomLighting(state.lighting, state.appearance);
    for (const entity of state.entities)
      for (const face of entity.faces) face.base.copy(applyRoomMaterial(face.material, state.appearance === 'colour'));
  }
  for (const entity of state.entities) {
    const s = entity.source;
    const visible =
      !s.side || (s.cutaway ? !roomVisible(p, s.side, view, s.mount) : roomVisible(p, s.side, view, s.mount));
    if (entity.group.visible !== visible && state.key) state.key.shadow.needsUpdate = true;
    entity.group.visible = visible;
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
      if (active) material.color.lerp(SIGNAL, i === selected ? 1 : state.appearance === 'colour' ? 0.15 : 0.7);
    }
    for (const { material, base, opacity } of entity.edges) {
      material.color.copy(base);
      if (active) material.color.copy(SIGNAL);
      material.opacity = active ? 0.9 : opacity;
    }
  });
  const entity = state.entities[selected];
  focusRoom(state.focus, entity?.source.model, selected < p.items.length, view, camera);
  return entity?.source.label ?? 'rest';
}
