import {
  ACESFilmicToneMapping,
  DirectionalLight,
  HemisphereLight,
  PointLight,
  PCFSoftShadowMap,
  PMREMGenerator,
  type Texture,
  type WebGLRenderTarget,
  type Scene,
  type WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { hexOf, roomHexOf } from './ink';
import { roomPlan } from './roomplan';
import { ROOM_STYLES, type RoomAppearance } from './roomstyles';
import { LIGHT_MOODS } from './roomlightmoods';
import type { TableScene } from './tabletop';
import { roomPracticals, type PracticalLight } from './roompracticals';

export interface RoomLighting {
  key: DirectionalLight;
  bounce: DirectionalLight;
  sky: HemisphereLight;
  lamp?: PointLight;
  accent: PointLight;
  scene: Scene;
  renderer: WebGLRenderer;
  environment(): Texture;
  params: TableScene;
  practicals: PracticalLight[];
}
/** One shadow key, themed fill and a neutral prefiltered studio reflection environment. */
export function roomLighting(
  scene: Scene,
  renderer: WebGLRenderer,
  p: TableScene,
  onDispose: (dispose: () => void) => void,
): RoomLighting {
  const r = roomPlan(p),
    key = new DirectionalLight(hexOf('inkStrong'), 3.1);
  const mood = ROOM_STYLES[p.theme.id].mood;
  if (mood === 'bar') key.position.set(0, 2.22, 0);
  else if (mood === 'clean') key.position.set(0, r.top - 0.3, 0);
  else key.position.set(-r.half - 3, r.floor + 6.8, r.windowZ - 0.8);
  key.target.position.set(0, r.floor + 0.4, mood === 'bar' ? 0.2 : mood === 'clean' ? 2 : (r.back + r.front) / 2);
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
  const sky = new HemisphereLight(hexOf('inkStrong'), hexOf('ground'), 1.1);
  const accent = new PointLight(hexOf('inkStrong'), 0, 4, 2);
  accent.position.set(r.half - 0.45, 3.35, r.front - 3.6);
  let lamp: PointLight | undefined;
  if (!['lab', 'storage', 'kitchen', 'messy'].includes(p.theme.id)) {
    lamp = new PointLight(hexOf('inkStrong'), 2.2, 4, 2);
    lamp.position.set(-r.half + 0.65, r.floor + 2.94, r.lampZ);
    scene.add(lamp);
  }
  scene.add(key, key.target, bounce, sky, accent);
  // Seed thumbnails are monochrome. Generate reflections only when colour is
  // first selected, so eight offscreen previews never build unused cube maps.
  let reflection: WebGLRenderTarget | undefined;
  const environment = (): Texture => {
    if (!reflection) {
      const studio = new RoomEnvironment(),
        generator = new PMREMGenerator(renderer);
      reflection = generator.fromScene(studio, 0.04);
      studio.dispose();
      generator.dispose();
    }
    return reflection.texture;
  };
  onDispose(() => reflection?.dispose());
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  return {
    key,
    bounce,
    sky,
    lamp,
    accent,
    scene,
    renderer,
    environment,
    params: p,
    practicals: roomPracticals(scene, p),
  };
}
export function setRoomLighting(state: RoomLighting, appearance: RoomAppearance): void {
  const { key, bounce, sky, lamp, accent, scene, params } = state;
  const mood = LIGHT_MOODS[ROOM_STYLES[params.theme.id].mood];
  const colour = appearance === 'colour';
  key.color.set(colour ? roomHexOf(mood.key) : hexOf('inkStrong'));
  key.intensity = colour ? mood.keyPower : 3.1;
  bounce.color.set(colour ? roomHexOf(mood.bounce) : hexOf('inkStrong'));
  bounce.intensity = colour ? mood.bouncePower : 0.48;
  sky.color.set(colour ? roomHexOf(mood.sky) : hexOf('inkStrong'));
  sky.groundColor.set(colour ? roomHexOf(mood.ground) : hexOf('ground'));
  sky.intensity = colour ? mood.skyPower : 1.1;
  if (lamp) {
    lamp.color.set(colour ? roomHexOf(mood.lamp) : hexOf('inkStrong'));
    lamp.intensity = colour ? mood.lampPower : 2.2;
  }
  accent.color.set(roomHexOf(mood.lamp));
  accent.visible = colour;
  accent.intensity = colour ? mood.lampPower * 0.6 : 0;
  scene.environmentIntensity = colour ? mood.environment : 0;
  scene.environment = colour ? state.environment() : null;
  for (const practical of state.practicals) {
    practical.light.color.set(roomHexOf(practical.tone));
    practical.light.visible = colour;
    practical.light.intensity = colour ? practical.power : 0;
  }
}
