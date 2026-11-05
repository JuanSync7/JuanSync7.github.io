import type { Vec3 } from '../camera';
import type { HardwarePart, Surface } from './types';

/** Model-space geometry is shared by SVG exports and the figure clock's canvas renderer. */
export class Draft {
  readonly parts: HardwarePart[] = [];
  private surfaces: Surface[] = [];
  private solid = 0;
  private fine = false;
  part(name: string, note: string, explode?: Vec3, hiddenWhenClosed = false): void {
    this.surfaces = [];
    this.parts.push({ name, note, surfaces: this.surfaces, hiddenWhenClosed, explode });
  }
  line(points: Vec3[], closed = false): void {
    this.surfaces.push({
      solid: this.solid,
      points: closed && points[0] ? [...points, points[0]] : points,
      face: false,
      detail: this.fine,
    });
  }
  detail(draw: () => void): void {
    const previous = this.fine;
    this.fine = true;
    draw();
    this.fine = previous;
  }
  trace(points: Vec3[], from: string, to: string): void {
    this.line(points);
    const last = this.surfaces.at(-1);
    if (last) last.connection = { from, to };
  }
  surface(points: Vec3[], face = true, outline = true): void {
    this.surfaces.push({ solid: this.solid, points, face, outline, detail: this.fine });
  }
  transform(draw: () => void, at: Vec3, pitch = 0, yaw = 0): void {
    const start = this.surfaces.length;
    draw();
    const cp = Math.cos(pitch),
      sp = Math.sin(pitch),
      cy = Math.cos(yaw),
      sy = Math.sin(yaw);
    for (const surface of this.surfaces.slice(start))
      surface.points = surface.points.map(([x, y, z]) => {
        const yy = y * cp - z * sp,
          zz = y * sp + z * cp;
        return [x * cy - zz * sy + at[0], yy + at[1], x * sy + zz * cy + at[2]];
      });
  }
  tube(x: number, y: number, z: number, outer: number, inner: number, h: number, n = 24): void {
    this.solid++;
    const point = (r: number, a: number, yy: number): Vec3 => [x + Math.cos(a) * r, yy, z + Math.sin(a) * r];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2,
        b = ((i + 1) / n) * Math.PI * 2;
      this.surface([point(outer, a, y), point(outer, b, y), point(outer, b, y + h), point(outer, a, y + h)]);
      this.surface([point(inner, b, y), point(inner, a, y), point(inner, a, y + h), point(inner, b, y + h)]);
      this.surface([point(outer, a, y + h), point(outer, b, y + h), point(inner, b, y + h), point(inner, a, y + h)]);
    }
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
    const area = outline.reduce((sum, a, i) => {
      const b = outline[(i + 1) % outline.length] ?? a;
      return sum + a[0] * b[1] - b[0] * a[1];
    }, 0);
    const loop = area < 0 ? [...outline].reverse() : outline;
    const bottom = loop.map(([x, z]): Vec3 => [x, low, z]);
    const top = loop.map(([x, z]): Vec3 => [x, high, z]);
    this.surfaces.push({ solid: this.solid, points: [...bottom].reverse(), face: true, detail: this.fine });
    bottom.forEach((p, i) => {
      const j = (i + 1) % bottom.length;
      const q = bottom[j],
        a = top[j],
        b = top[i];
      if (q && a && b) this.surfaces.push({ solid: this.solid, points: [p, q, a, b], face: true, detail: this.fine });
    });
    this.surfaces.push({ solid: this.solid, points: top, face: true, detail: this.fine });
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
