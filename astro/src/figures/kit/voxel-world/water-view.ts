import {
  BoxGeometry,
  Color,
  DynamicDrawUsage,
  Group,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  MeshLambertMaterial,
} from 'three';
import { hexOf } from '../ink';
import { blockMesh } from './mesh';
import { boatClearance, shoreCell, swell } from './water';
import type { Liquid, World } from './types';

interface WaterCell {
  x: number;
  z: number;
  liquid: Liquid;
  edge: boolean;
}
export function buildWater(world: World, root: Group) {
  const cells: WaterCell[] = [...world.liquids].map(([k, liquid]) => {
    const [x = 0, z = 0] = k.split(',').map(Number);
    return { x, z, liquid, edge: shoreCell(world, x, z) };
  });
  const mesh = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshLambertMaterial(), cells.length),
    color = new Color();
  cells.forEach(({ liquid, edge }, i) => {
    color.set(hexOf(liquid.kind === 'lava' ? 'worldEmber' : liquid.kind === 'ice' ? 'worldIce' : 'worldWater'));
    if (edge && liquid.kind === 'water') color.lerp(new Color(hexOf('worldIce')), 0.12);
    mesh.setColorAt(i, color);
  });
  mesh.frustumCulled = false;
  root.add(mesh);
  const foamCells = cells.filter(
    ({ x, z, liquid, edge }) =>
      liquid.kind !== 'ice' && boatClearance(world, x, z) && (edge || (x % 4 === 0 && z % 4 === 0)),
  );
  const foam = new InstancedMesh(
    new BoxGeometry(0.72, 0.06, 0.13),
    new MeshBasicMaterial({ color: hexOf('worldSnow'), transparent: true, opacity: 0.3 }),
    foamCells.length,
  );
  foam.frustumCulled = false;
  root.add(foam);
  const boats = world.boats.map((b) => {
    const g = new Group();
    g.add(blockMesh(b.blocks));
    root.add(g);
    return g;
  });
  const matrix = new Matrix4();
  cells.forEach(({ x, z, liquid }, i) => {
    const height = liquid.level - liquid.bottom + 1;
    matrix.makeScale(1, height, 1);
    matrix.setPosition(x, liquid.bottom - 0.5 + height / 2, z);
    mesh.setMatrixAt(i, matrix);
  });
  foamCells.forEach(({ x, z, liquid, edge }, i) => {
    matrix.makeScale(1, 1, edge ? 1.5 : 1);
    matrix.setPosition(x, liquid.level + 0.56, z);
    foam.setMatrixAt(i, matrix);
  });
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  foam.instanceMatrix.setUsage(DynamicDrawUsage);
  let lastTime = NaN;
  function update(t: number): void {
    if (t === lastTime) return;
    lastTime = t;
    const waterMatrices = mesh.instanceMatrix.array,
      foamMatrices = foam.instanceMatrix.array;
    cells.forEach(({ x, z, liquid, edge }, i) => {
      if (liquid.kind === 'ice') return;
      const dy = swell(x, z, t) * (edge ? 0.3 : 1),
        height = liquid.level - liquid.bottom + 1 + dy;
      // Only vertical scale and translation vary; retain the other fourteen matrix entries.
      waterMatrices[i * 16 + 5] = height;
      waterMatrices[i * 16 + 13] = liquid.bottom - 0.5 + height / 2;
    });
    mesh.instanceMatrix.needsUpdate = true;
    foamCells.forEach(({ x, z, liquid, edge }, i) => {
      foamMatrices[i * 16] = 0.65 + Math.sin(t * 1.4 + x * 0.28 + z * 0.19) * 0.3;
      foamMatrices[i * 16 + 13] = liquid.level + 0.56 + swell(x, z, t) * (edge ? 0.3 : 1);
    });
    foam.instanceMatrix.needsUpdate = true;
    boats.forEach((boat, i) => {
      const b = world.boats[i];
      if (!b) return;
      boat.position.set(b.x, b.y + swell(b.x, b.z, t), b.z);
      boat.rotation.z = Math.sin(t * 1.4 + b.x * 0.28) * 0.018;
      boat.rotation.x = Math.sin(t * 1.1 + b.z * 0.19) * 0.012;
    });
  }
  return { mesh, cells, foam, foamCells, boats, update };
}
