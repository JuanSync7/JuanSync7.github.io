import { hexOf } from '../figures/kit/ink';
import { WEIGHT } from '../figures/kit/legodraft';
import { notes, sheet, text, titleBlock } from '../figures/kit/sheetframe';
import { measure, type Box, type Measured } from './measure';

/** A component's blueprint on an A3 sheet, for review (`npm run blueprint -- <id>`): its front
 *  view drawn from the component as it renders, enlarged to a standard scale; slots dashed and
 *  named with how they size; every size dimensioned by the token that sets it; a table of the
 *  tokens' values against what rendered; and the ISO 7200 title block. Monochrome, lettered in
 *  ISO 3098. Paper millimetres throughout. */

type P = [number, number];
const PX_MM = 25.4 / 96;
const SCALES = [10, 5, 2, 1];

/** A dimension from a to b, `out` along the unit normal away from the part; arrows go outside
 *  when the line is too short to hold them (ISO 129-1). Returns where its words go. */
function dim(ctx: CanvasRenderingContext2D, a: P, b: P, n: P, away: number, mm: number): P {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const [ux, uy] = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  const at = (p: P, k: number): P => [p[0] + n[0] * k, p[1] + n[1] * k];
  const [la, lb] = [at(a, away), at(b, away)];
  const seg = (p: P, q: P): void => {
    ctx.moveTo(p[0] * mm, p[1] * mm);
    ctx.lineTo(q[0] * mm, q[1] * mm);
  };
  ctx.beginPath();
  seg(at(a, 1), at(a, away + 2));
  seg(at(b, 1), at(b, away + 2));
  const inside = len > 8;
  const [s0, s1]: [P, P] = inside
    ? [la, lb]
    : [
        [la[0] - ux * 5, la[1] - uy * 5],
        [lb[0] + ux * 5, lb[1] + uy * 5],
      ];
  seg(s0, s1);
  const t = Math.tan((15 * Math.PI) / 180);
  for (const [tip, d] of [
    [la, inside ? -1 : 1],
    [lb, inside ? 1 : -1],
  ] as [P, number][]) {
    const [dx, dy] = [ux * d, uy * d];
    for (const k of [-t, t]) seg(tip, [tip[0] - 3 * (dx - k * dy), tip[1] - 3 * (dy + k * dx)]);
  }
  ctx.stroke();
  return at([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], away + 3);
}

function roundRect(ctx: CanvasRenderingContext2D, b: Box, r: number, mm: number): void {
  ctx.beginPath();
  ctx.roundRect(b.x * mm, b.y * mm, b.w * mm, b.h * mm, r * mm);
}

export function blueprintSheet(id: string, width = 2400): string {
  const m: Measured = measure(id);
  const s = sheet(width);
  const { ctx, mm } = s;
  const root = m.boxes[''];
  const face = m.boxes['.pa-face'] ?? root;
  if (!root || !face) throw new Error('blueprint: no root box');
  const value = (k: string): number => m.sizes.find((x) => x.measure === k)?.actual ?? 0;
  const scale = SCALES.find((n) => root.w * PX_MM * n <= 330) ?? 1;
  const k = PX_MM * scale;
  const [ox, oy] = [51, 64];
  const box = (b: Box): Box => ({ x: ox + b.x * k, y: oy + b.y * k, w: b.w * k, h: b.h * k });
  const F = box(face);
  const [ex, ey, r] = [value('edge-x') * k, value('edge-y') * k, value('radius') * k];
  ctx.strokeStyle = hexOf('ink2');
  // The printed edge, then the face over it.
  ctx.lineWidth = WEIGHT.thin * mm;
  roundRect(ctx, { ...F, x: F.x + ex, y: F.y + ey }, r, mm);
  ctx.stroke();
  ctx.fillStyle = hexOf('ground');
  roundRect(ctx, F, r, mm);
  ctx.fill();
  ctx.lineWidth = WEIGHT.thick * mm;
  ctx.stroke();
  // Slots: dashed, named below the face with how they size.
  ctx.lineWidth = WEIGHT.thin * mm;
  ctx.fillStyle = hexOf('ink2');
  const slots = m.spec.parts.filter((p) => p.slot);
  slots.forEach((p, i) => {
    const b = m.boxes[p.selector];
    if (!b) return;
    const S = box(b);
    ctx.setLineDash([3 * mm, 1.5 * mm]);
    ctx.strokeRect(S.x * mm, S.y * mm, S.w * mm, S.h * mm);
    ctx.setLineDash([]);
    const [lx, ly] = [S.x + S.w / 2, F.y + F.h + ey + 12 + i * 8];
    ctx.beginPath();
    ctx.moveTo(lx * mm, (S.y + S.h) * mm);
    ctx.lineTo(lx * mm, (ly - 3) * mm);
    ctx.stroke();
    const sizing = m.sizing.find((z) => z.part === p.selector)?.got ?? p.sizing;
    text(ctx, `${p.name} · ${sizing}`.toUpperCase(), lx * mm, ly * mm, 3.5 * mm, 'center');
  });
  const named = m.spec.parts.filter((p) => !p.slot).map((p) => `${p.name} · ${p.sizing}`.toUpperCase());
  text(ctx, named.join('   '), F.x * mm, (F.y - 32) * mm, 3.5 * mm);
  // Dimensions, each named by its token.
  const label = (t: string, at: P, angle = 0): void => text(ctx, t.toUpperCase(), at[0] * mm, at[1] * mm, 3.5 * mm, 'center', angle); // prettier-ignore
  const token = (k2: string): string => m.sizes.find((x) => x.measure === k2)?.token ?? k2;
  const L = m.boxes['.pa-label'] ? box(m.boxes['.pa-label']) : undefined;
  const I = m.boxes['.pa-icon'] ? box(m.boxes['.pa-icon']) : undefined;
  const b = value('border') * k;
  if (L) label(token('padding-x'), dim(ctx, [F.x + b, F.y], [L.x, F.y], [0, -1], 10, mm));
  if (L && I) label(token('gap'), dim(ctx, [L.x + L.w, F.y], [I.x, F.y], [0, -1], 18, mm));
  const py = value('padding-y') * k;
  label(token('padding-y'), dim(ctx, [F.x, F.y + b + py], [F.x, F.y + b], [-1, 0], 10, mm), -Math.PI / 2);
  label(token('min-height'), dim(ctx, [F.x, F.y + F.h], [F.x, F.y], [-1, 0], 24, mm), -Math.PI / 2);
  const [rx, by] = [F.x + F.w, F.y + F.h];
  label(token('edge-x'), dim(ctx, [rx, by + ey], [rx + ex, by + ey], [0, 1], 10, mm));
  label(token('edge-y'), dim(ctx, [rx + ex, by], [rx + ex, by + ey], [1, 0], 14, mm), -Math.PI / 2);
  // Leaders for the line width and the corner radius.
  const leader = (from: P, to: P, t: string): void => {
    ctx.beginPath();
    ctx.arc(from[0] * mm, from[1] * mm, 0.6 * mm, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(from[0] * mm, from[1] * mm);
    ctx.lineTo(to[0] * mm, to[1] * mm);
    ctx.lineTo((to[0] + 4) * mm, to[1] * mm);
    ctx.stroke();
    text(ctx, t.toUpperCase(), (to[0] + 5) * mm, to[1] * mm, 3.5 * mm);
  };
  leader([F.x + F.w * 0.45, F.y], [F.x + F.w * 0.5, F.y - 16], `Line ${token('border')}`);
  leader([F.x + r * 0.3, F.y + r * 0.3], [F.x - 20, F.y - 24], `R ${token('radius')}`);
  const below = by + ey + 12 + slots.length * 8 + 6;
  text(ctx, `FRONT VIEW (${scale}:1)`, (F.x + F.w / 2) * mm, below * mm, 3.5 * mm, 'center');
  tables(ctx, m, mm, below + 14);
  titleBlock(ctx, [
    [['Title', m.spec.title, 120], ['Document type', 'Component blueprint', 60]],
    [['Creator', 'Claude', 45], ['Approval person', '-', 45], ['Document status', 'In work', 45], ['Paper', 'A3', 45]],
    [['Legal owner', 'Juan Kok', 50], ['Date of issue', m.spec.drawn, 40], ['Rev', m.spec.revision, 15], ['Sheet', '1/1', 20], ['Identification no.', m.spec.number, 55]], // prettier-ignore
  ], mm); // prettier-ignore
  notes(s, [
    'Sizes are design tokens, named on their lines. Their values are in the table.',
    `Drawn from the rendered component, 1 CSS px = ${PX_MM.toFixed(4)} mm, at ${scale}:1.`,
    'Slots dashed. Hug wraps its content, fill takes its parent’s room, fixed keeps its size.',
    `Code: ${m.spec.source.map((f) => f.split('/').pop()).join(', ')}.`,
  ]);
  return s.canvas.toDataURL('image/png');
}

/** The tokens against what rendered, and each part's sizing against the spec. */
function tables(ctx: CanvasRenderingContext2D, m: Measured, mm: number, top: number): void {
  const rows: string[][] = [
    ['Token', 'Sets', 'Token px', 'Rendered px', ''],
    ...m.sizes.map((x) => [x.token, x.measure, x.expected.toFixed(1), x.actual.toFixed(1), Math.abs(x.actual - x.expected) <= 0.5 ? 'OK' : 'OFF']), // prettier-ignore
  ];
  const parts: string[][] = [['Part', 'Spec', 'Rendered', ''], ...m.sizing.map((z) => [z.name, z.want, z.got, z.want === z.got ? 'OK' : 'OFF'])]; // prettier-ignore
  const draw = (data: string[][], widths: number[], x0: number, y0: number): void =>
    data.forEach((row, r) => {
      let x = x0;
      row.forEach((cell, c) => {
        const w = widths[c] ?? 20;
        ctx.strokeRect(x * mm, (y0 + r * 6) * mm, w * mm, 6 * mm);
        text(ctx, cell.toUpperCase(), (x + 1.5) * mm, (y0 + r * 6 + 3) * mm, 2.5 * mm);
        x += w;
      });
    });
  draw(rows, [42, 24, 20, 24, 12], 30, top);
  draw(parts, [32, 20, 24, 12], 170, top);
}
