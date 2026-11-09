import policy from './policy.json';
import { AdditiveBlending, Color, Group, Mesh, PlaneGeometry, PointLight, ShaderMaterial, type Camera } from 'three';
import { hexOf } from '../ink';
import type { AtmosphereWorld } from './types';
export function practicalSources(world: AtmosphereWorld, isBuilding: (kind: string) => boolean) {
  const cells = new Set<string>();
  const sources: { x: number; y: number; z: number; magic: boolean }[] = [];
  for (const prop of world.props) {
    const windows = prop.blocks
      .filter((b) => isBuilding(prop.kind) && b.material === 'worldHoney')
      .sort((a, b) => b.x + b.z - a.x - a.z);
    for (const b of windows) cells.add(`${prop.x + b.x},${prop.y + b.y},${prop.z + b.z}`);
    // Source stays on the real window face, rather than an invented light in a clearing.
    if (windows[0]) {
      const b = windows[0];
      sources.push({
        x: prop.x + b.x + (Math.abs(b.x) > Math.abs(b.z) ? Math.sign(b.x) * 0.65 : 0),
        y: prop.y + b.y,
        z: prop.z + b.z + (Math.abs(b.z) >= Math.abs(b.x) ? Math.sign(b.z) * 0.65 : 0),
        magic: false,
      });
    }
  }
  for (const e of world.emitters) if (e.kind !== 'smoke') sources.push({ ...e, magic: e.kind === 'magic' });
  for (const p of world.landmarks)
    if (p.kind === 'lava crater') sources.push({ x: p.x, y: p.height + 1, z: p.z, magic: false });
  return { cells, sources: sources.slice(0, policy.maxGlows) };
}
export function buildPracticals(root: Group, source: ReturnType<typeof practicalSources>) {
  const geometry = new PlaneGeometry(1, 1);
  const lamps = source.sources.map((p, i) => {
    const colour = new Color(hexOf(p.magic ? 'signal' : 'worldHoney'));
    const material = new ShaderMaterial({
      uniforms: { colour: { value: colour }, strength: { value: 1 } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexShader:
        'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:
        'varying vec2 vUv;uniform vec3 colour;uniform float strength;void main(){float d=length(vUv-.5)*2.;float a=pow(max(0.,1.-d),3.);gl_FragColor=vec4(colour*strength,a*.52);}',
    });
    const halo = new Mesh(geometry, material);
    halo.name = 'voxel-practical-glow';
    halo.position.set(p.x, p.y, p.z);
    halo.scale.setScalar(p.magic ? 6 : 5);
    root.add(halo);
    const light = i < policy.maxPointLights ? new PointLight(colour, 0, 16, 1.4) : null;
    if (light) {
      light.position.copy(halo.position);
      light.position.y += 1;
      root.add(light);
    }
    return { halo, light };
  });
  return {
    lamps,
    update(camera: Camera, emission: number) {
      for (const { halo, light } of lamps) {
        halo.quaternion.copy(camera.quaternion);
        halo.material.uniforms.strength.value = emission;
        if (light) light.intensity = emission * 9;
      }
    },
  };
}
