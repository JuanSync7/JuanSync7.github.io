import { BufferGeometry, Color, Float32BufferAttribute, Mesh } from 'three';
import { emissiveVoxelMaterial } from '../voxel-atmosphere/material';
import { hexOf } from '../ink';
import { surfaceQuads } from './surfaces';
import type { Block, Material, World } from './types';

/** Greedy geometry preserves the exact exposed unit faces and shades actual solid contacts. */
export function blockMesh(blocks: Block[], world?: World, emissive: Set<string> = new Set()): Mesh {
  const positions: number[] = [],
    normals: number[] = [],
    colors: number[] = [],
    indices: number[] = [],
    emission: number[] = [];
  const palette = new Map<Material, Color>(),
    quads = surfaceQuads(blocks, world);
  let unitFaces = 0;
  for (const q of quads) {
    const u = (q.axis + 1) % 3,
      v = (q.axis + 2) % 3,
      index = positions.length / 3;
    let color = palette.get(q.material);
    if (!color) {
      color = new Color(hexOf(q.material));
      palette.set(q.material, color);
    }
    for (let i = 0; i < 4; i++) {
      const p = [0, 0, 0],
        n = [0, 0, 0];
      p[q.axis] = q.plane;
      n[q.axis] = q.sign;
      p[u] = q.u - 0.5 + (i === 1 || i === 2 ? q.width : 0);
      p[v] = q.v - 0.5 + (i >= 2 ? q.height : 0);
      const cell = [0, 0, 0];
      cell[q.axis] = q.plane - q.sign * 0.5;
      cell[u] = q.u;
      cell[v] = q.v;
      emission.push(emissive.has(cell.join(',')) ? 1 : 0);
      const brightness = 0.92 * (1 - (q.ao[i] ?? 0) * 0.12);
      positions.push(...p);
      normals.push(...n);
      colors.push(color.r * brightness, color.g * brightness, color.b * brightness);
    }
    const flip = (q.ao[0] ?? 0) + (q.ao[2] ?? 0) > (q.ao[1] ?? 0) + (q.ao[3] ?? 0);
    const triangles = flip ? [0, 1, 3, 1, 2, 3] : [0, 1, 2, 0, 2, 3];
    for (let t = 0; t < triangles.length; t += 3) {
      const a = triangles[t] ?? 0,
        b = triangles[t + 1] ?? 0,
        c = triangles[t + 2] ?? 0;
      indices.push(index + a, index + (q.sign > 0 ? b : c), index + (q.sign > 0 ? c : b));
    }
    unitFaces += q.width * q.height;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('voxelEmission', new Float32BufferAttribute(emission, 1));
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  geometry.userData.surface = { unitFaces, quads: quads.length };
  const mesh = new Mesh(geometry, emissiveVoxelMaterial(true));
  mesh.name = 'voxel-solids';
  return mesh;
}
