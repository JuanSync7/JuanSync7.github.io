import { BLUEPRINTS } from './index';
import { measureEl, zoomOf, type Box, type Measured } from './measure';

/** Draws a component's blueprint over its live specimen on /design-system/ (BlueprintView): slots
 *  dashed and named with how they size, the printed edge, every size dimensioned by the token
 *  that sets it, and the token table filled with what rendered. All of it is DOM, measured from
 *  the specimen, so it redraws with the component: change a token and the drawing follows. */

type P = [number, number];

function el(
  parent: HTMLElement,
  cls: string,
  at: Partial<Record<'left' | 'top' | 'width' | 'height', number>>,
  text?: string,
): HTMLElement {
  const e = document.createElement('div');
  e.className = cls;
  for (const [k, v] of Object.entries(at)) e.style.setProperty(k, `${v}px`);
  if (text) e.textContent = text;
  parent.appendChild(e);
  return e;
}

/** A dimension from a to b (horizontal or vertical), `away` px from the part along the side `n`:
 *  its line with arrowheads, two extension lines and its token, read along the line. */
function dim(o: HTMLElement, a: P, b: P, n: P, away: number, token: string): void {
  const vertical = a[0] === b[0];
  const [x0, x1, y0, y1] = [Math.min(a[0], b[0]), Math.max(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[1], b[1])];
  const [dx, dy] = [n[0] * away, n[1] * away];
  const small = (vertical ? y1 - y0 : x1 - x0) < 24;
  el(o, `bp-dim ${vertical ? 'bp-v' : 'bp-h'}${small ? ' bp-out' : ''}`, vertical
    ? { left: x0 + dx, top: y0, height: y1 - y0 }
    : { left: x0, top: y0 + dy, width: x1 - x0 }); // prettier-ignore
  for (const [x, y] of [a, b]) {
    if (vertical) el(o, 'bp-ext bp-h', { left: Math.min(x, x + dx), top: y, width: Math.abs(dx) + 6 });
    else el(o, 'bp-ext bp-v', { left: x, top: Math.min(y, y + dy), height: Math.abs(dy) + 6 });
  }
  const label = el(o, `bp-label ${vertical ? 'bp-label-v' : ''}`, { left: (x0 + x1) / 2 + dx, top: (y0 + y1) / 2 + dy }, token); // prettier-ignore
  label.dataset.side = vertical ? (n[0] < 0 ? 'left' : 'right') : n[1] < 0 ? 'above' : 'below';
}

/** Draws `m` (measured 1:1 on the probe) over the specimen `root`, in the sheet's own pixels. */
function draw(fig: HTMLElement, m: Measured, root: HTMLElement): void {
  const overlay = fig.querySelector<HTMLElement>('.bp-overlay');
  if (!overlay) return;
  overlay.replaceChildren();
  // The sheet is zoomed by --bp-fit and the specimen by --bp-zoom inside it.
  const fit = zoomOf(overlay);
  const z = zoomOf(root) / fit;
  const [rr, or] = [root.getBoundingClientRect(), overlay.getBoundingClientRect()];
  const [ox, oy] = [(rr.left - or.left) / fit, (rr.top - or.top) / fit];
  const box = (b: Box | undefined): Box => ({ x: ox + (b?.x ?? 0) * z, y: oy + (b?.y ?? 0) * z, w: (b?.w ?? 0) * z, h: (b?.h ?? 0) * z }); // prettier-ignore
  const value = (k: string): number => (m.sizes.find((s) => s.measure === k)?.actual ?? 0) * z;
  const token = (k: string): string => m.sizes.find((s) => s.measure === k)?.token ?? k;
  const F = box(m.boxes['.pa-face'] ?? m.boxes['']);
  const [ex, ey] = [value('edge-x'), value('edge-y')];
  el(overlay, 'bp-edge', { left: F.x + ex, top: F.y + ey, width: F.w, height: F.h });
  m.spec.parts
    .filter((p) => p.slot)
    .forEach((p, i) => {
      const S = box(m.boxes[p.selector]);
      el(overlay, 'bp-slot', { left: S.x, top: S.y, width: S.w, height: S.h });
      el(overlay, 'bp-leader', {
        left: S.x + S.w / 2,
        top: S.y + S.h,
        height: F.y + F.h + ey - S.y - S.h + 18 + i * 22,
      });
      el(overlay, 'bp-label', { left: S.x + S.w / 2, top: F.y + F.h + ey + 18 + i * 22 }, `${p.name} · ${m.sizing.find((s) => s.part === p.selector)?.got ?? p.sizing}`).dataset.side = 'below'; // prettier-ignore
    });
  const L = box(m.boxes['.pa-label']);
  const I = box(m.boxes['.pa-icon']);
  const b = value('border');
  dim(overlay, [F.x + b, F.y], [L.x, F.y], [0, -1], 22, token('padding-x'));
  dim(overlay, [L.x + L.w, F.y], [I.x, F.y], [0, -1], 22, token('gap'));
  dim(overlay, [F.x + F.w, F.y + b], [F.x + F.w, F.y + b + value('padding-y')], [1, 0], 26, token('padding-y'));
  dim(overlay, [F.x, F.y], [F.x, F.y + F.h], [-1, 0], 70, token('min-height'));
  // The printed edge is too small to dimension: a leader note names its two offsets (ISO 129-1).
  const [cx, cy] = [F.x + F.w + ex - 4, F.y + F.h + ey];
  el(overlay, 'bp-leader', { left: cx, top: cy, height: 84 });
  el(overlay, 'bp-label', { left: cx, top: cy + 84 }, `Edge ${token('edge-x')} \u00D7 ${token('edge-y')}`).dataset.side = 'below-end'; // prettier-ignore
  el(overlay, 'bp-label', { left: F.x + F.w * 0.5, top: F.y - 54 }, `Line ${token('border')} · R ${token('radius')}`).dataset.side = 'above'; // prettier-ignore
  for (const s of m.sizes) {
    const cell = fig.querySelector<HTMLElement>(`[data-rendered="${s.token}"]`);
    if (cell) cell.textContent = `${s.actual.toFixed(1)} px${Math.abs(s.actual - s.expected) <= 0.5 ? '' : ` (token ${s.expected.toFixed(1)})`}`; // prettier-ignore
  }
}

/** Scales the sheet down, as one drawing, when it is wider than the stage's column. */
function fit(fig: HTMLElement, stage: HTMLElement, sheet: HTMLElement): void {
  const natural = sheet.getBoundingClientRect().width / zoomOf(sheet);
  const f = Math.min(1, Math.floor((stage.clientWidth / natural) * 100) / 100);
  fig.style.setProperty('--bp-fit', String(f));
}

/** Draws every blueprint view on the page, and again when one changes size. */
export function drawBlueprints(): () => void {
  const views = [...document.querySelectorAll<HTMLElement>('[data-blueprint]')];
  const observers = views.map((fig) => {
    const spec = BLUEPRINTS[fig.dataset.blueprint ?? ''];
    const root = fig.querySelector<HTMLElement>('.bp-zoom > *');
    const stage = fig.querySelector<HTMLElement>('.bp-stage');
    const sheet = fig.querySelector<HTMLElement>('.bp-sheet');
    if (!spec || !root || !stage || !sheet) return undefined;
    const probe = document.createElement('div');
    probe.className = 'bp-probe';
    probe.inert = true;
    probe.setAttribute('aria-hidden', 'true');
    probe.appendChild(root.cloneNode(true));
    fig.appendChild(probe);
    const copy = probe.firstElementChild;
    const redraw = (): void => {
      if (!(copy instanceof HTMLElement)) return;
      fit(fig, stage, sheet);
      draw(fig, measureEl(spec, copy, false), root);
    };
    const ro = new ResizeObserver(redraw);
    ro.observe(fig);
    void document.fonts.ready.then(redraw);
    return ro;
  });
  return () => observers.forEach((o) => o?.disconnect());
}
