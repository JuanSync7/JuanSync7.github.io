import {
  AmbientLight,
  CanvasTexture,
  Color,
  DirectionalLight,
  Mesh,
  MeshBasicMaterial,
  PCFSoftShadowMap,
  PlaneGeometry,
  PMREMGenerator,
  ShadowMaterial,
  SRGBColorSpace,
  InstancedMesh,
  MeshStandardMaterial,
  type BufferGeometry,
  type Group,
  type Material,
  type Object3D,
  type Scene,
  type WebGLRenderer,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { hexOf, pageSignal } from './ink';

/** A small photo studio for a realistic scene: a neutral room environment for reflections, a soft
 *  key light with one shadow map, a fill, and an invisible floor that only takes shadow, so the
 *  scene stands on the page's own ground. */
export function studio(
  scene: Scene,
  renderer: WebGLRenderer,
  owned: { dispose(): void }[],
  aim: [number, number, number],
): void {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  // Nothing that casts a shadow moves (a key's 2 mm dip does not count): draw the map once.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const pmrem = new PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environment = env;
  owned.push(env);
  const white = new Color(hexOf('inkStrong'));
  scene.add(new AmbientLight(white, 0.25));
  const sun = new DirectionalLight(white, 1.15);
  sun.position.set(aim[0] - 2.3, 3.4, aim[2] + 2.6);
  sun.target.position.set(...aim);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -2.6, right: 2.6, top: 2.6, bottom: -2.6, near: 0.5, far: 8 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  const geo = new PlaneGeometry(8, 8);
  const mat = new ShadowMaterial({ opacity: 0.22 });
  const floor = new Mesh(geo, mat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  owned.push(geo, mat);
}

export interface Screen {
  tex: CanvasTexture;
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
}

/** Gives a screen plane a canvas to draw on, shown unlit at its true colours. */
export function screenOn(mesh: Mesh, w: number, h: number, owned: { dispose(): void }[]): Screen {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('screen: no 2D context');
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new MeshBasicMaterial({ map: tex, toneMapped: false });
  mesh.material = mat;
  owned.push(tex, mat);
  return { tex, ctx, w, h };
}

/** The page's signal as shown around the renderer's canvas now. */
export const signalNear = (renderer: WebGLRenderer): string => pageSignal(renderer.domElement);

/** Merges every static mesh under `root` into one mesh per material (world transforms baked in),
 *  so a scene of a few hundred parts draws in a few dozen calls. Instanced meshes, screens and
 *  anything marked `userData.live` (or inside something marked) stay as they are. */
export function mergeStatic(root: Group, owned: { dispose(): void }[]): void {
  root.updateMatrixWorld(true);
  const groups = new Map<Material, BufferGeometry[]>();
  const drop: Mesh[] = [];
  root.traverse((o) => {
    if (!(o instanceof Mesh) || o instanceof InstancedMesh) return;
    for (let p: Object3D | null = o; p; p = p.parent) if (p.userData.live) return;
    const mat = o.material;
    if (Array.isArray(mat) || (mat instanceof MeshBasicMaterial && mat.map)) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
    groups.set(mat, [...(groups.get(mat) ?? []), g]);
    drop.push(o);
  });
  drop.forEach((m) => m.removeFromParent());
  groups.forEach((list, mat) => {
    const merged = mergeGeometries(list);
    list.forEach((g) => g.dispose());
    if (!merged) return;
    owned.push(merged);
    const mesh = new Mesh(merged, mat);
    const transparent = mat instanceof MeshStandardMaterial && mat.transparent;
    mesh.castShadow = !transparent;
    mesh.receiveShadow = true;
    root.add(mesh);
  });
}
