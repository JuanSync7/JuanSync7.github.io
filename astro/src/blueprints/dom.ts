/** DOM helpers for measuring in any document, the page itself or a same-origin frame. */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
export const px = (v: string): number => parseFloat(v) || 0;

/** The CSS zoom an element is drawn at (a blueprint view enlarges its specimen with `zoom`). */
export function zoomOf(el: Element): number {
  return 'currentCSSZoom' in el && typeof el.currentCSSZoom === 'number' ? el.currentCSSZoom : 1;
}

/** An element of any document: `instanceof HTMLElement` fails across a frame. */
export function isEl(x: unknown): x is HTMLElement {
  return typeof x === 'object' && x !== null && 'style' in x && 'getBoundingClientRect' in x;
}

export function find(root: Element, selector: string): HTMLElement | null {
  const el = selector ? root.querySelector(selector) : root;
  return isEl(el) ? el : null;
}

export const style = (el: HTMLElement): CSSStyleDeclaration =>
  (el.ownerDocument.defaultView ?? window).getComputedStyle(el);

/** A token's value in CSS px, read where the part can see it. */
export function tokenPx(el: HTMLElement, token: string): number {
  const probe = el.ownerDocument.createElement('span');
  probe.style.cssText = `position:absolute;visibility:hidden;display:block;width:var(${token})`;
  // A span renders only in HTML: for a part inside an SVG, read the token on its nearest HTML box.
  let host: Element = el;
  while (host.namespaceURI !== 'http://www.w3.org/1999/xhtml' && host.parentElement) host = host.parentElement;
  host.appendChild(probe);
  const w = probe.getBoundingClientRect().width / zoomOf(probe);
  probe.remove();
  return w;
}

export function rel(el: Element, root: Element): Box {
  const [b, r, z] = [el.getBoundingClientRect(), root.getBoundingClientRect(), zoomOf(root)];
  return { x: (b.left - r.left) / z, y: (b.top - r.top) / z, w: b.width / z, h: b.height / z };
}
