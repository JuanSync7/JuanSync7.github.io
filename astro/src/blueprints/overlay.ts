import type { Drawing, Lettering } from './drawing';
import type { P } from './measure';

/** Renders a blueprint drawing (drawing.ts) as DOM over a live specimen or page: thin lines,
 *  arrowheads, words in the drafting lettering. Styles are in components/design-system/
 *  blueprint-view.css and the --bp-* tokens. `origin` is where the root's top-left sits in the
 *  overlay, in overlay pixels. */

type At = Partial<Record<'left' | 'top' | 'width' | 'height', number>>;

function el(parent: HTMLElement, cls: string, at: At, text?: string): HTMLElement {
  const e = parent.ownerDocument.createElement('div');
  e.className = cls;
  for (const [k, v] of Object.entries(at)) e.style.setProperty(k, `${v}px`);
  if (text) e.textContent = text;
  parent.appendChild(e);
  return e;
}

/** The overlay's lettering, read from its own font size (ISO 3098 type B: a character with its
 *  spacing is 0.56 of the font size wide). */
export function lettering(overlay: HTMLElement): Lettering {
  const fs = parseFloat(getComputedStyle(overlay).fontSize) || 16;
  return { line: fs, char: fs * 0.56 };
}

export function render(overlay: HTMLElement, d: Drawing, origin: P, t: Lettering): void {
  overlay.replaceChildren();
  const [ox, oy] = origin;
  for (const o of d.outlines) el(overlay, `bp-${o.kind}`, { left: ox + o.box.x, top: oy + o.box.y, width: o.box.w, height: o.box.h }); // prettier-ignore
  for (const g of d.tags) {
    if (g.at[1] > g.from[1] + 1) el(overlay, 'bp-leader', { left: ox + g.from[0], top: oy + g.from[1], height: g.at[1] - g.from[1] }); // prettier-ignore
    const label = el(overlay, g.text.length < 3 ? 'bp-balloon' : 'bp-label', { left: ox + g.at[0], top: oy + g.at[1] }, g.text); // prettier-ignore
    label.dataset.side = g.text.length < 3 ? 'centre' : 'below';
  }
  for (const m of d.dims) {
    const vertical = m.side !== 'above';
    const [p, q] = [m.a, m.b];
    const lo = vertical ? Math.min(p[1], q[1]) : Math.min(p[0], q[0]);
    const len = Math.abs(vertical ? q[1] - p[1] : q[0] - p[0]);
    el(overlay, `bp-dim ${vertical ? 'bp-v' : 'bp-h'}${m.out ? ' bp-out' : ''}`, vertical
      ? { left: ox + m.at, top: oy + lo, height: len }
      : { left: ox + lo, top: oy + m.at, width: len }); // prettier-ignore
    for (const e of [p, q]) {
      if (vertical) {
        const [x0, x1] = [Math.min(e[0], m.at), Math.max(e[0], m.at)];
        el(overlay, 'bp-ext bp-h', { left: ox + x0 - (m.side === 'left' ? t.line * 0.3 : 0), top: oy + e[1], width: x1 - x0 + t.line * 0.3 }); // prettier-ignore
      } else {
        el(overlay, 'bp-ext bp-v', { left: ox + e[0], top: oy + m.at - t.line * 0.3, height: e[1] - m.at + t.line * 0.3 }); // prettier-ignore
      }
    }
    const label = el(overlay, 'bp-label', { left: ox + m.mid[0], top: oy + m.mid[1] }, m.label);
    label.dataset.side = vertical ? 'vertical' : 'centre';
  }
  d.notes.forEach((n, i) => {
    el(overlay, 'bp-label', { left: ox + d.bounds.x, top: oy + d.bounds.y + i * t.line * 1.4 }, n).dataset.side =
      'start';
  });
}
