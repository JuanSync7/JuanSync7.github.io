import { find, isEl, px, rel, relPseudo, style, tokenPx, zoomOf, type Box } from './dom';
import { sizingOf, templateSizing } from './sizing';
import { shownIn, type Blueprint, type Measure, type Sizing, type View } from './types';

export { zoomOf, type Box } from './dom';
export { widths } from './sizing';

/** Measures a component or template as it renders, against its blueprint, in any document (the
 *  page itself or a same-origin frame): each part's box, each size against its token, whether the
 *  token really drives the size, and each part's sizing. Pixels are CSS pixels, relative to the
 *  root, undoing any CSS zoom it is drawn at. */

export type P = [number, number];

const LENGTHS: Measure[] = ['width', 'max-width', 'height', 'min-height', 'inset-left', 'inset-right', 'padding-x', 'padding-y', 'gap']; // prettier-ignore
const NUDGE = 8;

export interface SizeResult {
  measure: Measure;
  part: number;
  token: string;
  /** As rendered, and the token's own value, in px. */
  actual: number;
  expected: number;
  /** The token moves the size: set it 8px larger and the size follows (a literal would not). */
  driven: boolean;
  /** Where it is drawn: a dimension from a to b, or a note at a (b null). */
  a: P;
  b: P | null;
}
export interface Measured {
  spec: Blueprint;
  view: View;
  /** Where the root's top sits in its window, in CSS px (a template's page shows what is above
   *  the window's bottom edge). */
  top: number;
  /** The root's box, then each shown part's box, by part id. */
  boxes: Record<number, Box>;
  sizes: SizeResult[];
  sizing: { id: number; name: string; want: Sizing; got: Sizing }[];
  problems: string[];
}

/** The two boxes a gap separates: the named parts, or the part's first two shown children. */
function gapEnds(
  el: HTMLElement,
  root: Element,
  ends: [HTMLElement | null, HTMLElement | null] | null,
): [Box, Box] | null {
  const kids = [...el.children].filter(isEl).filter((c) => c.getBoundingClientRect().width > 0);
  const [a, b] = ends ?? [kids[0], kids[1]];
  return a && b ? [rel(a, root), rel(b, root)] : null;
}

/** The size as rendered, and where it is drawn. */
function read(
  m: Measure,
  el: HTMLElement,
  root: Element,
  ends: [HTMLElement | null, HTMLElement | null] | null,
  pseudo?: string,
): { v: number; a: P; b: P | null } {
  const cs = style(el, pseudo);
  const B = pseudo ? relPseudo(el, pseudo, root) : rel(el, root);
  const W = root.getBoundingClientRect().width / zoomOf(root);
  const [bl, bt] = [px(cs.borderLeftWidth), px(cs.borderTopWidth)];
  const right: P = [B.x + B.w, B.y];
  switch (m) {
    case 'width':
      return { v: B.w, a: [B.x, B.y], b: right };
    case 'inset-left':
      return { v: B.x, a: [0, B.y], b: [B.x, B.y] };
    case 'inset-right':
      return { v: W - B.x - B.w, a: [B.x + B.w, B.y], b: [W, B.y] };
    case 'max-width':
      return { v: px(cs.maxWidth), a: [B.x, B.y], b: right };
    case 'height':
      return { v: B.h, a: [B.x, B.y], b: [B.x, B.y + B.h] };
    case 'min-height':
      return { v: px(cs.minHeight), a: [B.x, B.y], b: [B.x, B.y + B.h] };
    case 'padding-x':
      return { v: px(cs.paddingLeft), a: [B.x + bl, B.y], b: [B.x + bl + px(cs.paddingLeft), B.y] };
    case 'padding-y':
      return { v: px(cs.paddingTop), a: [B.x + B.w, B.y + bt], b: [B.x + B.w, B.y + bt + px(cs.paddingTop)] };
    case 'gap': {
      const g = gapEnds(el, root, ends);
      if (!g) return { v: NaN, a: [B.x, B.y], b: null };
      const [p, q] = g;
      if (q.x >= p.x + p.w - 1) return { v: q.x - p.x - p.w, a: [p.x + p.w, B.y], b: [q.x, B.y] };
      return { v: q.y - p.y - p.h, a: [B.x, p.y + p.h], b: [B.x, q.y] };
    }
    case 'border':
      return { v: Math.max(bl, bt, px(cs.borderRightWidth), px(cs.borderBottomWidth)), a: right, b: null };
    case 'radius':
      return { v: px(cs.borderTopLeftRadius), a: [B.x, B.y], b: null };
    case 'font-size':
      return { v: px(cs.fontSize), a: [B.x, B.y + B.h / 2], b: null };
    case 'edge-x':
    case 'edge-y': {
      const shadow = [...cs.boxShadow.matchAll(/(-?[\d.]+)px/g)].map((x) => parseFloat(x[1] ?? '0'));
      return { v: (m === 'edge-x' ? shadow[0] : shadow[1]) ?? 0, a: [B.x + B.w, B.y + B.h], b: null };
    }
  }
}

/** Sets the token NUDGE px larger on the part and every element above it, reads the size again,
 *  and puts everything back. A size set by a literal does not move. */
function drives(
  s: { measure: Measure; token: string },
  el: HTMLElement,
  root: Element,
  ends: [HTMLElement | null, HTMLElement | null] | null,
  before: number,
  expected: number,
  pseudo?: string,
): boolean {
  if (!LENGTHS.includes(s.measure) && s.measure !== 'radius' && s.measure !== 'border' && s.measure !== 'font-size')
    return true; // the printed edge is a shadow offset pair, checked by value
  const chain: HTMLElement[] = [];
  for (let e: HTMLElement | null = el; e; e = e.parentElement) chain.push(e);
  const prior = chain.map((e) => e.style.getPropertyValue(s.token));
  chain.forEach((e) => e.style.setProperty(s.token, `${expected + NUDGE}px`));
  const after = read(s.measure, el, root, ends, pseudo).v;
  chain.forEach((e, i) => (prior[i] ? e.style.setProperty(s.token, prior[i] ?? '') : e.style.removeProperty(s.token)));
  return Math.abs(after - before) >= NUDGE / 2;
}

/** How a template's parts size: `wider` holds each part's width at a wider window (the harness
 *  measures twice). A part that grows with the window fills; one that does not is fixed (or hugs,
 *  if the spec says so: a template cannot tell the two apart by width). */
export type Sizer = 'clone' | Record<number, number> | false;

export function measureIn(doc: Document, spec: Blueprint, view: View, sizer: Sizer = false): Measured {
  return measureEl(doc.querySelector(view.root), spec, view, sizer);
}

/** Measures one rendered instance (e.g. a 1:1 copy beside a zoomed specimen). */
export function measureEl(root: Element | null, spec: Blueprint, view: View, sizer: Sizer = false): Measured {
  if (!isEl(root)) return measureRoot(null, spec, view, sizer);
  // A tilt or a hover lift is decoration: measure the thing upright, then put it back.
  const transform = root.style.transform;
  root.style.transform = 'none';
  const m = measureRoot(root, spec, view, sizer);
  root.style.transform = transform;
  return m;
}

function measureRoot(root: HTMLElement | null, spec: Blueprint, view: View, sizer: Sizer): Measured {
  const problems: string[] = [];
  if (!root) return { spec, view, top: 0, boxes: {}, sizes: [], sizing: [], problems: [`no ${view.root} on ${view.route}`] }; // prettier-ignore
  const shown = spec.parts.filter((p) => shownIn(p, view.name));
  const els = new Map<number, HTMLElement>();
  const boxes: Record<number, Box> = {};
  for (const p of shown) {
    const el = find(root, p.selector);
    const box = el && (p.pseudo ? relPseudo(el, p.pseudo, root) : rel(el, root));
    if (!el || !box || box.w === 0) {
      problems.push(`${p.name} (${p.id}) is not on the page at ${view.name}`);
      continue;
    }
    els.set(p.id, el);
    boxes[p.id] = box;
  }
  const sizes: SizeResult[] = [];
  for (const s of spec.sizes.filter((x) => shownIn(x, view.name))) {
    const el = els.get(s.part);
    if (!el) continue;
    const ends: [HTMLElement | null, HTMLElement | null] | null = s.between ? [els.get(s.between[0]) ?? null, els.get(s.between[1]) ?? null] : null; // prettier-ignore
    const pseudo = spec.parts.find((p) => p.id === s.part)?.pseudo;
    const r = read(s.measure, el, root, ends, pseudo);
    const expected = tokenPx(el, s.token);
    const driven = drives(s, el, root, ends, r.v, expected, pseudo);
    sizes.push({ ...s, actual: r.v, expected, driven, a: r.a, b: r.b });
    const where = `${s.measure} of ${spec.parts.find((p) => p.id === s.part)?.name ?? s.part}`;
    if (!(Math.abs(r.v - expected) <= 0.5))
      problems.push(`${where} is ${r.v.toFixed(1)}px, ${s.token} is ${expected.toFixed(1)}px`); // prettier-ignore
    else if (!driven) problems.push(`${where} matches ${s.token} but does not follow it: a literal sets it`);
  }
  const sizing = shown.map((p) => {
    const want: Sizing = view.name === 'phone' && p.phone ? p.phone : p.sizing;
    let got: Sizing = want;
    if (sizer === 'clone') got = sizingOf(root, p.selector, p.slot === true);
    else if (sizer)
      got = templateSizing(p.pseudo ? undefined : els.get(p.id), root, sizer[p.id] ?? 0, boxes[p.id]?.w ?? 0, want);
    return { id: p.id, name: p.name, want, got };
  });
  for (const z of sizing) if (z.want !== z.got) problems.push(`${z.name} (${z.id}) should ${z.want} but ${z.got}s`);
  return { spec, view, top: root.getBoundingClientRect().top / zoomOf(root), boxes, sizes, sizing, problems };
}

/** A template drawn one window tall from its root's top (a long page shows its first screen):
 *  boxes cut there, sizes below it dropped. */
export function inWindow(m: Measured): Measured {
  if (m.spec.kind === 'component') return m;
  const h = m.view.height - Math.max(0, Math.min(m.top, m.view.height / 2));
  const boxes: Record<number, Box> = {};
  for (const [id, b] of Object.entries(m.boxes)) if (b.y < h) boxes[Number(id)] = { ...b, h: Math.min(b.h, h - b.y) };
  return { ...m, boxes, sizes: m.sizes.filter((x) => x.a[1] < h) };
}
