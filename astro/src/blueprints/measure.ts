import { BLUEPRINTS, type Blueprint, type Measure, type Sizing } from './index';

/** Measures a component as it renders, in the browser, against its blueprint: each part's box,
 *  each size's computed value against its token, and each part's sizing, found by giving its
 *  parent two widths (a part that grows with it fills) and its content more text (a part that
 *  grows with that hugs). Pixels are CSS pixels. */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Measured {
  spec: Blueprint;
  /** Each part's box relative to the root, by selector. */
  boxes: Record<string, Box>;
  /** Each size: its value as rendered and its token's value, in px. */
  sizes: { measure: Measure; part: string; token: string; actual: number; expected: number }[];
  sizing: { part: string; name: string; want: Sizing; got: Sizing }[];
  problems: string[];
}

const px = (v: string): number => parseFloat(v) || 0;

function find(root: Element, selector: string): HTMLElement {
  const el = selector ? root.querySelector(selector) : root;
  if (!(el instanceof HTMLElement)) throw new Error(`blueprint: no part ${selector || 'root'}`);
  return el;
}

/** The CSS zoom an element is drawn at (a blueprint view enlarges its specimen with `zoom`). */
export function zoomOf(el: Element): number {
  return 'currentCSSZoom' in el && typeof el.currentCSSZoom === 'number' ? el.currentCSSZoom : 1;
}

/** A token's value in CSS px, read where the part can see it. */
function tokenPx(el: HTMLElement, token: string): number {
  const probe = document.createElement('span');
  probe.style.cssText = `position:absolute;visibility:hidden;display:block;width:var(${token})`;
  el.appendChild(probe);
  const w = probe.getBoundingClientRect().width / zoomOf(probe);
  probe.remove();
  return w;
}

function actual(el: HTMLElement, m: Measure): number {
  const cs = getComputedStyle(el);
  const shadow = [...cs.boxShadow.matchAll(/(-?[\d.]+)px/g)].map((x) => parseFloat(x[1] ?? '0'));
  const values: Record<Measure, number> = {
    'padding-x': px(cs.paddingLeft),
    'padding-y': px(cs.paddingTop),
    gap: px(cs.columnGap),
    'min-height': px(cs.minHeight),
    border: px(cs.borderLeftWidth),
    radius: px(cs.borderTopLeftRadius),
    'edge-x': shadow[0] ?? 0,
    'edge-y': shadow[1] ?? 0,
  };
  return values[m];
}

/** How a part sizes: put a copy of the component in a host off screen, give the part's parent two
 *  widths, then give a slot more text. */
function sizingOf(demo: HTMLElement, selector: string, slot: boolean): Sizing {
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:-10000px;top:0;width:1200px';
  const copy = demo.cloneNode(true);
  if (!(copy instanceof HTMLElement)) return 'fixed';
  host.appendChild(copy);
  document.body.appendChild(host);
  const part = find(copy, selector);
  const parent = selector ? (part.parentElement ?? host) : host;
  const widthAt = (w: number): number => {
    parent.style.width = `${w}px`;
    return part.getBoundingClientRect().width;
  };
  const [a, b] = [widthAt(400), widthAt(700)];
  let got: Sizing = b - a > 200 ? 'fill' : 'hug';
  if (got === 'hug' && slot) {
    parent.style.width = '';
    const before = part.getBoundingClientRect().width;
    part.append(' WWWW');
    if (part.getBoundingClientRect().width - before < 1) got = 'fixed';
  }
  host.remove();
  return got;
}

/** Measures the spec's demo on this page (the specimen in its blueprint view). */
export function measure(id: string): Measured {
  const spec = BLUEPRINTS[id];
  if (!spec) throw new Error(`blueprint: no spec ${id}`);
  const root = document.querySelector(spec.demo);
  if (!(root instanceof HTMLElement)) throw new Error(`blueprint: no ${spec.demo} on this page`);
  return measureEl(spec, root);
}

/** Measures one rendered instance. Boxes are in CSS px, undoing any zoom it is drawn at; set
 *  `sizing` false to skip the sizing test (it copies the component off screen). */
export function measureEl(spec: Blueprint, root: HTMLElement, sizing = true): Measured {
  const r = root.getBoundingClientRect();
  const z = zoomOf(root);
  const boxes: Record<string, Box> = {};
  for (const p of spec.parts) {
    const b = find(root, p.selector).getBoundingClientRect();
    boxes[p.selector] = { x: (b.left - r.left) / z, y: (b.top - r.top) / z, w: b.width / z, h: b.height / z };
  }
  const sizes = spec.sizes.map((s) => {
    const el = find(root, s.part);
    return { ...s, actual: actual(el, s.measure), expected: tokenPx(el, s.token) };
  });
  const sizingResults = spec.parts.map((p) => ({ part: p.selector, name: p.name, want: p.sizing, got: sizing ? sizingOf(root, p.selector, p.slot === true) : p.sizing })); // prettier-ignore
  const problems = [
    ...sizes.filter((s) => Math.abs(s.actual - s.expected) > 0.5).map((s) => `${s.measure} of ${s.part || 'root'} is ${s.actual}px, ${s.token} is ${s.expected}px`), // prettier-ignore
    ...sizingResults.filter((s) => s.want !== s.got).map((s) => `${s.name} should ${s.want} but ${s.got}s`),
  ];
  return { spec, boxes, sizes, sizing: sizingResults, problems };
}
