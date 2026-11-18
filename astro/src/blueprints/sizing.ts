import { find, isEl, px, rel, relPseudo, style, zoomOf } from './dom';
import type { Blueprint, Sizing, View } from './types';

/** How a component's part sizes: copy the component into a host off screen, give the part's
 *  parent two widths, then give a slot more text. */
export function sizingOf(root: HTMLElement, selector: string, slot: boolean): Sizing {
  const doc = root.ownerDocument;
  const host = doc.createElement('div');
  host.style.cssText = 'position:absolute;left:-10000px;top:0;width:1200px';
  const copy = root.cloneNode(true);
  if (!isEl(copy)) return 'fixed';
  host.appendChild(copy);
  doc.body.appendChild(host);
  const part = find(copy, selector) ?? copy;
  const parent = selector ? (part.parentElement ?? host) : host;
  const widthAt = (w: number): number => {
    parent.style.width = `${w}px`;
    return part.getBoundingClientRect().width;
  };
  const [a, b] = [widthAt(400), widthAt(700)];
  let got: Sizing = b - a > 200 ? 'fill' : 'hug';
  if (got === 'hug') {
    parent.style.width = '';
    const before = part.getBoundingClientRect().width;
    if (slot) part.append(' WWWW');
    else [part, ...part.querySelectorAll('*')].forEach((e) => e.childNodes.length === 1 && e.firstChild?.nodeType === 3 && e.append(' WWWW')); // prettier-ignore
    if (part.getBoundingClientRect().width - before < 1) got = 'fixed';
  }
  host.remove();
  return got;
}

/** How a template's part sizes, from its width now and at a wider window: one that grows fills, as
 *  does one already at its widest (max-width) or spanning a parent that is; otherwise fixed (or
 *  hug, if the spec says so: a template cannot tell the two apart by width). */
export function templateSizing(
  el: HTMLElement | undefined,
  root: HTMLElement,
  wider: number,
  now: number,
  want: Sizing,
): Sizing {
  // A part already at its widest (max-width) still fills; so does one spanning a parent that
  // spans its own, up to one at its widest.
  const atMax = (e: HTMLElement): boolean => Math.abs(px(style(e).maxWidth) - e.getBoundingClientRect().width / zoomOf(e)) < 1; // prettier-ignore
  const spans = (e: HTMLElement): boolean => {
    const q = e.parentElement;
    if (!q) return false;
    const cs = style(q);
    const inner = q.getBoundingClientRect().width / zoomOf(q) - px(cs.paddingLeft) - px(cs.paddingRight) - px(cs.borderLeftWidth) - px(cs.borderRightWidth); // prettier-ignore
    return Math.abs(inner - e.getBoundingClientRect().width / zoomOf(e)) < 1;
  };
  let capped = el ? atMax(el) : false;
  for (let e = el; !capped && e && e !== root && spans(e); e = e.parentElement ?? undefined)
    capped = e.parentElement ? atMax(e.parentElement) : false;
  const grew = wider - now > 60;
  return grew || capped ? 'fill' : want === 'hug' ? 'hug' : 'fixed';
}

/** Each shown part's width, for a template's second, wider measurement. */
export function widths(doc: Document, spec: Blueprint, view: View): Record<number, number> {
  const root = doc.querySelector(view.root);
  if (!root) return {};
  return Object.fromEntries(
    spec.parts.map((p) => {
      const el = find(root, p.selector);
      return [p.id, el ? (p.pseudo ? relPseudo(el, p.pseudo, root) : rel(el, root)).w : 0];
    }),
  );
}
