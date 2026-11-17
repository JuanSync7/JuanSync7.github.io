import type { Box, Measured, P } from './measure';

/** Lays out a blueprint's drawing from what was measured, for any renderer (the DOM overlay on a
 *  page, the A3 sheet on a canvas): outlines, part labels, dimensions in lanes clear of each
 *  other, and leader notes. Coordinates are output units with the root's top-left at 0,0; the
 *  renderer gives the scale and its lettering's size. Nothing here knows a component by name. */

export type Side = 'above' | 'left' | 'right';
export interface Dim {
  a: P;
  b: P;
  side: Side;
  /** The dimension line's y (above) or x (left, right). */
  at: number;
  /** Arrows outside: the line is too short to hold them (ISO 129-1). */
  out: boolean;
  label: string;
  /** Where the label's centre sits. */
  mid: P;
}
export interface Tag {
  id: number;
  text: string;
  /** The part's anchor, and where the words go (a leader joins them when they differ). */
  from: P;
  at: P;
  align: 'start' | 'centre' | 'end';
}
export interface Outline {
  box: Box;
  kind: 'slot' | 'part' | 'edge';
}
export interface Drawing {
  outlines: Outline[];
  dims: Dim[];
  tags: Tag[];
  notes: string[];
  /** Everything drawn, so the renderer can leave room for it. */
  bounds: Box;
  /** Each size's mark: the token on components, a letter on templates (read with the table). */
  marks: Record<string, string>;
}

export interface Lettering {
  /** Height of a line of words, and the width of one character, in output units. */
  line: number;
  char: number;
}

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const NOTES = new Set(['border', 'radius', 'edge-x', 'edge-y', 'font-size']);
const NOTE_WORD: Record<string, string> = {
  border: 'Line',
  radius: 'R',
  'font-size': 'Type',
  'edge-x': 'Edge',
  'edge-y': 'Edge',
};

export const sizeKey = (s: { measure: string; part: number; between?: [number, number] }): string =>
  `${s.part}:${s.measure}${s.between ? `:${s.between.join('-')}` : ''}`;

export function layout(m: Measured, k: number, t: Lettering): Drawing {
  const { spec } = m;
  const root = m.boxes[1] ?? { x: 0, y: 0, w: 0, h: 0 };
  const sc = (p: P): P => [p[0] * k, p[1] * k];
  const box = (b: Box): Box => ({ x: b.x * k, y: b.y * k, w: b.w * k, h: b.h * k });
  const R = box(root);
  const component = spec.kind === 'component';
  const marks: Record<string, string> = {};
  m.sizes.forEach((s, i) => (marks[sizeKey(s)] = component ? s.token : (LETTERS[i] ?? `${i}`)));
  const outlines: Outline[] = [];
  const tags: Tag[] = [];
  // A printed edge: the face's outline again, offset.
  for (const p of spec.parts) {
    const ex = m.sizes.find((s) => s.part === p.id && s.measure === 'edge-x')?.actual;
    const ey = m.sizes.find((s) => s.part === p.id && s.measure === 'edge-y')?.actual;
    const b = m.boxes[p.id];
    if (b && ex !== undefined && ey !== undefined) outlines.push({ box: box({ ...b, x: b.x + ex, y: b.y + ey }), kind: 'edge' }); // prettier-ignore
  }
  // Parts: on a component, slots dashed and named below on leaders; on a template, every part
  // outlined with its balloon number in its corner.
  const below = Math.max(R.y + R.h, ...outlines.map((o) => o.box.y + o.box.h)) + t.line * 1.6;
  const named = spec.parts.filter((p) => m.boxes[p.id] && p.id !== 1 && (!component || p.slot));
  named.forEach((p, i) => {
    const b = m.boxes[p.id];
    if (!b) return;
    const B = box(b);
    outlines.push({ box: B, kind: component ? 'slot' : 'part' });
    const sizing = m.sizing.find((z) => z.id === p.id)?.got ?? p.sizing;
    if (component) {
      const x = B.x + B.w / 2;
      tags.push({ id: p.id, text: `${p.id} ${p.name} · ${sizing}`, from: [x, B.y + B.h], at: [x, below + i * t.line * 1.4], align: 'centre' }); // prettier-ignore
    } else tags.push({ id: p.id, text: `${p.id}`, from: [B.x, B.y], at: [B.x + t.line * 0.9, B.y + t.line * 0.9], align: 'centre' }); // prettier-ignore
  });
  // Balloons that would sit on one another move along.
  tags.forEach((tag, i) => {
    while (
      !component &&
      tags.slice(0, i).some((o) => Math.hypot(o.at[0] - tag.at[0], o.at[1] - tag.at[1]) < t.line * 1.6)
    )
      tag.at = [tag.at[0] + t.line * 1.8, tag.at[1]];
  });
  // Dimensions, in lanes: a lane takes a dimension when its line and words clear every other.
  const lanes: Record<Side, [number, number][][]> = { above: [], left: [], right: [] };
  const step = t.line * 2.2;
  const dims: Dim[] = [];
  for (const s of m.sizes) {
    if (NOTES.has(s.measure) || !s.b || !(s.actual > 0)) continue;
    const [a, b] = [sc(s.a), sc(s.b)];
    const vertical = Math.abs(a[0] - b[0]) < 0.01;
    const side: Side = !vertical ? 'above' : a[0] > R.x + R.w / 2 ? 'right' : 'left';
    const label = marks[sizeKey(s)] ?? '';
    const span = vertical ? [Math.min(a[1], b[1]), Math.max(a[1], b[1])] : [Math.min(a[0], b[0]), Math.max(a[0], b[0])];
    const c = ((span[0] ?? 0) + (span[1] ?? 0)) / 2;
    const half = Math.max(((span[1] ?? 0) - (span[0] ?? 0)) / 2 + t.char * 2, (label.length * t.char) / 2 + t.char);
    const want: [number, number] = [c - half, c + half];
    let lane = lanes[side].findIndex((l) => l.every(([p, q]) => want[1] < p || want[0] > q));
    if (lane < 0) lane = lanes[side].push([]) - 1;
    lanes[side][lane]?.push(want);
    const off = t.line * 1.4 + lane * step;
    const at = side === 'above' ? R.y - off : side === 'left' ? R.x - off : R.x + R.w + off;
    const short = (span[1] ?? 0) - (span[0] ?? 0) < t.line * 1.5;
    const mid: P =
      side === 'above' ? [c, at - t.line * 0.9] : [side === 'left' ? at - t.line * 0.9 : at + t.line * 0.9, c];
    dims.push({ a, b, side, at, out: short, label, mid });
  }
  // Notes: what has no length to dimension (lines, radii, the printed edge, type) is written out.
  const notes: string[] = [];
  for (const p of spec.parts) {
    const here = m.sizes.filter((s) => s.part === p.id && NOTES.has(s.measure) && s.measure !== 'edge-y');
    if (!here.length) continue;
    const words = here.map((s) => {
      const tok = component ? s.token : (marks[sizeKey(s)] ?? '');
      if (s.measure !== 'edge-x') return `${NOTE_WORD[s.measure]} ${tok}`;
      const y = m.sizes.find((z) => z.part === p.id && z.measure === 'edge-y');
      return `Edge ${tok} × ${component ? (y?.token ?? '') : y ? (marks[sizeKey(y)] ?? '') : ''}`;
    });
    notes.push(`${p.id} ${p.name}: ${words.join(' · ')}`);
  }
  const xs = [R.x, R.x + R.w, ...dims.map((d) => d.at - (d.side === 'left' ? t.line * 1.4 : 0)), ...dims.map((d) => d.at + (d.side === 'right' ? t.line * 1.4 : 0))]; // prettier-ignore
  const labelEdges = dims.filter((d) => d.side === 'above').flatMap((d) => [d.mid[0] - (d.label.length * t.char) / 2, d.mid[0] + (d.label.length * t.char) / 2]); // prettier-ignore
  const tagEdges = tags.flatMap((g) => [
    g.at[0] - (g.text.length * t.char) / 2,
    g.at[0] + (g.text.length * t.char) / 2,
  ]);
  const noteW = Math.max(0, ...notes.map((n) => n.length * t.char));
  const top = Math.min(R.y, ...dims.filter((d) => d.side === 'above').map((d) => d.at - t.line * 1.4)) - (notes.length ? notes.length * t.line * 1.4 + t.line : 0); // prettier-ignore
  const bottom = Math.max(R.y + R.h, ...tags.map((g) => g.at[1] + t.line), ...outlines.map((o) => o.box.y + o.box.h)); // prettier-ignore
  const left = Math.min(...xs, ...labelEdges, ...tagEdges, R.x);
  const right = Math.max(...xs, ...labelEdges, ...tagEdges, R.x + noteW, ...outlines.map((o) => o.box.x + o.box.w));
  return { outlines, dims, tags, notes, bounds: { x: left, y: top, w: right - left, h: bottom - top }, marks };
}
