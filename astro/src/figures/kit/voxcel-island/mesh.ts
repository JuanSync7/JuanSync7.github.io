import { BoxGeometry, Color, InstancedMesh, Matrix4, MeshLambertMaterial } from 'three';
import { hexOf } from '../ink';
import { voxel, type Block } from './types';

export function blockMesh(blocks: Block[]): InstancedMesh {
  const occupied = new Set(blocks.map((b) => voxel(b.x, b.y, b.z)));
  const visible = blocks.filter((b) =>
    [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ].some(([dx = 0, dy = 0, dz = 0]) => !occupied.has(voxel(b.x + dx, b.y + dy, b.z + dz))),
  );
  const mesh = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshLambertMaterial(), visible.length);
  const matrix = new Matrix4(),
    colour = new Color();
  visible.forEach((b, i) => {
    mesh.setMatrixAt(i, matrix.makeTranslation(b.x, b.y, b.z));
    colour.set(hexOf(b.material)).multiplyScalar(0.79 + ((b.x * 17 + b.z * 29 + b.y * 13) % 7) / 120);
    mesh.setColorAt(i, colour);
  });
  mesh.computeBoundingSphere();
  return mesh;
}
