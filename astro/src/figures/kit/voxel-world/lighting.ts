import { AmbientLight, Color, DirectionalLight, HemisphereLight, Scene } from 'three';
import { hexOf } from '../ink';
import type { WorldSpec } from './types';

/** Neutral model-catalogue rig. Interactive scenes use voxel-atmosphere/scene. */
export function sunlight(scene: Scene, spec: WorldSpec) {
  const sun = new DirectionalLight(),
    sky = new HemisphereLight(hexOf('worldSnow'), hexOf('worldEarth'), 1.4);
  const fill = new AmbientLight(hexOf('ink'), 0.45);
  scene.add(sun, sky, fill);
  let previous = '';
  function update(override = 'seed'): void {
    if (previous === override) return;
    previous = override;
    const time = override === 'seed' ? spec.daylight : override;
    const noon = time === 'noon',
      elevation = noon ? 0.95 : 0.32;
    sun.color.copy(
      new Color(hexOf(noon ? 'worldSnow' : 'worldHoney')).lerp(new Color(hexOf('ink')), noon ? 0.2 : 0.48),
    );
    sun.intensity = noon ? 2.7 : 2.2;
    sun.position.set(Math.cos(spec.sunAngle) * 50, Math.sin(elevation) * 65, Math.sin(spec.sunAngle) * 50);
    sky.intensity = spec.biome === 'caves' ? 0.85 : noon ? 1.6 : 1.25;
  }
  update();
  return { update, sun, sky };
}
