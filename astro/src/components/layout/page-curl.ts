/* page-curl — page swaps on the paper system turn the page like a sheet of a notepad.

   The page you leave lifts from its bottom-right corner, its paper back folds over it, and the
   next page shows behind the fold. Going back plays the turn in reverse, so the earlier page
   lays itself back down. The geometry is curl-kernel.ts; this file is the browser glue and the
   order things happen in. Playbook and rules: .claude/skills/page-turn/.

   Four layers of the view transition, all moved by transforms only, so the turn runs on the
   compositor and never repaints, even while the main thread is busy:
     root      the turning page (old page forward, new page back), clipped at the fold by its
               group's overflow (keepBox) and held still inside it (keepPage);
     pp-under  the page underneath: that document's .pp-page, named for this turn only;
     pp-curl   the paper back: an empty fixed element (.pp-curl in PaperLayout) whose group is
               the folded page (flapFold) and whose image pair is the paper (flapSheet);
     shared    a post card's cover that is on both pages, travelling on top.

   Order of a turn (PT-9..PT-13):
     before-preparation  after the next page loads: keep only shared names, name pp-under,
                         set data-astro-pp-turn (the CSS for every layer keys on it);
     after-swap          size the boxes, finish the new page's entrance animations: arriving
                         by a turn, the turn is the entrance;
     ready               start every layer in one task, so they share a start time;
     finished            drop the animations, the name and the token if this turn is still the
                         latest; figures (afterTurn) and a waiting theme toggle start now. */

import { isTransitionBeforePreparationEvent, isTransitionBeforeSwapEvent } from 'astro:transitions/client';
import { boxes, timeline, type Layer } from './curl-kernel';
import { holdTurn } from './page-turn';

interface Turn {
  ready: Promise<unknown>;
  finished: Promise<unknown>;
  skipTransition: () => void;
}

export const TOKEN = 'data-astro-pp-turn';
const UNDER = 'pp-under';
const NAMED = '[style*="view-transition-name"]';
const LAYERS: readonly [Layer, string][] = [
  ['keepBox', '::view-transition-group(root)'],
  ['keepPage', '::view-transition-image-pair(root)'],
  ['flapFold', '::view-transition-group(pp-curl)'],
  ['flapSheet', '::view-transition-image-pair(pp-curl)'],
];

/** The latest turn; a turn cleans up after itself only while it is still the latest, so an
 *  earlier one that ends late never strips a later one's token or name. */
let generation = 0;

const isTurn = (v: unknown): v is Turn =>
  typeof v === 'object' &&
  v !== null &&
  'ready' in v &&
  v.ready instanceof Promise &&
  'finished' in v &&
  v.finished instanceof Promise &&
  'skipTransition' in v &&
  typeof v.skipTransition === 'function';

const reduced = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const turning = (): boolean => 'startViewTransition' in document && !reduced();
const page = (doc: Document): HTMLElement | null => doc.querySelector<HTMLElement>('.pp-page');
const nameOf = (el: HTMLElement): string => el.style.getPropertyValue('view-transition-name');
const rename = (el: HTMLElement, name: string): void => el.style.setProperty('view-transition-name', name);

function duration(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--pp-dur-flip').trim();
  const ms = raw.endsWith('ms') ? parseFloat(raw) : parseFloat(raw) * 1000;
  return Number.isFinite(ms) && ms > 0 ? ms : 1100;
}

const names = (doc: Document): Set<string> =>
  new Set(Array.from(doc.querySelectorAll<HTMLElement>(NAMED), (el) => nameOf(el)));

/** Only a cover on both pages travels on its own (a post card's cover into its post). Any other
 *  named element would be lifted out of its page and float over the turn, so it loses its name
 *  and turns with the page it belongs to. */
function keepShared(next: Document): void {
  const before = names(document);
  const after = names(next);
  for (const el of document.querySelectorAll<HTMLElement>(NAMED)) {
    if (!after.has(nameOf(el))) rename(el, 'none');
  }
  for (const el of next.querySelectorAll<HTMLElement>(NAMED)) {
    if (!before.has(nameOf(el))) rename(el, 'none');
  }
}

function unnameUnder(): void {
  const el = page(document);
  if (el && nameOf(el) === UNDER) el.style.removeProperty('view-transition-name');
}

/** Arriving by a turn, the turn is the entrance: the new page is shown live behind the fold,
 *  so its own entrance animations (rise, deal) would play half-seen under it. Jump them to
 *  their end. Scroll-driven and endless animations are left alone. */
function settleEntrances(): void {
  const sheet = page(document);
  if (!sheet) return;
  for (const a of document.getAnimations()) {
    if (!(a instanceof CSSAnimation || a instanceof CSSTransition) || a.timeline !== document.timeline) continue;
    const target = a.effect instanceof KeyframeEffect ? a.effect.target : null;
    if (!target || !sheet.contains(target) || !Number.isFinite(a.effect?.getComputedTiming().endTime ?? Infinity)) continue;
    a.finish();
  }
}

function sizeBoxes(): void {
  const { width, height } = boxes(window.innerWidth, window.innerHeight);
  const style = document.documentElement.style;
  style.setProperty('--pp-curl-box-w', `${width}px`);
  style.setProperty('--pp-curl-box-h', `${height}px`);
}

function turn(vt: Turn, back: boolean, mine: number): void {
  holdTurn(vt.finished);
  const frames = timeline(window.innerWidth, window.innerHeight, back);
  const root = document.documentElement;
  const running: Animation[] = [];
  const ms = duration();
  vt.ready
    .then(() => {
      settleEntrances();
      for (const [layer, pseudoElement] of LAYERS) {
        running.push(root.animate(frames[layer], { duration: ms, easing: 'linear', fill: 'both', pseudoElement }));
      }
    })
    .catch(() => undefined);
  // A filled animation outlives its pseudo-elements and would land on the next turn's.
  vt.finished
    .finally(() => {
      running.forEach((a) => a.cancel());
      if (mine !== generation) return;
      root.removeAttribute(TOKEN);
      unnameUnder();
      performance.mark('pp-turn-finished');
      document.dispatchEvent(new Event('pp:turned'));
    })
    .catch(() => undefined);
}

let pending: { back: boolean; mine: number } | null = null;

document.addEventListener('astro:before-preparation', (e) => {
  if (!isTransitionBeforePreparationEvent(e)) return;
  const load = e.loader;
  const back = e.direction === 'back';
  e.loader = async () => {
    await load();
    generation += 1;
    pending = null;
    unnameUnder();
    keepShared(e.newDocument);
    if (!turning()) {
      document.documentElement.removeAttribute(TOKEN);
      return;
    }
    // The page underneath is a layer of its own: the incoming page going forward, the outgoing
    // page going back. Named on exactly one document, so its group holds one snapshot.
    const under = page(back ? document : e.newDocument);
    if (under) rename(under, UNDER);
    document.documentElement.setAttribute(TOKEN, back ? 'back' : 'forward');
    pending = { back, mine: generation };
  };
});

document.addEventListener('astro:before-swap', (e) => {
  if (!isTransitionBeforeSwapEvent(e)) return;
  const vt: unknown = e.viewTransition;
  if (!isTurn(vt)) return;
  if (reduced() && 'startViewTransition' in document) {
    vt.skipTransition();
    return;
  }
  if (pending) turn(vt, pending.back, pending.mine);
  pending = null;
});

document.addEventListener('astro:after-swap', () => {
  if (!document.documentElement.hasAttribute(TOKEN)) return;
  sizeBoxes();
  settleEntrances();
});
