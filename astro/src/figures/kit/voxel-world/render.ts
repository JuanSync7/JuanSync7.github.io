import { viewOf } from './view';
import { Group } from 'three';
import type { ThreeEnv, ThreeFrame } from '../../defineThree';
import { generateWorld } from './generate';
import { blockMesh } from './mesh';
import { buildWater } from './water-view';
import { buildEffects } from './effects';
import { sunlight } from './lighting';
import { frameWorld, worldBounds } from './camera';
import { BUILDINGS, TREES, type WorldSpec } from './types';

export function buildWorldView({ scene, camera }: ThreeEnv, spec: WorldSpec, seed = spec.layoutSeed) {
  const world = generateWorld(spec, seed),
    root = new Group();
  scene.add(root);
  const solid = blockMesh(world.blocks, world);
  root.add(solid);
  const waterView = buildWater(world, root),
    effects = buildEffects(world, root),
    light = sunlight(scene, spec);
  const bounds = worldBounds(world);
  camera.far = 1000;
  camera.near = 0.5;
  camera.fov = 32;
  const buildings = world.props.filter((p) => BUILDINGS.has(p.kind)).length,
    trees = world.props.filter((p) => TREES.has(p.kind)).length;
  const readout = `${spec.biome} · ${spec.landform} · ${buildings} shelters · ${trees} trees · ${world.boats.length} boats`;
  return { world, root, solid, bounds, waterView, effects, light, readout, poseKey: '' };
}
export type WorldView = ReturnType<typeof buildWorldView>;
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
}: ThreeFrame<WorldView>): string {
  if (unseen) return state.readout;
  const view = viewOf(data),
    spec = state.world.spec;
  const yaw = Math.PI / 4 + spec.turn + view.turn + (view.orbit ? t * 0.045 : 0) + (pointer.x - 0.5) * hover * 0.08;
  const poseKey = `${yaw},${view.pitch},${view.zoom},${w / h}`;
  if (poseKey !== state.poseKey) {
    frameWorld(
      camera,
      state.bounds,
      yaw,
      Math.max(0.28, Math.min(1.2, view.pitch + spec.cameraPitch - 0.67)),
      view.zoom,
      w / h,
    );
    state.poseKey = poseKey;
  }
  state.light.update(view.sunlight);
  state.waterView.update(t);
  state.effects.update(t, view.weather);
  return state.readout;
}
