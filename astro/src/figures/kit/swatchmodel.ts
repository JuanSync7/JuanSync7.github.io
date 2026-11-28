import { Mesh, MeshStandardMaterial, type Object3D } from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { SwatchKey } from './swatch';

/** The `swatch-keyboard` model: a Keychron Q1-style 75% board made in Blender by
 *  `scripts/palette/keyboard_blend.py` and served from public/models. Its materials are named for
 *  palette roles; `adopt` gives each instance its own materials, keyed to the swatch token they
 *  take, and finds the keys and the knob that move. */

const MODEL = '/models/swatch-keyboard.glb';

/** The model, fetched once before the figure mounts (see `ready` in registry.ts). */
export let model: GLTF | undefined;
export const ready: Promise<unknown> =
  typeof window === 'undefined'
    ? Promise.resolve()
    : new GLTFLoader()
        .loadAsync(MODEL)
        .then((g) => (model = g))
        .catch(() => undefined);

/** Which palette token each of the model's materials takes. */
export const ROLE: Record<string, SwatchKey> = {
  case: 'ink',
  plate: 'ink-strong',
  alpha: 'ground-raised',
  mod: 'ink-muted',
  accent2: 'accent2',
  accent: 'accent',
  knob: 'ink-faint',
  mat: 'ground-sunk',
};
const METAL = new Set(['case', 'knob']);

export interface KeyboardParts {
  keys: Object3D[];
  rest: number[];
  knob: Object3D | undefined;
  mats: [MeshStandardMaterial, SwatchKey][];
  painted: string;
}

export function adopt(board: Object3D, st: KeyboardParts): void {
  const owned = new Map<string, MeshStandardMaterial>();
  board.traverse((o) => {
    if (o.name.startsWith('key_')) {
      st.keys.push(o);
      st.rest.push(o.position.y);
    }
    if (o.name.startsWith('knob')) st.knob = o;
    if (!(o instanceof Mesh) || !(o.material instanceof MeshStandardMaterial)) return;
    const from = o.material.name;
    const name = Object.keys(ROLE).find((r) => from.startsWith(r)) ?? 'case';
    const metal = METAL.has(name);
    const mine =
      owned.get(name) ?? new MeshStandardMaterial({ roughness: metal ? 0.38 : 0.72, metalness: metal ? 0.2 : 0 });
    owned.set(name, mine);
    o.material = mine;
  });
  st.mats = [...owned].map(([name, m]): [MeshStandardMaterial, SwatchKey] => [m, ROLE[name] ?? 'ink']);
}
