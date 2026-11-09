import type { Material, Color } from 'three';
import type { NightKey } from '../../../styles/tokens/palette';
import { hexOf } from '../ink';

function saturation(key: NightKey): number {
  const hex = hexOf(key).slice(1),
    channels = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (Math.max(...channels) - Math.min(...channels)) / Math.max(...channels);
}
// Preserve each matte material's chroma under coloured light. Strong colour belongs to emitting sources.
export const saturationCeiling = saturation('worldLeaf');
const saturationFloor = saturation('worldStone');
export const paletteGLSL = `float voxelSaturation(vec3 c) {
  float hi = max(c.r, max(c.g, c.b));
  return (hi - min(c.r, min(c.g, c.b))) / max(hi, 0.00001);
}
vec3 voxelMutedPalette(vec3 c, float limit) {
  float hi = max(c.r, max(c.g, c.b));
  return mix(vec3(hi), c, min(1.0, limit / max(voxelSaturation(c), 0.00001)));
}
vec3 voxelGlowPalette(vec3 c) { return voxelMutedPalette(c, ${saturationCeiling.toFixed(8)}); }`;
export function mutedVoxelPalette(material: Material) {
  const original = material.onBeforeCompile,
    key = material.customProgramCacheKey.bind(material);
  material.onBeforeCompile = (shader, renderer) => {
    original.call(material, shader, renderer);
    shader.fragmentShader = paletteGLSL + '\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <colorspace_fragment>',
      `#include <colorspace_fragment>
      vec3 voxelBase = linearToOutputTexel(vec4(diffuseColor.rgb, 1.0)).rgb;
      float voxelLimit = clamp(voxelSaturation(voxelBase), ${saturationFloor.toFixed(8)}, ${saturationCeiling.toFixed(8)});
      gl_FragColor.rgb = voxelMutedPalette(gl_FragColor.rgb, mix(voxelLimit, ${saturationCeiling.toFixed(8)}, step(0.5, vVoxelEmission)));`,
    );
  };
  material.customProgramCacheKey = () => key() + '/muted-voxel-material-gamut-2';
  return material;
}
export function mutedDisplayColor(colour: Color, material: NightKey, emission: boolean): string {
  const hex = colour.getHexString(),
    values = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const hi = Math.max(...values),
    lo = Math.min(...values),
    chroma = hi ? (hi - lo) / hi : 0;
  const limit = emission
    ? saturationCeiling
    : Math.min(saturationCeiling, Math.max(saturationFloor, saturation(material)));
  const weight = chroma ? Math.min(1, limit / chroma) : 1;
  return `rgb(${values.map((v) => Math.round(hi + (v - hi) * weight)).join(',')})`;
}
