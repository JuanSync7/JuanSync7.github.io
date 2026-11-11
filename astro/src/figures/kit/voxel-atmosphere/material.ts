import { mutedVoxelPalette } from './palette';
import { MeshLambertMaterial } from 'three';

/** Only actual window/fire cells emit; foliage and yellow crops must not become lamps. */
export function emissiveVoxelMaterial(vertexColors = false) {
  const material = new MeshLambertMaterial({ vertexColors });
  const level = { value: 1 };
  material.userData.voxelEmission = level;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.voxelGlow = level;
    shader.vertexShader = 'attribute float voxelEmission; varying float vVoxelEmission;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvVoxelEmission = voxelEmission;',
    );
    shader.fragmentShader = 'uniform float voxelGlow; varying float vVoxelEmission;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * vVoxelEmission * voxelGlow;',
    );
  };
  material.customProgramCacheKey = () => 'voxel-practical-emission-1';
  mutedVoxelPalette(material);
  return material;
}
