import { voxel, type Block, type Material } from './types';

export class Blocks {
  private cells = new Map<string, Block>();
  put(x: number, y: number, z: number, material: Material): void {
    this.cells.set(voxel(x, y, z), { x, y, z, material });
  }
  box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, material: Material): void {
    for (let x = x0; x <= x1; x++)
      for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) this.put(x, y, z, material);
  }
  disc(y: number, r: number, material: Material, cx = 0, cz = 0): void {
    for (let x = -r; x <= r; x++)
      for (let z = -r; z <= r; z++) if (x * x + z * z <= r * r + 0.5) this.put(x + cx, y, z + cz, material);
  }
  result(turn: number): Block[] {
    return [...this.cells.values()].map((b) => {
      let x = b.x,
        z = b.z;
      for (let i = 0; i < turn; i++) [x, z] = [-z, x];
      return { ...b, x, z };
    });
  }
}
