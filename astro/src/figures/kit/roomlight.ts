import {
  ACESFilmicToneMapping,
  DirectionalLight,
  HemisphereLight,
  PointLight,
  PCFSoftShadowMap,
  type Scene,
  type WebGLRenderer,
} from 'three';
import { hexOf } from './ink';
import { roomPlan } from './roomplan';
import type { TableScene } from './tabletop';

/** Three.js's single-key shadow-map pattern; static maps are invalidated only by a cutaway.
 * https://threejs.org/manual/pages/shadows.html
 * Staging reference: https://github.com/pmndrs/drei-vanilla (MIT).
 */
export function roomLighting(scene: Scene, renderer: WebGLRenderer, p: TableScene): DirectionalLight {
  const r = roomPlan(p),
    key = new DirectionalLight(hexOf('inkStrong'), 3.1);
  key.position.set(-r.half + 0.7, 7, 4);
  key.target.position.set(0, r.floor, -0.3);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -10, right: 10, top: 9, bottom: -9, near: 0.5, far: 30 });
  key.shadow.intensity = 0.72;
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.025;
  key.shadow.autoUpdate = false;
  key.shadow.needsUpdate = true;
  const bounce = new DirectionalLight(hexOf('inkStrong'), 0.48);
  bounce.position.set(4, 2, 8);
  scene.add(key, key.target, bounce, new HemisphereLight(hexOf('inkStrong'), hexOf('ground'), 1.1));
  if (!['lab', 'storage', 'kitchen'].includes(p.theme.id)) {
    const lamp = new PointLight(hexOf('inkStrong'), 2.2, 4, 2);
    lamp.position.set(-r.half + 1.1, r.floor + 2.9, r.front - 1.8);
    scene.add(lamp);
  }
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  return key;
}
