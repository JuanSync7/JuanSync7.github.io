import { BoxGeometry, DynamicDrawUsage, Group, InstancedMesh, Matrix4, MeshBasicMaterial } from 'three';
import { waterSurface } from './water-surface';
import { seedFor } from './seeds';
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
  const { mesh, clock, weightAt } = waterSurface(world);
  root.add(mesh);
  const foamCells = cells
    .filter(
      ({ x, z, liquid, edge }) =>
        liquid.kind === 'water' &&
        boatClearance(world, x, z) &&
        seedFor(world.spec.layoutSeed, `foam/${x}/${z}`) % (edge ? 3 : 37) === 0,
    )
    .map((c) => ({ ...c, weights: [weightAt(c.x - 0.5, c.z + 0.5), weightAt(c.x + 0.5, c.z - 0.5)] }));
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
  foamCells.forEach(({ x, z, liquid, edge }, i) => {
    matrix.makeScale(1, 1, edge ? 1.5 : 1);
    matrix.setPosition(x, liquid.level + 0.56, z);
    foam.setMatrixAt(i, matrix);
  });
  foam.instanceMatrix.setUsage(DynamicDrawUsage);
  let lastTime = NaN;
  function update(t: number): void {
    if (t === lastTime) return;
    lastTime = t;
    const foamMatrices = foam.instanceMatrix.array;
    clock.value = t;
    foamCells.forEach(({ x, z, liquid, weights }, i) => {
      foamMatrices[i * 16] = 0.65 + Math.sin(t * 1.4 + x * 0.28 + z * 0.19) * 0.3;
      const dy =
        (swell(x - 0.5, z + 0.5, t) * (weights[0] ?? 0) + swell(x + 0.5, z - 0.5, t) * (weights[1] ?? 0)) * 0.5;
      foamMatrices[i * 16 + 13] = liquid.level + 0.56 + dy;
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
  return { mesh, clock, cells, foam, foamCells, boats, update };
}
