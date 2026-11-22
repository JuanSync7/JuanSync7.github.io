import { hexOf } from '../figures/kit/ink';
import { WEIGHT } from '../figures/kit/drawing/scene';
import { notes, sheet, text, titleBlock } from '../figures/kit/drawing/frame';
import { layout, sizeKey, type Drawing } from './drawing';
import type { Box, Measured, P } from './measure';
import { BREAK } from './window';

/** A blueprint on an A3 sheet, for review and for the design system's stored copy: the view drawn
 *  from what rendered at a standard scale, parts outlined (slots dashed) and numbered, every
 *  length dimensioned, notes for lines, radii and the printed edge, the sizes table with each
 *  token's value against what rendered, the parts table and the ISO 7200 title block.
 *  Monochrome, lettered in ISO 3098. Paper millimetres throughout. */

const PX_MM = 25.4 / 96;
const SCALES = [10, 5, 2, 1, 0.5, 0.25, 0.2];
const AREA = { w: 360, h: 150 };
const T = { line: 3.5, char: 2.8 };

function arrows(ctx: CanvasRenderingContext2D, tip: P, ux: number, uy: number, mm: number): void {
  const t = Math.tan((15 * Math.PI) / 180);
  for (const k of [-t, t]) {
    ctx.moveTo(tip[0] * mm, tip[1] * mm);
    ctx.lineTo((tip[0] - 3 * (ux - k * uy)) * mm, (tip[1] - 3 * (uy + k * ux)) * mm);
  }
}

function draw(ctx: CanvasRenderingContext2D, d: Drawing, m: Measured, k: number, o: P, mm: number): void {
  const X = (x: number): number => (o[0] + x) * mm;
  const Y = (y: number): number => (o[1] + y) * mm;
  const rect = (b: Box): void => ctx.strokeRect(X(b.x), Y(b.y), b.w * mm, b.h * mm);
  ctx.strokeStyle = hexOf('ink2');
  ctx.fillStyle = hexOf('ink2');
  // The thing itself: the root and its solid parts thick, slots dashed, the printed edge thin.
  ctx.lineWidth = WEIGHT.thick * mm;
  for (const p of m.spec.parts) {
    const b = m.boxes[p.id];
    if (b && !p.slot) rect({ x: b.x * k, y: b.y * k, w: b.w * k, h: b.h * k });
  }
  // A broken view (R-BP-10): where the page is cut, the band is cleared and closed by two thin
  // zigzag break lines across the root, ISO 128's interrupted view.
  ctx.lineWidth = WEIGHT.thin * mm;
  const root = m.boxes[1];
  for (const y of m.breaks ?? []) {
    if (!root) break;
    const [x0, x1, y0] = [(root.x - 8) * k, (root.x + root.w + 8) * k, y * k];
    ctx.fillStyle = hexOf('ground');
    ctx.fillRect(X(x0), Y(y0), (x1 - x0) * mm, BREAK * k * mm);
    ctx.fillStyle = hexOf('ink2');
    for (const yy of [y0 + BREAK * k * 0.3, y0 + BREAK * k * 0.7]) {
      const n = Math.max(6, Math.round((x1 - x0) / 6));
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const x = x0 + ((x1 - x0) * i) / n;
        const lift = i === Math.floor(n / 2) ? -2 : i === Math.floor(n / 2) + 1 ? 2 : 0;
        ctx[i ? 'lineTo' : 'moveTo'](X(x), Y(yy + lift));
      }
      ctx.stroke();
    }
  }
  for (const ol of d.outlines.filter((x) => x.kind !== 'part')) {
    ctx.setLineDash(ol.kind === 'slot' ? [3 * mm, 1.5 * mm] : []);
    rect(ol.box);
  }
  ctx.setLineDash([]);
  for (const g of d.tags) {
    ctx.beginPath();
    if (g.text.length < 3) {
      ctx.arc(X(g.at[0]), Y(g.at[1]), T.line * 0.75 * mm, 0, 2 * Math.PI);
      ctx.stroke();
      text(ctx, g.text, X(g.at[0]), Y(g.at[1]), 2.5 * mm, 'center');
      continue;
    }
    ctx.moveTo(X(g.from[0]), Y(g.from[1]));
    ctx.lineTo(X(g.at[0]), Y(g.at[1] - 1));
    ctx.stroke();
    text(ctx, g.text.toUpperCase(), X(g.at[0]), Y(g.at[1] + T.line * 0.6), T.line * mm, 'center');
  }
  for (const dm of d.dims) {
    const v = dm.side !== 'above';
    const [a, b]: [P, P] = v
      ? [
          [dm.at, dm.a[1]],
          [dm.at, dm.b[1]],
        ]
      : [
          [dm.a[0], dm.at],
          [dm.b[0], dm.at],
        ];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const [ux, uy] = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    ctx.beginPath();
    for (const [e, l] of [
      [dm.a, a],
      [dm.b, b],
    ] as [P, P][]) {
      const [nx, ny] = [Math.sign(l[0] - e[0]), Math.sign(l[1] - e[1])];
      ctx.moveTo(X(e[0] + nx), Y(e[1] + ny));
      ctx.lineTo(X(l[0] + nx * 2), Y(l[1] + ny * 2));
    }
    const ext = dm.out ? 5 : 0;
    ctx.moveTo(X(a[0] - ux * ext), Y(a[1] - uy * ext));
    ctx.lineTo(X(b[0] + ux * ext), Y(b[1] + uy * ext));
    const at = (q: P): P => [o[0] + q[0], o[1] + q[1]];
    arrows(ctx, at(a), dm.out ? ux : -ux, dm.out ? uy : -uy, mm);
    arrows(ctx, at(b), dm.out ? -ux : ux, dm.out ? -uy : uy, mm);
    ctx.stroke();
    text(ctx, dm.label.toUpperCase(), X(dm.mid[0]), Y(dm.mid[1]), T.line * mm, 'center', v ? -Math.PI / 2 : 0);
  }
  d.notes.forEach((n, i) => text(ctx, n.toUpperCase(), X(d.bounds.x), Y(d.bounds.y + T.line * 0.7 + i * T.line * 1.4), T.line * mm)); // prettier-ignore
}

function tables(ctx: CanvasRenderingContext2D, m: Measured, d: Drawing, mm: number, top: number): void {
  const name = (n: number): string => m.spec.parts.find((p) => p.id === n)?.name ?? `${n}`;
  const ok = (s: Measured['sizes'][number]): string =>
    Math.abs(s.actual - s.expected) > 0.5 ? 'OFF' : s.driven ? 'OK' : 'LITERAL';
  const sizes: string[][] = [
    ['Mark', 'Part', 'Measure', 'Token', 'Token px', 'Rendered', ''],
    ...m.sizes.map((s) => [d.marks[sizeKey(s)] === s.token ? '' : (d.marks[sizeKey(s)] ?? ''), `${s.part} ${name(s.part)}`, s.measure, s.token, s.expected.toFixed(1), s.actual.toFixed(1), ok(s)]), // prettier-ignore
  ];
  const parts: string[][] = [
    ['No.', 'Part', 'Spec', 'Rendered'],
    ...m.sizing.map((z) => [`${z.id}`, z.name, z.want, z.got]),
  ];
  const grid = (data: string[][], widths: number[], x0: number): void =>
    data.forEach((row, r) => {
      let x = x0;
      row.forEach((cell, c) => {
        const w = widths[c] ?? 20;
        ctx.strokeRect(x * mm, (top + r * 5.5) * mm, w * mm, 5.5 * mm);
        text(ctx, cell.toUpperCase(), (x + 1.2) * mm, (top + r * 5.5 + 2.75) * mm, 2.5 * mm);
        x += w;
      });
    });
  grid(sizes, [12, 40, 22, 46, 20, 20, 18], 26);
  grid(parts, [10, 40, 16, 20], 300);
}

/** The sheet for one measured view, as a PNG data URL. */
export function blueprintSheet(m: Measured, width = 2400): string {
  const root = m.boxes[1];
  if (!root) throw new Error(`blueprint: ${m.spec.id} has no root at ${m.view.name}`);
  let scale = SCALES[SCALES.length - 1] ?? 0.2;
  let d = layout(m, PX_MM * scale, T);
  for (const s of SCALES) {
    const t = layout(m, PX_MM * s, T);
    if (t.bounds.w <= AREA.w && t.bounds.h <= AREA.h) [scale, d] = [s, t];
    if (t.bounds.w <= AREA.w && t.bounds.h <= AREA.h) break;
  }
  const s = sheet(width);
  const { ctx, mm } = s;
  const o: P = [(420 + 20 - d.bounds.w) / 2 - d.bounds.x, 18 - d.bounds.y];
  ctx.lineWidth = WEIGHT.thin * mm;
  draw(ctx, d, m, PX_MM * scale, o, mm);
  const view = `${m.view.name === 'desktop' ? 'Front view' : 'Phone view'} (${scale >= 1 ? `${scale}:1` : `1:${1 / scale}`})`;
  const below = o[1] + d.bounds.y + d.bounds.h + 6;
  text(ctx, view.toUpperCase(), (o[0] + (root.w * PX_MM * scale) / 2) * mm, below * mm, 3.5 * mm, 'center');
  ctx.lineWidth = WEIGHT.thin * mm;
  tables(ctx, m, d, mm, Math.min(below + 6, 200));
  const kind = m.spec.kind === 'component' ? 'Component blueprint' : 'Template blueprint';
  titleBlock(ctx, [
    [['Title', m.spec.title, 120], ['Document type', kind, 60]],
    [['Creator', 'Claude', 45], ['Approval person', '-', 45], ['Document status', 'In work', 45], ['Paper', 'A3', 45]],
    [['Legal owner', 'Juan Kok', 50], ['Date of issue', m.spec.drawn, 40], ['Rev', m.spec.revision, 15], ['Sheet', m.view.name === 'desktop' ? '1/2' : '2/2', 20], ['Identification no.', m.spec.number, 55]], // prettier-ignore
  ], mm); // prettier-ignore
  notes(s, [
    m.spec.kind === 'component' ? 'Sizes are named by their tokens; values in the table.' : 'Sizes are lettered; the table gives each one’s token and value.', // prettier-ignore
    `Drawn from the rendered page at ${m.view.width} px wide; 1 CSS px = ${PX_MM.toFixed(4)} mm.`,
    'Slots dashed. Hug wraps its content, fill takes its parent’s room, fixed keeps its size.',
    `Code: ${m.spec.source.map((f) => f.split('/').pop()).join(', ')}.`,
  ]);
  return s.canvas.toDataURL('image/png');
}
