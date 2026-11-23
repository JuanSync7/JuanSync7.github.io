/** Figure builds, one at a time. A page that lands with ten figures used to build them all in
 *  one task, holding the page for over a second; here each waits its turn, the one nearest the
 *  middle of the window first, and a frame is painted between one build and the next, so the
 *  page stays responsive while they fill in. The total work is the same, spread out. */

interface Waiting {
  el: Element;
  go: () => void;
}

const queue: Waiting[] = [];
let busy = false;

/** How far a box is from the middle of the window, so the figure in view builds first. */
function distance(el: Element): number {
  const r = el.getBoundingClientRect();
  return Math.abs((r.top + r.bottom) / 2 - window.innerHeight / 2);
}

function next(): void {
  if (!queue.length) {
    busy = false;
    return;
  }
  let best = 0;
  queue.forEach((w, i) => {
    if (distance(w.el) < distance(queue[best]?.el ?? w.el)) best = i;
  });
  const [w] = queue.splice(best, 1);
  // The build runs in this task, in the promise callbacks `go` releases; the next one waits for
  // the frame after it to be painted.
  w?.go();
  requestAnimationFrame(() => setTimeout(next, 0));
}

/** Resolves when it is `el`'s turn to build. Leaving the page drops it from the queue. */
export function whenQueued(el: Element, cleanups: (() => void)[]): Promise<void> {
  return new Promise((resolve) => {
    const w: Waiting = { el, go: resolve };
    queue.push(w);
    cleanups.push(() => {
      const i = queue.indexOf(w);
      if (i >= 0) queue.splice(i, 1);
    });
    if (busy) return;
    busy = true;
    requestAnimationFrame(() => setTimeout(next, 0));
  });
}
