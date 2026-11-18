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
