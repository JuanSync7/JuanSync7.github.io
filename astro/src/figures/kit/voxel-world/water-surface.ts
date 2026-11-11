import { BufferGeometry, Color, Float32BufferAttribute, Mesh } from 'three';
import { emissiveVoxelMaterial } from '../voxel-atmosphere/material';
import { hexOf } from '../ink';
import { waveGLSL } from './water';
import { cell, type Liquid, type World } from './types';

/** A shared vertex wave field closes seams; only the surface/boundary enters the GPU. */
export function waterSurface(world: World) {
  const positions: number[] = [],
    normals: number[] = [],
    colors: number[] = [],
    weights: number[] = [],
    emission: number[] = [],
    indices: number[] = [];
  const clock = { value: 0 },
    palette = new Map<string, Color>(),
    weightCache = new Map<string, number>();
  const weightAt = (x: number, z: number): number => {
    const id = cell(x, z),
      cached = weightCache.get(id);
    if (cached !== undefined) return cached;
    let shore = false;
    for (const ix of [Math.floor(x), Math.ceil(x)])
      for (const iz of [Math.floor(z), Math.ceil(z)]) {
        const k = cell(ix, iz);
        if (world.liquids.get(k)?.kind === 'ice') {
          weightCache.set(id, 0);
          return 0;
        }
        if (world.heights.has(k) && !world.liquids.has(k)) shore = true;
      }
    const value = shore ? 0.3 : 1;
    weightCache.set(id, value);
    return value;
  };
  const face = (points: number[][], normal: number[], liquid: Liquid, moving: boolean[]): void => {
    const id = liquid.kind,
      start = positions.length / 3;
    let color = palette.get(id);
    if (!color) {
      color = new Color(hexOf(id === 'ice' ? 'worldIce' : id === 'lava' ? 'worldEmber' : 'worldWater'));
      palette.set(id, color);
    }
    points.forEach((p, i) => {
      positions.push(p[0] ?? 0, p[1] ?? 0, p[2] ?? 0);
      normals.push(...normal);
      colors.push(color.r, color.g, color.b);
      emission.push(liquid.kind === 'lava' ? 1 : 0);
      weights.push(moving[i] && liquid.kind !== 'ice' ? weightAt(p[0] ?? 0, p[2] ?? 0) : 0);
    });
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  };
  for (const [k, l] of world.liquids) {
    const [x = 0, z = 0] = k.split(',').map(Number),
      top = l.level + 0.5;
    face(
      [
        [x - 0.5, top, z + 0.5],
        [x + 0.5, top, z + 0.5],
        [x + 0.5, top, z - 0.5],
        [x - 0.5, top, z - 0.5],
      ],
      [0, 1, 0],
      l,
      [true, true, true, true],
    );
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const ox = dx ?? 0,
        oz = dz ?? 0,
        neighbor = cell(x + ox, z + oz),
        other = world.liquids.get(neighbor);
      const floor = world.heights.get(neighbor) ?? world.seabed.get(neighbor);
      const bottom = Math.max(
        l.bottom - 0.5,
        other ? other.level + 0.5 : floor === undefined ? l.bottom - 0.5 : floor + 0.5,
      );
      if (bottom >= top) continue;
      const x0 = x + ox * 0.5,
        z0 = z + oz * 0.5,
        tx = oz * 0.5,
        tz = -ox * 0.5;
      face(
        [
          [x0 - tx, bottom, z0 - tz],
          [x0 + tx, bottom, z0 + tz],
          [x0 + tx, top, z0 + tz],
          [x0 - tx, top, z0 - tz],
        ],
        [ox, 0, oz],
        l,
        [!!other, !!other, true, true],
      );
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('voxelEmission', new Float32BufferAttribute(emission, 1));
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.setAttribute('voxelWaveWeight', new Float32BufferAttribute(weights, 1));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  if (geometry.boundingSphere) geometry.boundingSphere.radius += 0.2;
  const material = emissiveVoxelMaterial(true);
  material.transparent = true;
  material.opacity = 0.91;
  material.depthWrite = false;
  const addEmission = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    addEmission(shader, renderer);
    shader.uniforms.voxelTime = clock;
    shader.vertexShader = 'uniform float voxelTime;\nattribute float voxelWaveWeight;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>\ntransformed.y += (${waveGLSL('position.x', 'position.z', 'voxelTime')}) * voxelWaveWeight;`,
    );
  };
  material.customProgramCacheKey = () => 'voxel-water-field-emission-muted/3';
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.name = 'voxel-water';
  return { mesh, clock, weightAt };
}
