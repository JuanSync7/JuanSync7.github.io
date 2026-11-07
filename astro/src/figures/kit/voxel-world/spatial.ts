import { CANOPIES } from './habitat-rules';
import { BUILDINGS, cell, type Block, type Prop, type Recipe } from './types';

/** Structures reserve a full lot; low dressing uses real 3D clearance below canopy. */
export class SpatialIndex {
  readonly occupied = new Set<string>();
  readonly hard = new Set<string>();
  private columns = new Map<string, Set<number>>();
  private canopies: Prop[] = [];
  private focal: Prop[] = [];

  overlapsCanopy(r: Recipe, x: number, z: number, rx: number, rz: number): boolean {
    const protectedProps = CANOPIES.has(r.kind)
      ? [...this.canopies, ...this.focal]
      : r.id.startsWith('landmark/')
        ? this.canopies
        : [];
    return protectedProps.some((p) => Math.abs(x - p.x) <= rx + p.rx + 1 && Math.abs(z - p.z) <= rz + p.rz + 1);
  }

  collides(blocks: Block[], x: number, y: number, z: number): boolean {
    for (const b of blocks)
      for (let dx = -1; dx <= 1; dx++)
        for (let dz = -1; dz <= 1; dz++) {
          const column = this.columns.get(cell(x + b.x + dx, z + b.z + dz));
          if (!column) continue;
          const h = y + b.y;
          if (column.has(h - 1) || column.has(h) || column.has(h + 1)) return true;
        }
    return false;
  }
  add(p: Prop): void {
    if (CANOPIES.has(p.kind)) this.canopies.push(p);
    else if (p.recipe.id.startsWith('landmark/')) this.focal.push(p);
    if (BUILDINGS.has(p.kind))
      for (let dx = -p.rx; dx <= p.rx; dx++)
        for (let dz = -p.rz; dz <= p.rz; dz++) {
          const k = cell(p.x + dx, p.z + dz);
          this.hard.add(k);
          this.occupied.add(k);
        }
    for (const b of p.blocks) {
      const k = cell(p.x + b.x, p.z + b.z),
        column = this.columns.get(k) ?? new Set<number>();
      column.add(p.y + b.y);
      this.columns.set(k, column);
      this.occupied.add(k);
    }
  }
}
