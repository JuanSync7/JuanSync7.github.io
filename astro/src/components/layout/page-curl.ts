/* page-curl — page swaps on the paper system turn the page like a sheet of a notepad.

   The page you leave lifts from its bottom-right corner. A fold line crosses the page from
   right to left; what is past the fold has lifted, so the next page shows through there, and
   the lifted part lies folded back over the page as its paper back, foreshortened because it
   stands up off the pad. Going back plays the same turn in reverse with the pages swapped, so
   the earlier page lays itself back down.

   Every frame moves only transform and opacity, so the browser's compositor plays the turn on
   its own thread: a page that is still building its figures, or a slow phone's main thread,
   cannot make it stutter. Nothing is clipped or repainted per frame. A cut is a layer turned to
   the fold's angle that clips what it holds (overflow: clip), with the page inside turned back
   by the same amount, so the page stays put while the cut edge sweeps across it.

   Layers, bottom to top, as view-transition groups:
     pp-under  the page underneath (.pp-page of the page being uncovered), never cut
     pp-shade  a dark sheet over it that fades as it is uncovered
     root      the turning page, inside the cut (the other root snapshot is hidden)
     pp-curl   the paper back: the turning page's shape mirrored over the fold inside the same
               cut, with its crease and sheen painted once, measured from the fold
   The groups only exist while Astro navigates (styles/page-turn.css). */

import { isTransitionBeforePreparationEvent, isTransitionBeforeSwapEvent } from 'astro:transitions/client';

interface Turn {
  ready: Promise<unknown>;
  finished: Promise<unknown>;
}

const FRAMES = 72;
const UNDER = 'pp-under';

const isTurn = (v: unknown): v is Turn =>
  typeof v === 'object' && v !== null && 'ready' in v && v.ready instanceof Promise && 'finished' in v && v.finished instanceof Promise;

/** Eases in as the corner lifts and out as the page clears, at an even pace between. */
const ease = (t: number): number => 0.5 - Math.cos(Math.PI * t) / 2;

const moves = (): boolean => 'startViewTransition' in document && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The fold at progress p (0 flat, 1 gone) on a w by h page: where it crosses the bottom edge
 *  (b), its angle (phi, along the fold from bottom to top) and how far the lifted part is
 *  foreshortened (k). It starts at the corner leaning well over, and stands nearly upright by
 *  the time it leaves the page. */
export function foldAt(p: number, w: number, h: number): { b: number; phi: number; k: number } {
  const b = w - p * (1.2 * w + 0.15 * h);
  const a = b + h * (0.55 - 0.4 * p);
  return { b, phi: Math.atan2(-h, a - b), k: 0.85 - 0.3 * p };
}

const n = (v: number): string => v.toFixed(2);

function duration(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--pp-dur-flip').trim();
  const ms = raw.endsWith('ms') ? parseFloat(raw) : parseFloat(raw) * 1000;
  return Number.isFinite(ms) && ms > 0 ? ms : 1000;
}

/** Plays the turn on view transition vt. `next` is the incoming document's root: Astro carries
 *  its attributes over at the swap, so the sizes the layers read are set there. */
function turn(vt: Turn, back: boolean, next: HTMLElement): void {
  const root = document.documentElement;
  const w = window.innerWidth;
  const h = window.innerHeight;
  // The cut is a square of side `reach` whose bottom edge lies on the fold, centred on where the
  // fold meets the bottom of the page: big enough to cover the whole page from any fold.
  const reach = 4 * (w + h);
  const diag = Math.hypot(w, h);
  next.style.setProperty('--pp-turn-w', `${w}px`);
  next.style.setProperty('--pp-turn-h', `${h}px`);
  next.style.setProperty('--pp-turn-reach', `${reach}px`);
  next.style.setProperty('--pp-turn-diag', `${n(diag)}px`);
  next.dataset.ppTurn = back ? 'back' : 'forward';

  const cut: Keyframe[] = [];
  const hold: Keyframe[] = [];
  const flap: Keyframe[] = [];
  const lit: Keyframe[] = [];
  const shade: Keyframe[] = [];
  for (let i = 0; i <= FRAMES; i += 1) {
    const e = ease(i / FRAMES);
    const p = back ? 1 - e : e;
    const { b, phi, k } = foldAt(p, w, h);
    const into = `translate(${n(b)}px, ${h}px) rotate(${phi.toFixed(5)}rad)`;
    const outOf = `rotate(${(-phi).toFixed(5)}rad) translate(${n(-b)}px, ${-h}px)`;
    cut.push({ transform: `${into} translate(${-reach / 2}px, ${-reach}px)`, opacity: 1 });
    hold.push({ transform: `translate(${reach / 2}px, ${reach}px) ${outOf}` });
    flap.push({ transform: `translate(${reach / 2}px, ${reach}px) scale(1, ${(-k).toFixed(4)}) ${outOf}` });
    lit.push({ transform: `${into} translate(${n(-diag)}px, 0px)` });
    shade.push({ opacity: (0.1 * (1 - p)).toFixed(4) });
  }

  const ms = duration();
  const running: Animation[] = [];
  const run = (frames: Keyframe[], pseudoElement: string): void => {
    running.push(root.animate(frames, { duration: ms, easing: 'linear', fill: 'both', pseudoElement }));
  };
  vt.ready
    .then(() => {
      run(cut, '::view-transition-group(root)');
      run(hold, '::view-transition-image-pair(root)');
      run(cut, '::view-transition-group(pp-curl)');
      run(flap, '::view-transition-image-pair(pp-curl)');
      run(lit, '::view-transition-new(pp-curl)');
      run(shade, '::view-transition-image-pair(pp-shade)');
    })
    .catch(() => undefined);
  // A filled animation outlives its pseudo-elements and would land on the next turn's; drop
  // them once this turn is over, however it ends.
  vt.finished
    .finally(() => {
      running.forEach((a) => a.cancel());
      delete root.dataset.ppTurn;
      for (const v of ['--pp-turn-w', '--pp-turn-h', '--pp-turn-reach', '--pp-turn-diag']) root.style.removeProperty(v);
    })
    .catch(() => undefined);
}

// Going back, the page underneath is the one being left: it is named before the old snapshot.
// A navigation that never happened must not leave its mark on the next one, so clear it first.
document.addEventListener('astro:before-preparation', (e) => {
  document.querySelector(`.pp-page.${UNDER}`)?.classList.remove(UNDER);
  if (isTransitionBeforePreparationEvent(e) && e.direction === 'back' && moves()) {
    document.querySelector('.pp-page')?.classList.add(UNDER);
  }
});

document.addEventListener('astro:before-swap', (e) => {
  if (!isTransitionBeforeSwapEvent(e) || !moves()) return;
  const vt: unknown = e.viewTransition;
  if (!isTurn(vt)) return;
  const back = e.direction === 'back';
  // Going forward, the page underneath is the one arriving: name it in the new document.
  const under = back ? document.querySelector(`.pp-page.${UNDER}`) : e.newDocument.querySelector('.pp-page');
  if (!under) return;
  if (!back) under.classList.add(UNDER);
  turn(vt, back, e.newDocument.documentElement);
});
