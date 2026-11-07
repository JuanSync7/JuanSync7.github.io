import { BoxGeometry, DynamicDrawUsage, Group, InstancedMesh, Matrix4, MeshBasicMaterial } from 'three';
import { hexOf } from '../ink';
import { COLD, cell, type World } from './types';
import { stream } from './seeds';

type Particle = { x: number; y: number; z: number; phase: number; kind: string; ambient: boolean };
/** One draw per particle family; wider worlds do not create a draw call per snowflake. */
export function buildEffects(world: World, root: Group) {
  const surface = new Map(world.heights);
  for (const b of world.blocks) surface.set(cell(b.x, b.z), Math.max(surface.get(cell(b.x, b.z)) ?? -10, b.y));
  const rng = stream(world.spec.layoutSeed, 'particles'),
    particles: Particle[] = [],
    emitters = [...world.emitters];
  const crater = world.landmarks.find((l) => l.kind === 'lava crater');
  if (crater) emitters.push({ x: crater.x, y: crater.height + 1, z: crater.z, kind: 'fire' });
  for (const e of emitters) for (let i = 0; i < 4; i++) particles.push({ ...e, phase: i / 4, ambient: false });
  const cold = COLD.has(world.spec.biome),
    dust = ['desert', 'wasteland', 'caves'].includes(world.spec.biome);
  if (cold || dust || ['rainforest', 'mushroom'].includes(world.spec.biome))
    for (let i = 0; i < 96; i++) {
      const x = (rng() - 0.5) * world.spec.radius * 1.7,
        z = (rng() - 0.5) * world.spec.radius * world.spec.stretch * 1.7;
      particles.push({
        x,
        z,
        y: (world.heights.get(cell(Math.round(x), Math.round(z))) ?? 0) + 4,
        kind: cold ? 'snow' : dust ? 'dust' : 'magic',
        phase: rng(),
        ambient: true,
      });
    }
  const families = [...new Set(particles.map((p) => p.kind))].map((kind) => {
    const members = particles.filter((p) => p.kind === kind),
      small = kind === 'snow' || kind === 'dust';
    const mesh = new InstancedMesh(
      new BoxGeometry(small ? 0.12 : 0.3, small ? 0.12 : 0.3, small ? 0.12 : 0.3),
      new MeshBasicMaterial({
        color: hexOf(
          kind === 'fire' ? 'worldHoney' : kind === 'magic' ? 'signal' : kind === 'dust' ? 'worldSand' : 'worldSnow',
        ),
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      }),
      members.length,
    );
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.name = `voxel-${kind}`;
    root.add(mesh);
    return { members, mesh };
  });
  const matrix = new Matrix4();
  let lastTime = NaN,
    lastWeather = true;
  function update(t: number, weather: boolean): void {
    if (t === lastTime && weather === lastWeather) return;
    lastTime = t;
    lastWeather = weather;
    for (const { members, mesh } of families) {
      members.forEach((p, i) => {
        const phase = (t * 0.12 + p.phase) % 1,
          falling = p.kind === 'snow',
          x = p.x + Math.sin(phase * 3 + p.phase * 7) * 0.6,
          z = p.z + phase * 0.5,
          y = falling ? p.y + 8 - phase * 12 : p.y + phase * 4;
        const visible =
          (!p.ambient || weather) && (!falling || y > (surface.get(cell(Math.round(x), Math.round(z))) ?? 0) + 1);
        const scale = visible ? Math.sin(phase * Math.PI) * (0.6 + phase * (p.kind === 'smoke' ? 2.2 : 0.4)) : 0;
        matrix.makeScale(scale, scale, scale);
        matrix.setPosition(x, y, z);
        mesh.setMatrixAt(i, matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
  }
  return { particles, families, update };
}
