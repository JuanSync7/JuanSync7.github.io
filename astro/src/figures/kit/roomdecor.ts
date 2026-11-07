import { TableDraft, type FurnitureFinish, type TableSurface } from './tableparts';
import { prop, type PropKind } from './tableprops';

export function framed(p: TableDraft, x: number, y: number, width: number, height: number, depth = 0.12): void {
  p.material('recess', () => p.box(x, y, 0.02, width, height, 0.03, 0.01));
  p.material('inlay', () => {
    for (const a of [-1, 1]) p.box(x + a * (width / 2 - 0.06), y, 0.02 + depth / 2, 0.12, height, depth, 0.015);
    for (const at of [y, y + height - 0.12]) p.box(x, at, 0.02 + depth / 2, width, 0.12, depth, 0.015);
  });
}
export function cupboard(p: TableDraft, x: number, y: number, width: number, height: number): void {
  p.material('frame', () => p.box(x, y, 0.25, width, height, 0.5, 0.035));
  p.material('recess', () => p.box(x, y + 0.06, 0.503, width - 0.12, height - 0.12, 0.025, 0.01));
  p.material('cabinet', () => {
    for (const a of [-1, 1]) p.box(x + (a * width) / 4, y + 0.09, 0.535, width / 2 - 0.07, height - 0.18, 0.05, 0.025);
  });
  p.material('metal', () => {
    p.box(x, y + height - 0.18, -0.03, width - 0.24, 0.1, 0.06, 0.005);
    for (const a of [-1, 1]) p.roundRod([x + a * 0.13, y + 0.3, 0.6], [x + a * 0.13, y + 0.65, 0.6], 0.025, 8);
  });
}
export function shelf(p: TableDraft, x: number, y: number, width: number, height: number): readonly [number, number] {
  const board = 0.08,
    depth = 0.6;
  p.material('panel', () => p.box(x, y, 0.0225, width, height, 0.045, 0.005));
  p.material('frame', () => {
    for (const sign of [-1, 1]) p.box(x + sign * (width / 2 - board / 2), y, depth / 2, board, height, depth, 0.01);
    for (const at of [y, y + height / 2, y + height - board]) p.box(x, at, depth / 2, width, board, depth, 0.01);
  });
  return [y + board, y + height / 2 + board];
}
/** The support is the board's top surface; prop origins need not be their physical base. */
export function shelvedAccessory(
  p: TableDraft,
  kind: PropKind,
  x: number,
  top: number,
  z: number,
  scale: number,
): void {
  accessory(p, kind, x, top - prop(kind).bounds.lo[1] * scale, z, scale);
}
export function accessory(p: TableDraft, kind: PropKind, x: number, y: number, z: number, scale: number): void {
  const surfaces = p.parts[0]?.surfaces;
  if (!surfaces) return;
  for (const s of prop(kind).surfaces) {
    const piece: TableSurface = {
      ...s,
      finish: s.finish ?? accessoryFinish(kind, s.solid),
      points: s.points.map((q) => [x + q[0] * scale, y + q[1] * scale, z + q[2] * scale]),
    };
    surfaces.push(piece);
  }
}
function accessoryFinish(kind: PropKind, solid: number): FurnitureFinish {
  if (['plate', 'bowl', 'mug', 'tumbler'].includes(kind)) return 'porcelain';
  if (['bottle', 'flask', 'beaker', 'wineglass', 'jar', 'petridish', 'spicejar'].includes(kind)) return 'glass';
  if (['paper', 'labels', 'napkins', 'towel', 'sticky'].includes(kind)) return 'paper';
  if (kind === 'box') return solid === 3 ? 'paper' : 'kraft';
  if (['books', 'files', 'notebook', 'openbook'].includes(kind)) return solid % 3 === 2 ? 'paper' : 'book';
  if (['spoon', 'utensils', 'shaker', 'jigger', 'pot', 'microscope'].includes(kind)) return 'metal';
  return 'equipment';
}
