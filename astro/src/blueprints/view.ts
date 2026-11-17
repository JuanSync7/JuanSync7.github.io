import { BLUEPRINTS } from './index';
import { layout, sizeKey, type Drawing } from './drawing';
import { inWindow, measureEl, zoomOf, type Measured } from './measure';
import { lettering, render } from './overlay';
import type { Blueprint, View } from './types';

/** The live blueprint views (BlueprintView.astro): a component's specimen enlarged by
 *  --bp-zoom, or a template's real page in a frame at its window width, with the drawing over it,
 *  the size table filled from what rendered, and the whole sheet scaled down as one drawing when
 *  the column is narrower. Redraws when the column changes size. */

const MARGIN = 12;

function fill(fig: HTMLElement, m: Measured, d: Drawing): void {
  for (const s of m.sizes) {
    const row = fig.querySelector<HTMLElement>(`[data-size="${sizeKey(s)}"]`);
    if (!row) continue;
    const cell = row.querySelector<HTMLElement>('[data-rendered]');
    const mark = row.querySelector<HTMLElement>('[data-mark]');
    if (cell) cell.textContent = `${s.actual.toFixed(1)} px${Math.abs(s.actual - s.expected) <= 0.5 ? '' : ` (token ${s.expected.toFixed(1)})`}`; // prettier-ignore
    if (mark) mark.textContent = d.marks[sizeKey(s)] === s.token ? '' : (d.marks[sizeKey(s)] ?? '');
    row.dataset.state = m.problems.some((p) => p.includes(s.token)) ? 'off' : 'ok';
  }
  const status = fig.querySelector<HTMLElement>('[data-status]');
  if (status) status.textContent = m.problems.length ? m.problems.join(' · ') : 'Matches its spec';
}

/** Draws `m` at scale k with the root's top-left at `at` in the sheet; pads the sheet to hold it
 *  and fits the sheet to the stage. */
function place(fig: HTMLElement, m: Measured, k: number, at: () => [number, number]): void {
  const sheet = fig.querySelector<HTMLElement>('.bp-sheet');
  const stage = fig.querySelector<HTMLElement>('.bp-stage');
  const overlay = fig.querySelector<HTMLElement>('.bp-overlay');
  if (!sheet || !stage || !overlay) return;
  const t = lettering(overlay);
  const d = layout(m, k, t);
  const R = m.boxes[1] ?? { x: 0, y: 0, w: 0, h: 0 };
  const pad = [-d.bounds.y, d.bounds.x + d.bounds.w - R.w * k, d.bounds.y + d.bounds.h - R.h * k, -d.bounds.x];
  sheet.style.padding = pad.map((p) => `${Math.max(0, p) + MARGIN}px`).join(' ');
  const natural = sheet.getBoundingClientRect().width / zoomOf(sheet);
  fig.style.setProperty('--bp-fit', String(Math.min(1, Math.floor((stage.clientWidth / natural) * 100) / 100)));
  render(overlay, d, at(), t);
  fill(fig, m, d);
}

function component(fig: HTMLElement, spec: Blueprint, view: View): () => void {
  const root = fig.querySelector<HTMLElement>('.bp-zoom > *');
  const sheet = fig.querySelector<HTMLElement>('.bp-sheet');
  if (!root || !sheet) return () => undefined;
  const probe = document.createElement('div');
  probe.className = 'bp-probe';
  probe.inert = true;
  probe.appendChild(root.cloneNode(true));
  fig.appendChild(probe);
  const redraw = (): void => {
    const m = measureEl(probe.firstElementChild, spec, view);
    const fit = zoomOf(sheet);
    place(fig, m, zoomOf(root) / fit, () => {
      const [r, s] = [root.getBoundingClientRect(), sheet.getBoundingClientRect()];
      const f = zoomOf(sheet);
      return [(r.left - s.left) / f - sheet.clientLeft, (r.top - s.top) / f - sheet.clientTop];
    });
  };
  return watch(fig, redraw);
}

function template(fig: HTMLElement, spec: Blueprint, view: View): () => void {
  const frame = fig.querySelector<HTMLIFrameElement>('.bp-frame');
  const sheet = fig.querySelector<HTMLElement>('.bp-sheet');
  if (!frame || !sheet) return () => undefined;
  const k = parseFloat(getComputedStyle(fig).getPropertyValue('--bp-page-scale')) || 0.5;
  frame.style.width = `${view.width}px`;
  frame.style.height = `${view.height}px`;
  frame.parentElement?.style.setProperty('width', `${view.width * k}px`);
  frame.parentElement?.style.setProperty('height', `${view.height * k}px`);
  let ready = false;
  const redraw = (): void => {
    const doc = frame.contentDocument;
    const root = doc?.querySelector(view.root);
    if (!ready || !doc || !root) return;
    // A root further down the page (the footer) is scrolled to the top of the frame.
    const below = root.getBoundingClientRect().top;
    if (below > view.height / 2) doc.defaultView?.scrollBy(0, below);
    const m = inWindow(measureEl(root, spec, view));
    const r = root.getBoundingClientRect();
    place(fig, m, k, () => {
      const [f, s] = [frame.getBoundingClientRect(), sheet.getBoundingClientRect()];
      const z = zoomOf(sheet);
      return [(f.left - s.left) / z - sheet.clientLeft + r.left * k, (f.top - s.top) / z - sheet.clientTop + r.top * k]; // prettier-ignore
    });
  };
  frame.addEventListener('load', () => {
    ready = true;
    void frame.contentDocument?.fonts.ready.then(() => setTimeout(redraw, 300));
  });
  frame.src = view.route;
  return watch(fig, redraw);
}

/** Redraws when the figure's width changes. Its height follows the drawing (the fit scales the
 *  sheet, the sheet sets the height), so reacting to height too can feed back on itself: on a slow
 *  runner the fit flips between two values and the figure never holds still. */
function watch(fig: HTMLElement, redraw: () => void): () => void {
  let width = -1;
  const ro = new ResizeObserver((entries) => {
    const w = Math.round(entries[entries.length - 1]?.contentRect.width ?? 0);
    if (w === width) return;
    width = w;
    redraw();
  });
  ro.observe(fig);
  void document.fonts.ready.then(redraw);
  return () => ro.disconnect();
}

/** Starts every blueprint view on the page. */
export function startViews(): () => void {
  const stops = [...document.querySelectorAll<HTMLElement>('[data-blueprint]')].map((fig) => {
    const spec = BLUEPRINTS[fig.dataset.blueprint ?? ''];
    const view = spec?.views.find((v) => v.name === (fig.dataset.view ?? 'desktop'));
    if (!spec || !view) return () => undefined;
    return spec.kind === 'component' ? component(fig, spec, view) : template(fig, spec, view);
  });
  return () => stops.forEach((s) => s());
}
