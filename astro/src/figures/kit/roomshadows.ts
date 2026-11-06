import { ShaderChunk, type MeshStandardMaterial } from 'three';

/** Material-local PCSS, adapted from pmndrs/drei-vanilla/src/core/pcss.ts (MIT).
 * Copyright (c) 2023 Poimandres. License: astro/licenses/drei-room-shadows.txt.
 * Scope the patch to this room's materials: other figures keep their own shaders.
 */
const PCSS = `
vec2 roomDisk(int i, float angle) {
  float r = sqrt((float(i) + 0.5) / 16.0);
  float a = float(i) * 2.399963 + angle;
  return vec2(cos(a), sin(a)) * r;
}
float roomSoftShadow(sampler2D map, vec4 coord) {
  vec2 texel = 1.0 / vec2(textureSize(map, 0));
  float angle = rand(gl_FragCoord.xy) * PI2;
  float sum = 0.0;
  float count = 0.0;
  for (int i = 0; i < 16; i++) {
    float depth = unpackRGBAToDepth(texture2D(map, coord.xy + roomDisk(i, angle) * texel * 56.0));
    if (depth < coord.z) { sum += depth; count += 1.0; }
  }
  if (count < 0.5) return 1.0;
  float blocker = sum / count;
  float radius = clamp((coord.z - blocker) / max(blocker, 0.001) * 70.0, 1.0, 28.0);
  float shade = 0.0;
  for (int i = 0; i < 16; i++) {
    vec2 uv = coord.xy + roomDisk(i, angle) * texel * radius;
    shade += step(coord.z, unpackRGBAToDepth(texture2D(map, uv)));
  }
  return shade / 16.0;
}
`;
export function roomShadows(material: MeshStandardMaterial): void {
  material.onBeforeCompile = (shader) => {
    const chunk = ShaderChunk.shadowmap_pars_fragment
      .replace('#ifdef USE_SHADOWMAP', '#ifdef USE_SHADOWMAP\n' + PCSS)
      .replace(
        '#if defined( SHADOWMAP_TYPE_PCF )',
        'return mix(1.0, roomSoftShadow(shadowMap, shadowCoord), shadowIntensity);\n#if defined( SHADOWMAP_TYPE_PCF )',
      );
    shader.fragmentShader = shader.fragmentShader.replace('#include <shadowmap_pars_fragment>', chunk);
  };
  material.customProgramCacheKey = () => 'tabletop-room-pcss-16-v1';
}
