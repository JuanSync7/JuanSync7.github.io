import policy from './policy.json';
import { BoxGeometry, Color, DynamicDrawUsage, Group, InstancedMesh, Matrix4, MeshBasicMaterial, Vector3 } from 'three';
import { buildMist } from './mist';
import type { Camera } from 'three';
import { mulberry32 } from '../rng';
import { hexOf } from '../ink';
import type { AtmosphereProfile } from './profile';
import type { AtmosphereWorld } from './types';

/** Seeded land samples plus the topmost solid field keep precipitation above trees and cave roofs. */
export function buildWeather(world: AtmosphereWorld, root: Group) {
  const surface = new Map(world.heights);
  for (const b of world.blocks) {
    const key = `${b.x},${b.z}`;
    surface.set(key, Math.max(surface.get(key) ?? -10, b.y));
  }
  const sites = [...world.heights.keys()],
    rng = mulberry32((world.spec.layoutSeed ?? 1) ^ 773231);
  const particles = Array.from({ length: policy.maxWeatherParticles }, () => {
    const [x = 0, z = 0] = (sites[Math.floor(rng() * sites.length)] ?? '0,0').split(',').map(Number);
    return { x, z, phase: rng(), drift: rng() - 0.5 };
  });
  const mist = buildMist(world, root, particles);
  const material = new MeshBasicMaterial({
    color: hexOf('worldSnow'),
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    fog: true,
  });
  const mesh = new InstancedMesh(new BoxGeometry(1, 1, 1), material, particles.length);
  mesh.name = 'voxel-weather';
  mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  root.add(mesh);
  const matrix = new Matrix4(),
    dimensions = new Vector3();
  const scale = Math.max(0.8, world.spec.radius / 32);
  let key = '';
  function update(t: number, profile: AtmosphereProfile, camera: Camera) {
    mist.update(t, profile.weather === 'mist', camera);
    mesh.visible = profile.particleCount > 0 && profile.weather !== 'mist';
    mesh.count = profile.particleCount;
    if (!mesh.visible || key === `${t}/${profile.weather}`) return;
    key = `${t}/${profile.weather}`;
    const rain = profile.weather === 'rain',
      snow = profile.weather === 'snow';
    material.color.copy(
      new Color(hexOf(rain ? 'worldIce' : snow ? 'worldSnow' : profile.weather === 'dust' ? 'worldSand' : 'inkSoft')),
    );
    material.opacity = rain ? 0.78 : snow ? 0.83 : 0.55;
    particles.forEach((p, i) => {
      const phase = (p.phase + t * (rain ? 0.72 : snow ? 0.12 : 0.17)) % 1;
      const x = p.x + (phase - 0.5) * profile.wind * 12,
        z = p.z + Math.sin(t * 0.25 + p.phase * 6) * 0.6;
      const ground = surface.get(`${Math.round(x)},${Math.round(z)}`) ?? world.heights.get(`${p.x},${p.z}`) ?? 0;
      const falling = rain || snow,
        height = falling ? 1.5 + (1 - phase) * 18 : 2 + phase * 10;
      const size = Math.sin(phase * Math.PI) * scale;
      matrix.makeRotationZ(rain ? Math.atan((profile.wind * 12) / 18) : p.drift);
      matrix.scale(
        dimensions.set(
          size * (rain ? 0.11 : snow ? 0.48 : 0.3),
          size * (rain ? 2.3 : snow ? 0.48 : 0.24),
          size * (rain ? 0.11 : snow ? 0.48 : 0.3),
        ),
      );
      matrix.setPosition(x, ground + height, z);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }
  return { mesh, mist, particles, surface, update };
}
