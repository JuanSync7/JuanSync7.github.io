import type { Vec3 } from '../camera';
import type { HardwarePart, Surface } from './types';

/** Model-space geometry is shared by SVG exports and the figure clock's canvas renderer. */
export class Draft {
  readonly parts: HardwarePart[] = [];
  private surfaces: Surface[] = [];
  private solid = 0;
  part(name: string, note: string): void {
    this.surfaces = [];
    this.parts.push({ name, note, surfaces: this.surfaces });
  }
  line(points: Vec3[], closed = false): void {
    this.surfaces.push({
      solid: this.solid,
      points: closed && points[0] ? [...points, points[0]] : points,
      face: false,
    });
  }
  box(x: number, y: number, z: number, w: number, h: number, d: number, bevel = 0.025): void {
    const b = Math.min(bevel, w / 4, d / 4);
    const outline: [number, number][] = [
      [x - w / 2 + b, z - d / 2],
      [x + w / 2 - b, z - d / 2],
      [x + w / 2, z - d / 2 + b],
      [x + w / 2, z + d / 2 - b],
      [x + w / 2 - b, z + d / 2],
      [x - w / 2 + b, z + d / 2],
      [x - w / 2, z + d / 2 - b],
      [x - w / 2, z - d / 2 + b],
    ];
    this.extrude(outline, y, y + h);
  }
  extrude(outline: readonly (readonly [number, number])[], low: number, high: number): void {
    this.solid++;
    const bottom = outline.map(([x, z]): Vec3 => [x, low, z]);
    const top = outline.map(([x, z]): Vec3 => [x, high, z]);
    this.surfaces.push({ solid: this.solid, points: [...bottom].reverse(), face: true });
    bottom.forEach((p, i) => {
      const j = (i + 1) % bottom.length;
      const q = bottom[j],
        a = top[j],
        b = top[i];
      if (q && a && b) this.surfaces.push({ solid: this.solid, points: [p, q, a, b], face: true });
    });
    this.surfaces.push({ solid: this.solid, points: top, face: true });
  }
  ring(x: number, y: number, z: number, radius: number, plane: 'top' | 'front' = 'top', n = 24): void {
    this.line(
      Array.from({ length: n }, (_, i): Vec3 => {
        const a = (i / n) * Math.PI * 2;
        return plane === 'top'
          ? [x + Math.cos(a) * radius, y, z + Math.sin(a) * radius]
          : [x + Math.cos(a) * radius, y + Math.sin(a) * radius, z];
      }),
      true,
    );
  }
  cylinder(x: number, y: number, z: number, radius: number, h: number, n = 16): void {
    this.extrude(
      Array.from({ length: n }, (_, i): [number, number] => {
        const a = (i / n) * Math.PI * 2;
        return [x + Math.cos(a) * radius, z + Math.sin(a) * radius];
      }),
      y,
      y + h,
    );
  }
  tiles(x: number, y: number, z: number, nx: number, nz: number, pitch: number, size: number): void {
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < nz; j++)
        this.box(x + (i - (nx - 1) / 2) * pitch, y, z + (j - (nz - 1) / 2) * pitch, size, 0.025, size, 0.004);
  }
  pins(x: number, y: number, z: number, n: number, pitch: number): void {
    for (let i = 0; i < n; i++) this.box(x + (i - (n - 1) / 2) * pitch, y, z, 0.025, 0.035, 0.1, 0);
  }
  ribs(x: number, y: number, z: number, n: number, width: number, depth: number, pitch: number): void {
    for (let i = 0; i < n; i++)
      this.line([
        [x - width / 2, y, z + i * pitch],
        [x + width / 2, y, z + i * pitch],
        [x + width / 2, y - depth, z + i * pitch],
      ]);
  }
}
