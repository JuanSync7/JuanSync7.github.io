/* page-curl — page swaps on the paper system turn the page like a sheet of a notepad.

   The page you leave lifts from its bottom-right corner. A fold line crosses the page from
   right to left; what is past the fold has lifted, so the next page shows through there, and
   the lifted part lies folded back over the page as its paper back, foreshortened because it
   stands up off the pad. Going back plays the same turn in reverse with the pages swapped, so
   the earlier page lays itself back down.

   The browser's view transition gives two snapshots, ::view-transition-old(root) and
   ::view-transition-new(root). The folded flap is a third layer: an empty fixed element
   (.pp-curl in PaperLayout) named pp-curl only while Astro navigates, whose image pair is
   painted as the paper back. Every frame is computed here, in pixels of the real viewport, and
   handed to the Web Animations API, because a fold at a true angle needs trigonometry that a
   CSS keyframe cannot hold. */

import { isTransitionBeforePreparationEvent, isTransitionBeforeSwapEvent } from 'astro:transitions/client';
import { holdTurn } from './page-turn';

interface Pt {
  x: number;
  y: number;
}

interface Turn {
  ready: Promise<unknown>;
  finished: Promise<unknown>;
}

const FRAMES = 72;

const isTurn = (v: unknown): v is Turn =>
  typeof v === 'object' && v !== null && 'ready' in v && v.ready instanceof Promise && 'finished' in v && v.finished instanceof Promise;

/** Eases in as the corner lifts and out as the page clears, at an even pace between. */
const ease = (t: number): number => 0.5 - Math.cos(Math.PI * t) / 2;

const px = (p: Pt): string => `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`;
const poly = (ps: readonly Pt[]): string => `polygon(${ps.map(px).join(', ')})`;
const at = (p: Pt, d: Pt, s: number): Pt => ({ x: p.x + d.x * s, y: p.y + d.y * s });
const shade = (pct: number): string => `color-mix(in srgb, var(--pp-ink-shadow) ${pct}%, transparent)`;
const gleam = (pct: number): string => `color-mix(in srgb, var(--pp-curl-gleam) ${pct}%, transparent)`;

interface Frame {
  /** The part of the turning page still flat on the pad. */
  keep: string;
  /** The lifted part, in page coordinates, before it is folded over. */
  lifted: string;
  /** Folds the lifted part over the fold line and foreshortens it. */
  fold: string;
  /** Light and shade across the paper back, measured from the fold. */
  back: string;
}

/** The turn at progress p (0 flat, 1 gone) on a w by h page. */
export function curlFrame(p: number, w: number, h: number): Frame {
  // Fold line from its crossing of the bottom edge (b) up to the top edge (a). It starts at
  // the corner leaning well over, and stands nearly upright by the time it leaves the page.
  const b = w - p * (1.2 * w + 0.15 * h);
  const a = b + h * (0.55 - 0.4 * p);
  const len = Math.hypot(a - b, h);
  const u: Pt = { x: (a - b) / len, y: -h / len };
  const n: Pt = { x: -u.y, y: u.x };
  const far = 10 * Math.max(w, h);
  const B: Pt = { x: b, y: h };
  const T: Pt = { x: a, y: 0 };
  const p1 = at(B, u, -far);
  const p2 = at(T, u, far);
  const keep = poly([p1, p2, at(p2, n, -far), at(p1, n, -far)]);
  const lifted = poly([p1, p2, at(p2, n, far), at(p1, n, far)]);

  const k = 0.85 - 0.3 * p;
  const phi = Math.atan2(u.y, u.x);
  const fold = `translate(${b.toFixed(1)}px, ${h}px) rotate(${phi.toFixed(4)}rad) scale(1, ${(-k).toFixed(3)}) rotate(${(-phi).toFixed(4)}rad) translate(${(-b).toFixed(1)}px, ${-h}px)`;

  // A linear gradient's stops are measured along a line through the box centre; place them
  // from where the fold line crosses that line.
  const theta = Math.atan2(n.x, -n.y);
  const span = Math.abs(w * Math.sin(theta)) + Math.abs(h * Math.cos(theta));
  const f0 = (B.x - w / 2) * n.x + (B.y - h / 2) * n.y + span / 2;
  const d = Math.hypot(w, h) * 0.6;
  const s = (frac: number): string => `${(f0 + d * frac).toFixed(1)}px`;
  const angle = `${theta.toFixed(4)}rad`;
  // The paper back is the page's own colour: a crease shadow tight against the fold, then a
  // soft sheen where the paper turns towards the light, and nothing over the rest of the flap.
  const back = [
    `linear-gradient(${angle}, ${gleam(0)} ${s(0.02)}, ${gleam(30)} ${s(0.06)}, ${gleam(0)} ${s(0.22)})`,
    `linear-gradient(${angle}, ${shade(26)} ${s(0)}, ${shade(0)} ${s(0.04)})`,
  ].join(', ');

  return { keep, lifted, fold, back };
}

function duration(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--pp-dur-flip').trim();
  const ms = raw.endsWith('ms') ? parseFloat(raw) : parseFloat(raw) * 1000;
  return Number.isFinite(ms) && ms > 0 ? ms : 1000;
}

function turn(vt: Turn, back: boolean): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const top: Keyframe[] = [];
  const under: Keyframe[] = [];
  const flap: Keyframe[] = [];
  for (let i = 0; i <= FRAMES; i += 1) {
    const e = ease(i / FRAMES);
    const p = back ? 1 - e : e;
    const f = curlFrame(p, w, h);
    top.push({ clipPath: f.keep });
    under.push({ filter: `brightness(${(0.9 + 0.1 * p).toFixed(3)})` });
    flap.push({ clipPath: f.lifted, transform: f.fold, backgroundImage: f.back });
  }
  const ms = duration();
  const root = document.documentElement;
  const running: Animation[] = [];
  const run = (frames: Keyframe[], pseudoElement: string): void => {
    running.push(root.animate(frames, { duration: ms, easing: 'linear', fill: 'both', pseudoElement }));
  };
  vt.ready
    .then(() => {
      run(top, back ? '::view-transition-new(root)' : '::view-transition-old(root)');
      run(under, back ? '::view-transition-old(root)' : '::view-transition-new(root)');
      run(flap, '::view-transition-image-pair(pp-curl)');
    })
    .catch(() => undefined);
  // A filled animation outlives its pseudo-elements and would land on the next turn's; drop
  // them once this turn is over, however it ends.
  vt.finished.finally(() => running.forEach((a) => a.cancel())).catch(() => undefined);
}

const NAMED = '[style*="view-transition-name"]';

const names = (doc: Document): Set<string> =>
  new Set(Array.from(doc.querySelectorAll<HTMLElement>(NAMED), (el) => el.style.viewTransitionName));

/** Only a cover on both pages travels on its own (a post card's cover into its post). Any other
 *  named element would be lifted out of its page and float over the turn, so it loses its name
 *  and turns with the page it belongs to. */
function keepShared(next: Document): void {
  const before = names(document);
  const after = names(next);
  for (const el of document.querySelectorAll<HTMLElement>(NAMED)) {
    if (!after.has(el.style.viewTransitionName)) el.style.viewTransitionName = 'none';
  }
  for (const el of next.querySelectorAll<HTMLElement>(NAMED)) {
    if (!before.has(el.style.viewTransitionName)) el.style.viewTransitionName = 'none';
  }
}

document.addEventListener('astro:before-preparation', (e) => {
  if (!isTransitionBeforePreparationEvent(e)) return;
  const load = e.loader;
  e.loader = async () => {
    await load();
    keepShared(e.newDocument);
  };
});

document.addEventListener('astro:before-swap', (e) => {
  if (!isTransitionBeforeSwapEvent(e) || !('startViewTransition' in document)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const vt: unknown = e.viewTransition;
  if (!isTurn(vt)) return;
  holdTurn(vt.finished);
  turn(vt, e.direction === 'back');
});
