import { BufferGeometry, Color, Float32BufferAttribute, Mesh, MeshLambertMaterial } from 'three';
import { hexOf } from '../ink';
import { voxel, type Block, type Material, type World } from './types';
import { terrainSolid } from './edges';

const faces: { normal: [number, number, number]; corners: [number, number, number][] }[] = [
  {
    normal: [1, 0, 0],
    corners: [
      [1, -1, -1],
      [1, 1, -1],
      [1, 1, 1],
      [1, -1, 1],
    ],
  },
  {
    normal: [-1, 0, 0],
    corners: [
      [-1, -1, 1],
      [-1, 1, 1],
      [-1, 1, -1],
      [-1, -1, -1],
    ],
  },
  {
    normal: [0, 1, 0],
    corners: [
      [-1, 1, 1],
      [1, 1, 1],
      [1, 1, -1],
      [-1, 1, -1],
    ],
  },
  {
    normal: [0, -1, 0],
    corners: [
      [-1, -1, -1],
      [1, -1, -1],
      [1, -1, 1],
      [-1, -1, 1],
    ],
  },
  {
    normal: [0, 0, 1],
    corners: [
      [1, -1, 1],
      [1, 1, 1],
      [-1, 1, 1],
      [-1, -1, 1],
    ],
  },
  {
    normal: [0, 0, -1],
    corners: [
      [-1, -1, -1],
      [-1, 1, -1],
      [1, 1, -1],
      [1, -1, -1],
    ],
  },
];

/** Cull against the implicit terrain volume, not just the boundary voxel list. */
export function blockMesh(blocks: Block[], world?: World): Mesh {
  const occupied = new Set(blocks.map((b) => voxel(b.x, b.y, b.z)));
  const solid = (x: number, y: number, z: number): boolean => {
    if (occupied.has(voxel(x, y, z))) return true;
    if (!world) return false;
    return terrainSolid(world, x, y, z);
  };
  const positions: number[] = [],
    normals: number[] = [],
    colors: number[] = [],
    indices: number[] = [];
  const palette = new Map<Material, Color>();
  for (const b of blocks) {
    let color = palette.get(b.material);
    if (!color) {
      color = new Color(hexOf(b.material));
      palette.set(b.material, color);
    }
    const brightness = 0.85 + (Math.abs(b.x * 17 + b.z * 29 + b.y * 13) % 7) / 180;
    for (const face of faces) {
      const [dx, dy, dz] = face.normal;
      if (solid(b.x + dx, b.y + dy, b.z + dz)) continue;
      const index = positions.length / 3;
      for (const [x, y, z] of face.corners) {
        positions.push(b.x + x / 2, b.y + y / 2, b.z + z / 2);
        normals.push(dx, dy, dz);
        colors.push(color.r * brightness, color.g * brightness, color.b * brightness);
      }
      indices.push(index, index + 1, index + 2, index, index + 2, index + 3);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  const mesh = new Mesh(geometry, new MeshLambertMaterial({ vertexColors: true }));
  mesh.name = 'voxel-solids';
  return mesh;
}
