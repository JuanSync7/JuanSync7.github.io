/* page-zoom — full-page transition driven by Astro's ClientRouter.
   Hooks into `astro:before-preparation` (zoom out before fetch) and
   `astro:after-swap` (zoom in after DOM swap). Listeners live on
   `document`, which is never replaced, so initPageZoom() runs once. */

import './page-zoom.css';

const ACTIVE_CLASS = 'page-zoom-active';

const ZOOM_OUT_KEYFRAMES: Keyframe[] = [
  { transform: 'scale(1)', opacity: 1 },
  { transform: 'scale(0)', opacity: 0 },
];
const ZOOM_IN_KEYFRAMES: Keyframe[] = [
  { transform: 'scale(0)', opacity: 0 },
  { transform: 'scale(1)', opacity: 1 },
];
const OUT_DURATION = 520;
const IN_DURATION = 560;

const STAGE_ID = 'page-zoom-stage';

interface BeforePrepEvent {
  sourceElement: Element | null;
  loader: () => Promise<void>;
}

function asBeforePrep(event: Event): BeforePrepEvent | null {
  if (!('loader' in event)) return null;
  const e = event as Event & { loader: unknown; sourceElement?: unknown };
  if (typeof e.loader !== 'function') return null;
  const src = e.sourceElement instanceof Element ? e.sourceElement : null;
  return { sourceElement: src, loader: e.loader as () => Promise<void> };
}

function getStage(): HTMLElement | null {
  return document.getElementById(STAGE_ID);
}

function setViewportOrigin(stage: HTMLElement): void {
  const cx = window.scrollX + window.innerWidth / 2;
  const cy = window.scrollY + window.innerHeight / 2;
  stage.style.transformOrigin = `${cx}px ${cy}px`;
}

async function playZoomOut(): Promise<void> {
  const stage = getStage();
  if (!stage) return;
  document.documentElement.classList.add(ACTIVE_CLASS);
  setViewportOrigin(stage);
  const anim = stage.animate(ZOOM_OUT_KEYFRAMES, {
    duration: OUT_DURATION,
    easing: 'cubic-bezier(.55,.05,.85,.32)',
    fill: 'forwards',
  });
  try {
    await anim.finished;
  } catch {
    /* navigation aborted */
  }
}

function playZoomIn(): void {
  const stage = getStage();
  if (!stage) {
    document.documentElement.classList.remove(ACTIVE_CLASS);
    return;
  }
  // Lock the new content invisible synchronously so the post-swap paint
  // never shows a flat page popping in.
  stage.style.transform = 'scale(0)';
  stage.style.opacity = '0';
  setViewportOrigin(stage);

  requestAnimationFrame(() => {
    const anim = stage.animate(ZOOM_IN_KEYFRAMES, {
      duration: IN_DURATION,
      easing: 'cubic-bezier(.2,.78,.3,1)',
      fill: 'forwards',
    });
    anim.finished
      .then(() => {
        anim.commitStyles();
        anim.cancel();
        stage.style.transform = '';
        stage.style.opacity = '';
        stage.style.transformOrigin = '';
        stage.style.willChange = '';
        document.documentElement.classList.remove(ACTIVE_CLASS);
      })
      .catch(() => {
        document.documentElement.classList.remove(ACTIVE_CLASS);
      });
  });
}

let zoomActive = false;
let initialized = false;

export function initPageZoom(): void {
  if (initialized) return;
  initialized = true;

  document.addEventListener('astro:before-preparation', (event: Event) => {
    const prep = asBeforePrep(event);
    if (!prep) return;
    const anchor = prep.sourceElement?.closest('a[data-zoom]');
    if (!anchor) return;

    zoomActive = true;
    const originalLoader = prep.loader;
    const wrapped = async (): Promise<void> => {
      await playZoomOut();
      await originalLoader();
    };
    (event as Event & { loader: () => Promise<void> }).loader = wrapped;
  });

  document.addEventListener('astro:after-swap', () => {
    if (!zoomActive) return;
    zoomActive = false;
    playZoomIn();
  });
}
