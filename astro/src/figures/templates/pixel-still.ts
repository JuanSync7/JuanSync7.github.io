import { defineTemplate } from '../defineTemplate';
import { defineThreeFigure } from '../defineThree';
import { solidMesh } from '../kit/tablemesh';
import { arrange, itemModel, TABLE_ASPECT, type TableItem, type TableScene } from '../kit/tabletop';
import { buildRoom, applyRoomView, updateRoom, type RoomState } from '../kit/roomrender';
import { roomControls, roomView } from '../kit/roomview';
import { roomLighting } from '../kit/roomlight';
import { flatRoom } from '../kit/roomflat';

export const object = (it: TableItem) => solidMesh(itemModel(it), it.kind, 'work');
export { arrange };

export default defineTemplate<TableScene, RoomState>({
  id: 'pixel-still',
  title: 'Tabletop rooms',
  idea: 'A seed chooses a furnished three-wall room and a matching table against its back wall; the camera explores a 180-degree arc, with cutaway walls revealing the interior.',
  style: 'three',
  renderer: defineThreeFigure,
  motion: 'responsive',
  answers: true,
  aspect: TABLE_ASPECT,
  grammar: (rng) => arrange(rng),
  name: (p) => `${p.theme.name} room · ${p.items.length} objects`,
  alt: (p) =>
    `A three-wall room themed as a ${p.theme.name.toLowerCase()}, with its detailed table flush against the back wall, matching floors, seating, room storage and wall fittings, and ${p.items.length} seeded tabletop objects.`,
  build: ({ scene, renderer, onDispose, params: p }) => {
    const { group, state } = buildRoom(p);
    state.lighting = roomLighting(scene, renderer, p, onDispose);
    state.key = state.lighting.key;
    scene.add(group);
    scene.updateMatrixWorld(true);
    return state;
  },
  update: ({ selectCamera, renderWhen, params: p, state, w, h, pointer, data, unseen }) => {
    // The room has no autonomous motion. Reuse its last frame until an actual
    // camera, appearance, pointer or size change; keep the shared figure clock.
    const controls = roomControls(data);
    const key = `${w}:${h}:${controls.angle}:${controls.view}:${controls.zoom}:${controls.appearance}:${pointer.active ? `${pointer.x}:${pointer.y}` : 'rest'}`;
    const changed = !unseen && state.drawKey !== key;
    renderWhen(changed);
    if (!changed) return state.readout ?? 'rest';
    state.drawKey = key;
    const view = roomView(p, w, h, data);
    const camera = selectCamera(view.controls.view === 'isometric' ? 'orthographic' : 'perspective');
    applyRoomView(camera, view, w, h);
    state.readout = updateRoom(p, state, view, camera, pointer, w, h);
    return state.readout;
  },
  fallback: ({ ctx, w, h, pointer, params: p, data, unseen }) =>
    unseen ? undefined : flatRoom(p, ctx, w, h, pointer, data),
});
