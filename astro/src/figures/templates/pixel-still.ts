import { defineTemplate } from '../defineTemplate';
import { defineThreeFigure } from '../defineThree';
import { solidMesh } from '../kit/tablemesh';
import { arrange, itemModel, TABLE_ASPECT, type TableItem, type TableScene } from '../kit/tabletop';
import { buildRoom, applyRoomView, updateRoom, type RoomState } from '../kit/roomrender';
import { roomControls, roomView } from '../kit/roomview';
import { roomLighting } from '../kit/roomlight';
import { flatRoom } from '../kit/roomflat';
import { ROOM_NAMES } from '../kit/roommetrics';

export const object = (it: TableItem) => solidMesh(itemModel(it), it.kind, 'work');
export { arrange };

export default defineTemplate<TableScene, RoomState>({
  id: 'pixel-still',
  title: 'Themed rooms',
  idea: 'A seed chooses a complete themed room with human-scale furniture, functional zones, coordinated architecture and lighting; an entrance camera and cutaway walls reveal the interior.',
  style: 'three',
  fullColour: true,
  renderer: defineThreeFigure,
  motion: 'responsive',
  answers: true,
  aspect: TABLE_ASPECT,
  grammar: (rng) => arrange(rng),
  name: (p) => `${ROOM_NAMES[p.theme.id]} · ${p.items.length} tabletop objects`,
  alt: (p) =>
    `A complete ${ROOM_NAMES[p.theme.id].toLowerCase()} built around a ${p.theme.name.toLowerCase()}, with proportionate furniture, functional seating and storage zones, coordinated wall finishes, windows, textiles, light fixtures and ${p.items.length} seeded tabletop objects.`,
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
