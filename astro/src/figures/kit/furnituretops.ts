import type { Vec3 } from './camera';
import { TableDraft } from './tableparts';
import type { TableTheme } from './tablethemes';

export function top(p: TableDraft, t: TableTheme): void {
  const x = t.w / 2,
    z = t.d / 2;
  let outline: [number, number][];
  if (t.surface === 'oval')
    outline = Array.from({ length: 48 }, (_, i) => [
      Math.cos((i * Math.PI) / 24) * x,
      Math.sin((i * Math.PI) / 24) * z,
    ]);
  else {
    const cut = t.surface === 'chamfer' ? (t.id === 'computer' ? 0.85 : 0.35) : 0.08;
    outline = [
      [-x + 0.04, -z],
      [x - 0.04, -z],
      [x, -z + 0.04],
      [x, z - cut],
      [x - cut, z],
      [-x + cut, z],
      [-x, z - cut],
      [-x, -z + 0.04],
    ];
  }
  // The working surface stays at y=0; the edge slopes down into the full-thickness slab.
  const inset = outline.map(([a, b]): Vec3 => [a * (1 - 0.06 / x), 0, b * (1 - 0.06 / z)]);
  const edge = outline.map(([a, b]): Vec3 => [a, -0.055, b]);
  p.material('top', () => {
    p.extrude(outline, -0.19, -0.055);
    p.face(inset);
    edge.forEach((a, i) => {
      const j = (i + 1) % edge.length,
        b = edge[j],
        c = inset[j],
        d = inset[i];
      if (b && c && d) p.face([a, b, c, d]);
    });
  });
  p.material(t.id === 'lab' || t.id === 'bar' ? 'metal' : 'panel', () =>
    p.extrude(
      outline.map(([a, b]) => [a * 0.992, b * 0.992]),
      -0.235,
      -0.19,
    ),
  );
}
export function woodGrain(p: TableDraft, t: TableTheme): void {
  for (const z of [-t.d / 4, 0, t.d / 4]) {
    const half = t.surface === 'oval' ? (t.w / 2) * Math.sqrt(1 - (z / (t.d / 2)) ** 2) - 0.1 : t.w / 2 - 0.15;
    p.material('recess', () => p.box(0, 0.006, z, half * 2, 0.003, 0.018, 0));
  }
}
export function ovalApron(p: TableDraft, t: TableTheme): void {
  p.material('panel', () => {
    const outer = (i: number, y: number, inset = 0): Vec3 => [
      (t.w * 0.41 - inset) * Math.cos((i * Math.PI) / 24),
      y,
      (t.d * 0.385 - inset) * Math.sin((i * Math.PI) / 24),
    ];
    for (let i = 0; i < 48; i++) {
      p.face([outer(i, -0.23), outer(i + 1, -0.23), outer(i + 1, -0.5), outer(i, -0.5)]);
      p.face([outer(i, -0.5), outer(i + 1, -0.5), outer(i + 1, -0.5, 0.09), outer(i, -0.5, 0.09)]);
      p.face([outer(i, -0.23, 0.09), outer(i + 1, -0.23, 0.09), outer(i + 1, -0.5, 0.09), outer(i, -0.5, 0.09)]);
    }
  });
}
