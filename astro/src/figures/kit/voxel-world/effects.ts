import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three';
import { hexOf } from '../ink';
import { COLD, cell, type World } from './types';
import { stream } from './seeds';

export function buildEffects(world: World, root: Group) {
  const surface = new Map(world.heights);
  for (const b of world.blocks) surface.set(cell(b.x, b.z), Math.max(surface.get(cell(b.x, b.z)) ?? -10, b.y));
  const rng = stream(world.spec.layoutSeed, 'particles');
  const particles: { mesh: Mesh; x: number; y: number; z: number; phase: number; kind: string }[] = [];
  const emitters = [...world.emitters];
  const crater = world.landmarks.find((l) => l.kind === 'lava crater');
  if (crater) emitters.push({ x: crater.x, y: crater.height + 1, z: crater.z, kind: 'fire' });
  const add = (x: number, y: number, z: number, kind: string, phase: number): void => {
    const weather = kind === 'snow' || kind === 'dust';
    const mesh = new Mesh(
      new BoxGeometry(weather ? 0.12 : 0.3, weather ? 0.12 : 0.3, weather ? 0.12 : 0.3),
      new MeshBasicMaterial({
        color: hexOf(
          kind === 'fire' ? 'worldHoney' : kind === 'magic' ? 'signal' : kind === 'dust' ? 'worldSand' : 'worldSnow',
        ),
        transparent: true,
        opacity: 0.45,
      }),
    );
    root.add(mesh);
    particles.push({ mesh, x, y, z, kind, phase });
  };
  for (const e of emitters) for (let i = 0; i < 4; i++) add(e.x, e.y, e.z, e.kind, i / 4);
  const cold = COLD.has(world.spec.biome),
    dust = ['desert', 'wasteland', 'caves'].includes(world.spec.biome);
  if (cold || dust || world.spec.biome === 'rainforest' || world.spec.biome === 'mushroom')
    for (let i = 0; i < 40; i++) {
      const x = (rng() - 0.5) * world.spec.radius * 1.7,
        z = (rng() - 0.5) * world.spec.radius * world.spec.stretch * 1.7;
      add(
        x,
        (world.heights.get(cell(Math.round(x), Math.round(z))) ?? 0) + 4,
        z,
        cold ? 'snow' : dust ? 'dust' : 'magic',
        rng(),
      );
    }
  function update(t: number, weather: boolean): void {
    for (const p of particles) {
      const phase = (t * 0.12 + p.phase) % 1,
        falling = p.kind === 'snow';
      const x = p.x + Math.sin(phase * 3 + p.phase * 7) * 0.6,
        z = p.z + phase * 0.5;
      const y = falling ? p.y + 8 - phase * 12 : p.y + phase * 4;
      p.mesh.visible =
        (!['snow', 'dust'].includes(p.kind) || weather) &&
        (!falling || y > (surface.get(cell(Math.round(x), Math.round(z))) ?? 0) + 1);
      p.mesh.position.set(x, y, z);
      p.mesh.scale.setScalar(0.6 + phase * (p.kind === 'smoke' ? 2.2 : 0.4));
      const mat = p.mesh.material;
      if (mat instanceof MeshBasicMaterial) mat.opacity = Math.sin(phase * Math.PI) * 0.45;
    }
  }
  return { particles, update };
}
