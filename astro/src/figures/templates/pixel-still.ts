import { defineTemplate } from '../defineTemplate';
import { defineThreeFigure } from '../defineThree';
import { solidMesh } from '../kit/tablemesh';
import { arrange, itemModel, TABLE_ASPECT, type TableItem, type TableScene } from '../kit/tabletop';
import { buildRoom, applyRoomView, updateRoom, type RoomState } from '../kit/roomrender';
import { roomView } from '../kit/roomview';
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
  build: ({ scene, renderer, params: p }) => {
    const { group, state } = buildRoom(p);
    state.key = roomLighting(scene, renderer, p);
    scene.add(group);
    scene.updateMatrixWorld(true);
    return state;
  },
  update: ({ selectCamera, params: p, state, w, h, pointer, data }) => {
    const view = roomView(p, w, h, data);
    const camera = selectCamera(view.controls.view === 'isometric' ? 'orthographic' : 'perspective');
    applyRoomView(camera, view, w, h);
    return updateRoom(p, state, view, camera, pointer, w, h);
  },
  fallback: ({ ctx, w, h, pointer, params: p, data, unseen }) =>
    unseen ? undefined : flatRoom(p, ctx, w, h, pointer, data),
});
