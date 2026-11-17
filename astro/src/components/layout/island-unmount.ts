/** Holds back a React island's unmount until its hydration has finished.
 *
 *  When the router swaps a page, Astro sends `astro:unmount` to every island of the old page and
 *  the React adapter calls `root.unmount()`. If an island is still hydrating (a heavy one, like
 *  the writing index's lesson log, takes several frames), that unmount is an update arriving
 *  before hydration is done, and React reports error #424. A quick "there and back" is enough to
 *  hit it. This listens on each island for the unmount, ahead of the adapter (a capture listener
 *  at the target runs first), waits until React has hydrated the root, then lets the unmount
 *  through. If the root can't be read, the unmount goes ahead at once, as before. */

const MAX_FRAMES = 600;

function field(o: unknown, key: string): unknown {
  return typeof o === 'object' && o !== null && key in o ? (o as Record<string, unknown>)[key] : undefined;
}

/** True while React is still hydrating the root mounted on this island. */
function hydrating(el: Element): boolean {
  const key = Object.keys(el).find((k) => k.startsWith('__reactContainer$'));
  if (!key) return false;
  const current = field(field(field(el, key), 'stateNode'), 'current');
  return field(field(current, 'memoizedState'), 'isDehydrated') === true;
}

function hold(el: Element): void {
  if (!(el instanceof HTMLElement) || el.dataset.unmountHeld) return;
  el.dataset.unmountHeld = '1';
  const onUnmount = (e: Event): void => {
    if (!hydrating(el)) return;
    e.stopImmediatePropagation();
    let frames = 0;
    const wait = (): void => {
      if (hydrating(el) && ++frames < MAX_FRAMES) {
        requestAnimationFrame(wait);
        return;
      }
      el.removeEventListener('astro:unmount', onUnmount, { capture: true });
      el.dispatchEvent(new CustomEvent('astro:unmount'));
    };
    requestAnimationFrame(wait);
  };
  el.addEventListener('astro:unmount', onUnmount, { capture: true });
}

document.addEventListener('astro:before-swap', () => document.querySelectorAll('astro-island').forEach(hold));
