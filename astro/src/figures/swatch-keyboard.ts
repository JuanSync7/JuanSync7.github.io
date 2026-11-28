import { AmbientLight, Color, DirectionalLight, Group, OrthographicCamera } from 'three';
import { defineThreeFigure } from './defineThree';
import { clear } from './kit/draw';
import { hexOf } from './kit/ink';
import { swatchKey, swatchOf, type Swatch } from './kit/swatch';
import { flatKeyboard } from './kit/swatchkeys';
import { adopt, model, ready, type KeyboardParts } from './kit/swatchmodel';

/** A Keychron Q1-style 75% mechanical keyboard on a desk mat, seen in true isometric: modelled
 *  in Blender (`scripts/palette/keyboard_blend.py`: wedge case, recessed plate, sculpted
 *  Cherry-profile caps, knob) and coloured 60/30/10 from the palette studio. The alpha keys and
 *  the mat take the ground (60), the case and modifiers the ink (30), Escape and Enter the accent
 *  (10), the arrows the second accent. It types: one key at a time dips, and the knob turns. */

export { ready };

/** How far each key is pressed at time t: three fingers type a fixed, made-up sentence of key
 *  indices, so every load types the same thing. */
function typing(t: number, count: number): Map<number, number> {
  const down = new Map<number, number>();
  for (let f = 0; f < 3; f++) {
    const beat = t * 3.2 + f / 3;
    const n = Math.floor(beat);
    const key = (n * 37 + f * 29 + (n % 7) * 11) % Math.max(1, count);
    down.set(key, Math.max(down.get(key) ?? 0, Math.sin((beat - n) * Math.PI)));
  }
  return down;
}

function paint(st: KeyboardParts, s: Swatch): void {
  for (const [m, key] of st.mats) m.color.set(s[key]);
  st.painted = swatchKey(s);
}

export default defineThreeFigure<KeyboardParts>({
  id: 'swatch-keyboard',
  title: 'Palette keyboard',
  alt: 'An isometric 3D model of a 75% mechanical keyboard in the style of a Keychron: an aluminium case with a typing angle, sculpted keycaps, light alpha keys, darker modifiers, Escape and Enter in the accent colour, the arrow keys in the second accent, and a knob at the top right, on a desk mat. One key at a time dips as it types.',
  idea: 'A real object spends its colour 60/30/10 too: most keys and the mat are the ground, the case and modifiers the ink, and only two keys the accent; the dipping key shows the keyboard in use.',
  motion: 'ambient',
  answers: false,
  group: 'feature',
  seed: 6033,
  aspect: 1.6,
  build: ({ scene }) => {
    const white = new Color(hexOf('inkStrong'));
    scene.add(new AmbientLight(white, 1.2));
    const key = new DirectionalLight(white, 2);
    key.position.set(-0.4, 1, 0.55);
    const fill = new DirectionalLight(white, 0.5);
    fill.position.set(1, 0.3, 0.2);
    scene.add(key, fill);
    const st: KeyboardParts = { keys: [], rest: [], knob: undefined, mats: [], painted: '' };
    if (!model) return st;
    const board = model.scene.clone(true);
    adopt(board, st);
    const root = new Group();
    root.add(board);
    scene.add(root);
    return st;
  },
  update: ({ state, t, data, selectCamera, w, h }) => {
    const s = swatchOf(data);
    if (swatchKey(s) !== state.painted) paint(state, s);
    const down = typing(t, state.keys.length);
    state.keys.forEach((k, i) => (k.position.y = (state.rest[i] ?? 0) - (down.get(i) ?? 0) * 0.0045));
    if (state.knob) state.knob.rotation.y = t * 0.6;
    const cam = selectCamera('orthographic');
    if (!(cam instanceof OrthographicCamera)) return 'rest';
    // True isometric (45 degrees round, 35.26 down) from the front right, the board filling
    // the frame whatever its shape.
    const k = w / h;
    const half = Math.max(0.19, 0.128 * k);
    Object.assign(cam, { left: -half, right: half, top: half / k, bottom: -half / k, near: 0.01, far: 10 });
    cam.position.set(1.2, 1.2, 1.2);
    cam.lookAt(0, 0.015, 0);
    cam.updateProjectionMatrix();
    return 'rest';
  },
  fallback: ({ ctx, w, h, data, t }) => {
    clear(ctx, w, h);
    flatKeyboard(ctx, w, h, swatchOf(data), [...typing(t, 84).keys()][0] ?? -1);
  },
});
