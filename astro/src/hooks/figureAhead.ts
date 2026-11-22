/** Build-ahead for heavy figures (see LoopOptions.ahead): wait until a canvas is near the view,
 *  then for an idle moment, so a scene is built before it is seen but never during a busy frame.
 *  Each wait registers its own teardown in `cleanups`. With no margin both resolve at once. */

export function whenNear(el: Element, margin: string | undefined, cleanups: (() => void)[]): Promise<void> {
  return new Promise((resolve) => {
    if (!margin) return resolve();
    const io = new IntersectionObserver(
      (es) => {
        if (!es.some((e) => e.isIntersecting)) return;
        io.disconnect();
        resolve();
      },
      { rootMargin: margin },
    );
    io.observe(el);
    cleanups.push(() => io.disconnect());
  });
}

export function whenIdle(margin: string | undefined, cleanups: (() => void)[]): Promise<void> {
  return new Promise((resolve) => {
    if (!margin) return resolve();
    if ('requestIdleCallback' in window) {
      const h = window.requestIdleCallback(() => resolve(), { timeout: 1200 });
      cleanups.push(() => window.cancelIdleCallback(h));
    } else {
      const h = setTimeout(resolve, 0);
      cleanups.push(() => clearTimeout(h));
    }
  });
}

/** Resolves once no page turn is playing. Astro marks <html> with data-astro-transition for as
 *  long as a page swap's view transition runs, and the turn repaints on the main thread every
 *  frame: a scene that builds and compiles its shaders during it stalls the turn for as long as
 *  the build takes. So a figure that lands with a turn builds the moment the turn is over, and
 *  after TURN_CAP_MS at most, so a swap that never clears the mark cannot keep a figure away. */
const TURN_CAP_MS = 3000;

export function whenTurned(cleanups: (() => void)[]): Promise<void> {
  return new Promise((resolve) => {
    const html = document.documentElement;
    if (!html.hasAttribute('data-astro-transition')) return resolve();
    const done = (): void => {
      mo.disconnect();
      clearTimeout(cap);
      resolve();
    };
    const mo = new MutationObserver(() => {
      if (!html.hasAttribute('data-astro-transition')) done();
    });
    const cap = setTimeout(done, TURN_CAP_MS);
    mo.observe(html, { attributes: true, attributeFilter: ['data-astro-transition'] });
    cleanups.push(() => {
      mo.disconnect();
      clearTimeout(cap);
    });
  });
}
