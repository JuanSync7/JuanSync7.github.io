import policy from './policy.json';
import {
  DynamicDrawUsage,
  Group,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  PlaneGeometry,
  Vector3,
  type Camera,
} from 'three';
import { hexOf } from '../ink';
import type { AtmosphereWorld } from './types';

/** Low, soft, depth-tested wisps; fog never becomes a screen-wide opaque wash. */
export function buildMist(world: AtmosphereWorld, root: Group, sites: { x: number; z: number; phase: number }[]) {
  const material = new MeshBasicMaterial({
    color: hexOf('worldSnow'),
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader =
      'varying vec2 vMistUv;\n' +
      shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvMistUv=uv;');
    shader.fragmentShader =
      'varying vec2 vMistUv;\n' +
      shader.fragmentShader.replace(
        '#include <color_fragment>',
        '#include <color_fragment>\ndiffuseColor.a *= pow(max(0.,1.-length(vMistUv-.5)*2.),2.);',
      );
  };
  material.customProgramCacheKey = () => 'voxel-mist-wisps-1';
  const mesh = new InstancedMesh(new PlaneGeometry(1, 1), material, policy.mistInstances);
  mesh.frustumCulled = false;
  mesh.name = 'voxel-mist';
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  root.add(mesh);
  const matrix = new Matrix4(),
    position = new Vector3(),
    scale = new Vector3();
  function update(t: number, visible: boolean, camera: Camera) {
    mesh.visible = visible;
    if (!visible) return;
    for (let i = 0; i < policy.mistInstances; i++) {
      const p = sites[i];
      if (!p) continue;
      const x = p.x + Math.sin(t * 0.12 + p.phase * 6) * 2,
        z = p.z + Math.sin(t * 0.08 + p.phase * 7) * 2;
      const ground = world.heights.get(`${Math.round(x)},${Math.round(z)}`) ?? world.heights.get(`${p.x},${p.z}`) ?? 0;
      position.set(x, ground + 2.3, z);
      scale.set(14, 4, 1).multiplyScalar(Math.max(0.7, world.spec.radius / 35));
      matrix.compose(position, camera.quaternion, scale);
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  return { mesh, update };
}
