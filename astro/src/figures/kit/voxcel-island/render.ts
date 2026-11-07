import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshLambertMaterial,
  MeshBasicMaterial,
} from 'three';
import type { ThreeEnv, ThreeFrame } from '../../defineThree';
import { hexOf } from '../ink';
import { generateWorld } from './generate';
import { blockMesh } from './mesh';
import { buildIslandPose, updateIslandPose, type IslandPose } from './pose';
import { viewOf } from '../voxel-world/view';
import { boatClearance, shoreCell, swell } from './water';
import { cell, type Liquid, type World, type WorldSpec } from './types';

interface WaterCell {
  x: number;
  z: number;
  liquid: Liquid;
  edge: boolean;
}
export interface WorldView {
  world: World;
  pose: IslandPose;
  root: Group;
  water: InstancedMesh;
  waterCells: WaterCell[];
  foam: InstancedMesh;
  foamCells: WaterCell[];
  boats: Group[];
  surface: Map<string, number>;
  particles: { mesh: Mesh; x: number; y: number; z: number; phase: number; kind: string }[];
}

export function buildWorldView({ scene, camera }: ThreeEnv, spec: WorldSpec, seed: number): WorldView {
  const world = generateWorld(spec, seed),
    root = new Group();
  scene.add(root);
  scene.add(new AmbientLight(hexOf('ink'), 1.8));
  const sun = new DirectionalLight(hexOf('worldSnow'), 2.8);
  sun.position.set(-15, 40, 20);
  scene.add(sun);
  camera.far = 400;
  camera.fov = 30;
  root.add(blockMesh(world.blocks));
  const waterCells: WaterCell[] = [...world.liquids].map(([k, liquid]) => {
    const [x = 0, z = 0] = k.split(',').map(Number);
    return { x, z, liquid, edge: shoreCell(world, x, z) };
  });
  const water = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshLambertMaterial(), waterCells.length);
  const colour = new Color();
  waterCells.forEach(({ liquid, edge }, i) => {
    colour.set(hexOf(liquid.kind === 'lava' ? 'worldEmber' : liquid.kind === 'ice' ? 'worldIce' : 'worldWater'));
    if (edge && liquid.kind === 'water') colour.lerp(new Color(hexOf('worldIce')), 0.15);
    water.setColorAt(i, colour);
  });
  // Dynamic bounds include the entire water volume, not the initial identity matrices.
  water.frustumCulled = false;
  root.add(water);
  const foamCells = waterCells.filter(
    ({ x, z, liquid, edge }) =>
      liquid.kind !== 'ice' && boatClearance(world, x, z) && (edge || (x % 4 === 0 && z % 3 === 0)),
  );
  const foam = new InstancedMesh(
    new BoxGeometry(0.72, 0.06, 0.13),
    new MeshBasicMaterial({ color: hexOf('worldSnow'), transparent: true, opacity: 0.38 }),
    foamCells.length,
  );
  foam.frustumCulled = false;
  root.add(foam);
  const boats = world.boats.map((boat) => {
    const group = new Group();
    group.add(blockMesh(boat.blocks));
    root.add(group);
    return group;
  });
  const surface = new Map<string, number>();
  for (const b of world.blocks) surface.set(cell(b.x, b.z), Math.max(surface.get(cell(b.x, b.z)) ?? -10, b.y));
  const particles: WorldView['particles'] = [];
  const emitters = [...world.emitters];
  if (spec.biome === 'volcanic') {
    const crater = world.landmarks.find((l) => l.kind === 'lava crater');
    if (crater) emitters.push({ x: crater.x, y: crater.height + 1, z: crater.z, kind: 'fire' });
  }
  for (const emitter of emitters)
    for (let i = 0; i < 5; i++) {
      const particle = new Mesh(
        new BoxGeometry(0.4, 0.4, 0.4),
        new MeshBasicMaterial({
          color: hexOf(emitter.kind === 'smoke' ? 'inkMuted' : emitter.kind === 'fire' ? 'worldHoney' : 'signal'),
          transparent: true,
          opacity: 0.5,
        }),
      );
      root.add(particle);
      particles.push({ mesh: particle, x: emitter.x, y: emitter.y, z: emitter.z, phase: i / 5, kind: emitter.kind });
    }
  if (spec.biome === 'snow' || spec.biome === 'mushroom')
    for (let i = 0; i < 40; i++) {
      const x = Math.sin(i * 21.7 + seed) * spec.radius * 0.8,
        z = Math.sin(i * 13.9 + seed) * spec.radius * 0.8;
      const particle = new Mesh(
        new BoxGeometry(0.13, 0.13, 0.13),
        new MeshBasicMaterial({
          color: hexOf(spec.biome === 'snow' ? 'worldSnow' : 'signal'),
          transparent: true,
          opacity: 0.6,
        }),
      );
      root.add(particle);
      particles.push({
        mesh: particle,
        x,
        y: (surface.get(cell(Math.round(x), Math.round(z))) ?? 3) + 5,
        z,
        phase: i / 40,
        kind: spec.biome === 'snow' ? 'snow' : 'spore',
      });
    }
  return { world, pose: buildIslandPose(world), root, water, waterCells, foam, foamCells, boats, surface, particles };
}

const matrix = new Matrix4();
export function updateWorldView({
  state,
  camera,
  w,
  h,
  t,
  pointer,
  hover,
  data,
  unseen,
  still,
  dt,
}: ThreeFrame<WorldView>): string {
  const { world, water, waterCells, foam, foamCells, boats, particles, surface } = state;
  if (unseen) return `${world.spec.biome} · ${world.props.length} objects · ${world.boats.length} boats`;
  const view = viewOf(data),
    weather = view.weather;
  updateIslandPose(camera, state.pose, world, { w, h, t, pointer, hover, data, still, dt, pulses: [] });
  waterCells.forEach(({ x, z, liquid, edge }, i) => {
    const dy = liquid.kind === 'ice' ? 0 : swell(x, z, t) * (edge ? 0.3 : 1);
    const height = liquid.level - liquid.bottom + 1 + dy;
    matrix.makeScale(1, height, 1);
    matrix.setPosition(x, liquid.bottom - 0.5 + height / 2, z);
    water.setMatrixAt(i, matrix);
  });
  water.instanceMatrix.needsUpdate = true;
  foamCells.forEach(({ x, z, liquid, edge }, i) => {
    const dy = swell(x, z, t) * (edge ? 0.3 : 1);
    matrix.makeScale(0.65 + Math.sin(t * 1.4 + x * 0.28 + z * 0.19) * 0.3, 1, edge ? 1.5 : 1);
    matrix.setPosition(x, liquid.level + 0.56 + dy, z);
    foam.setMatrixAt(i, matrix);
  });
  foam.instanceMatrix.needsUpdate = true;
  boats.forEach((boat, i) => {
    const anchor = world.boats[i];
    if (!anchor) return;
    boat.position.set(anchor.x, anchor.y + swell(anchor.x, anchor.z, t), anchor.z);
    boat.rotation.z = Math.sin(t * 1.4 + anchor.x * 0.28) * 0.018;
    boat.rotation.x = Math.sin(t * 1.1 + anchor.z * 0.19) * 0.012;
  });
  particles.forEach((p) => {
    p.mesh.visible = weather || (p.kind !== 'snow' && p.kind !== 'spore');
    const phase = (t * (p.kind === 'snow' ? 0.09 : 0.18) + p.phase) % 1;
    const falling = p.kind === 'snow';
    const y = falling ? 30 - phase * 32 : p.y + phase * (p.kind === 'spore' ? 5 : 4);
    const x = p.x + Math.sin(phase * 3 + p.phase * 7) * 0.6,
      z = p.z + phase * 0.5;
    p.mesh.visible &&= !falling || y > (surface.get(cell(Math.round(x), Math.round(z))) ?? 0) + 1;
    p.mesh.position.set(x, y, z);
    p.mesh.scale.setScalar(0.6 + phase * (p.kind === 'smoke' ? 2.4 : 0.4));
    const mat = p.mesh.material;
    if (mat instanceof MeshBasicMaterial) mat.opacity = Math.sin(phase * Math.PI) * 0.5;
  });
  return `${world.spec.biome} · ${world.props.length} objects · ${world.boats.length} boats`;
}
