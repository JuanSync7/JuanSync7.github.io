import { TableDraft } from './tableparts';
import { prop, type PropKind } from './tableprops';

export function framed(p: TableDraft, x: number, y: number, width: number, height: number, depth = 0.12): void {
  p.material('recess', () => p.box(x, y, 0.02, width, height, 0.03, 0.01));
  p.material('inlay', () => {
    for (const a of [-1, 1]) p.box(x + a * (width / 2 - 0.06), y, 0.055, 0.12, height, depth, 0.015);
    for (const at of [y, y + height - 0.12]) p.box(x, at, 0.055, width, 0.12, depth, 0.015);
  });
}
export function cupboard(p: TableDraft, x: number, y: number, width: number, height: number): void {
  p.material('frame', () => p.box(x, y, 0.25, width, height, 0.5, 0.035));
  p.material('recess', () => p.box(x, y + 0.06, 0.503, width - 0.12, height - 0.12, 0.025, 0.01));
  p.material('inlay', () => {
    for (const a of [-1, 1]) p.box(x + (a * width) / 4, y + 0.09, 0.535, width / 2 - 0.07, height - 0.18, 0.05, 0.025);
  });
  p.material('metal', () => {
    for (const a of [-1, 1]) p.tube([x + a * 0.13, y + 0.3, 0.6], [x + a * 0.13, y + 0.65, 0.6], 0.025, 8);
  });
}
export function shelf(p: TableDraft, x: number, y: number, width: number, height: number): void {
  framed(p, x, y, width, height, 0.48);
  p.material('frame', () => {
    for (const at of [y, y + height / 2, y + height - 0.06]) p.box(x, at, 0.25, width, 0.06, 0.55, 0.015);
  });
}
export function accessory(p: TableDraft, kind: PropKind, x: number, y: number, z: number, scale: number): void {
  const surfaces = p.parts[0]?.surfaces;
  if (!surfaces) return;
  for (const s of prop(kind).surfaces)
    surfaces.push({ ...s, points: s.points.map((q) => [x + q[0] * scale, y + q[1] * scale, z + q[2] * scale]) });
}
export function windowFrame(p: TableDraft): void {
  framed(p, 0, 1.15, 2.5, 2.0, 0.15);
  p.material('panel', () => p.box(0, 1.28, 0.09, 2.22, 1.72, 0.04, 0));
  p.material('inlay', () => {
    p.box(0, 1.2, 0.15, 0.07, 1.88, 0.05, 0);
    p.box(0, 2.12, 0.15, 2.35, 0.06, 0.05, 0);
    p.box(0, 1.1, 0.18, 2.7, 0.1, 0.38, 0.025);
  });
}
export function door(p: TableDraft, floor: number): void {
  framed(p, 0, floor, 1.85, 4.3, 0.12);
  p.material('panel', () => p.box(0, floor + 0.08, 0.11, 1.58, 4.05, 0.05, 0.025));
  p.material('frame', () => {
    for (const y of [floor + 0.3, floor + 2.0]) p.box(0, y, 0.165, 1.3, 1.4, 0.025, 0.025);
  });
  p.material('metal', () => p.tube([0.48, floor + 1.95, 0.22], [0.72, floor + 1.95, 0.22], 0.035));
}
