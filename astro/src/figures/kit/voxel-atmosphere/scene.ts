import policy from './policy.json';
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Mesh,
  PCFSoftShadowMap,
  Vector3,
  type Box3,
} from 'three';
import type { ThreeEnv } from '../../defineThree';
import type { Group } from 'three';
import { hexOf } from '../ink';
import { atmosphereProfile, type AtmosphereInput } from './profile';
import type { AtmosphereWorld } from './types';
import { buildWeather } from './weather';
import { buildPracticals, type practicalSources } from './practicals';

type Environment = Pick<ThreeEnv, 'scene' | 'camera'> & Partial<Pick<ThreeEnv, 'renderer'>>;
export function buildAtmosphere(
  env: Environment,
  world: AtmosphereWorld,
  root: Group,
  bounds: Box3,
  sources: ReturnType<typeof practicalSources>,
) {
  const { scene, camera, renderer } = env,
    radius = world.spec.radius,
    center = bounds.getCenter(new Vector3());
  const sun = new DirectionalLight(),
    sky = new HemisphereLight(),
    fill = new AmbientLight(hexOf('ink'));
  sun.name = 'voxel-key-light';
  sun.castShadow = true;
  sun.shadow.mapSize.set(policy.shadowMapSize, policy.shadowMapSize);
  sun.shadow.bias = -0.00025;
  sun.shadow.normalBias = 0.15;
  sun.shadow.camera.left = sun.shadow.camera.bottom = -radius * 1.65;
  sun.shadow.camera.right = sun.shadow.camera.top = radius * 1.65;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = radius * 8;
  sun.shadow.camera.updateProjectionMatrix();
  sun.target.position.copy(center);
  scene.add(sun, sun.target, sky, fill);
  if (renderer) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
  }
  const fog = new Fog(hexOf('ground'), 1, 1000);
  scene.fog = fog;
  const weather = buildWeather(world, root),
    practicals = buildPracticals(root, sources);
  const emissions: { value: number }[] = [];
  root.traverse((o) => {
    if (o instanceof Mesh) {
      for (const material of Array.isArray(o.material) ? o.material : [o.material])
        if (material.userData.voxelEmission) emissions.push(material.userData.voxelEmission);
    }
  });
  const trace: string[] = [];
  let previous = '',
    profile = atmosphereProfile(world.spec);
  function update(sunlight = 'seed', weatherKind = 'seed', enabled = true, t = 1.2) {
    const input: AtmosphereInput = { sunlight, weatherKind, weather: enabled };
    trace.length = 0;
    profile = atmosphereProfile(world.spec, input);
    trace.push('resolve');
    const key = `${profile.time}/${profile.weather}`;
    if (key !== previous) {
      previous = key;
      sun.color.set(hexOf(profile.night ? 'worldIce' : profile.time === 'noon' ? 'worldSnow' : 'worldHoney'));
      if (profile.overcast) sun.color.lerp(new Color(hexOf('worldIce')), 0.4);
      sun.intensity = profile.key;
      sky.color.set(hexOf(profile.night || profile.overcast ? 'worldIce' : 'worldSnow'));
      sky.groundColor.set(hexOf('worldEarth'));
      sky.intensity = profile.sky;
      fill.intensity = profile.fill;
      const angle = world.spec.sunAngle ?? (world.spec.layoutSeed ?? 1) * 0.001;
      sun.position.set(
        center.x + Math.cos(angle) * radius * 2,
        center.y + Math.sin(profile.elevation) * radius * 3,
        center.z + Math.sin(angle) * radius * 2,
      );
      fog.color
        .set(
          hexOf(
            profile.night
              ? 'ground'
              : profile.weather === 'dust'
                ? 'worldEarth'
                : profile.time === 'sunset' && !profile.overcast
                  ? 'worldWood'
                  : 'worldWater',
          ),
        )
        .lerp(new Color(hexOf('ground')), 0.72);
      for (const level of emissions) level.value = profile.emission;
      if (renderer) renderer.shadowMap.needsUpdate = true;
    }
    trace.push('light');
    const distance = camera.position.distanceTo(center);
    fog.near = Math.max(1, distance - radius * 0.5);
    fog.far = Math.max(fog.near + radius, distance + radius * profile.haze);
    trace.push('fog');
    weather.update(t, profile, camera);
    trace.push('weather');
    practicals.update(camera, profile.emission);
    trace.push('practicals');
    if (renderer)
      renderer.domElement.dataset.atmosphere = JSON.stringify({
        time: profile.time,
        weather: profile.weather,
        particles: profile.weather === 'mist' ? policy.mistInstances : weather.mesh.count,
        shadows: true,
        lamps: practicals.lamps.length,
      });
    trace.push('publish');
  }
  update();
  return {
    trace,
    sun,
    sky,
    fill,
    fog,
    weather,
    practicals,
    update,
    get profile() {
      return profile;
    },
  };
}
