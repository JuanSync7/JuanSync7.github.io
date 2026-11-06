/** Motion belongs to the presentation root; its content is readable before this module runs. */
const loadEngine = async () => {
  const [{ gsap }, { ScrollTrigger }, { CustomEase }] = await Promise.all([
    import('gsap'), import('gsap/ScrollTrigger'), import('gsap/CustomEase'),
  ]);
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  return { gsap, CustomEase };
};

function token(style: CSSStyleDeclaration, name: string, units: readonly string[]): number {
  const value = style.getPropertyValue(name).trim();
  const match = /^(\d+(?:\.\d+)?)(ms|s|px|%)$/.exec(value);
  if (!match || !units.includes(match[2])) throw new Error(`Invalid presentation token ${name}`);
  return Number(match[1]) / (match[2] === 'ms' ? 1000 : 1);
}

export function mountPresentation(root: HTMLElement): () => void {
  const controller = new AbortController();
  delete root.dataset.motionDisposed;
  const style = getComputedStyle(root);
  const sections = [...root.querySelectorAll<HTMLElement>('[data-presentation-section]')];
  const links = [...root.querySelectorAll<HTMLAnchorElement>('[data-section-link]')];
  const previousLinks = new Map(links.map((link) => [link, link.getAttribute('aria-current')]));
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const activePoint = token(style, '--pr-active-point', ['%']);
  const previousMotion = root.dataset.presentationMotion;
  const previousSection = root.dataset.activeSection;
  let observer: IntersectionObserver | undefined;
  let removeMotion = (): void => {};
  let generation = 0;

  const selectSection = (): void => {
    if (controller.signal.aborted) return;
    let active = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= innerHeight * activePoint / 100) active = section;
    }
    if (!active?.id) return;
    root.dataset.activeSection = active.id;
    for (const link of links) {
      if (link.hash === `#${active.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  };
  const observeSections = (): void => {
    observer?.disconnect();
    selectSection();
    if (typeof IntersectionObserver === 'undefined') return;
    const point = Math.round(innerHeight * activePoint / 100);
    observer = new IntersectionObserver(selectSection, {
      rootMargin: `-${point}px 0px -${Math.max(0, innerHeight - point - 1)}px 0px`,
    });
    sections.forEach((section) => observer?.observe(section));
  };

  const animate = async (): Promise<void> => {
    const attempt = ++generation;
    removeMotion();
    removeMotion = (): void => {};
    if (preference.matches) {
      root.dataset.presentationMotion = 'reduced';
      return;
    }
    root.dataset.presentationMotion = 'loading';
    try {
      const { gsap, CustomEase } = await loadEngine();
      if (controller.signal.aborted || attempt !== generation || !root.isConnected) return;
      const duration = token(style, '--pr-reveal-duration', ['ms', 's']);
      const stagger = token(style, '--pr-reveal-stagger', ['ms', 's']);
      const distance = token(style, '--pr-reveal-distance', ['px']);
      const start = token(style, '--pr-reveal-start', ['%']);
      const curve = style.getPropertyValue('--nt-ease-out').trim().match(/^cubic-bezier\(([^)]+)\)$/);
      if (!curve) throw new Error('Presentation motion needs the declared cubic-bezier easing token');
      const ease = CustomEase.create('', curve[1]);
      const context = gsap.context(() => {}, root);
      const refreshers: (() => void)[] = [];
      removeMotion = (): void => { context.revert(); };
      context.add(() => {
        for (const section of sections) {
          const items = [...section.querySelectorAll<HTMLElement>('[data-reveal]')]
            .filter((item) => item.closest('[data-presentation-section]') === section);
          const isVisible = section.getBoundingClientRect().top < innerHeight;
          if (items.length) {
            // Late module loading never hides content the reader is already looking at.
            const tween = gsap.fromTo(items, isVisible ? { y: distance } : { autoAlpha: 0, y: distance }, {
              autoAlpha: 1, y: 0, duration, stagger, ease, clearProps: 'opacity,visibility,transform',
              scrollTrigger: { trigger: section, start: `top ${start}%`, once: true },
            });
            refreshers.push(() => tween.scrollTrigger?.refresh());
          }
          const rule = section.querySelector<HTMLElement>('[data-section-rule]');
          if (rule) {
            const tween = gsap.fromTo(rule, { scaleX: 0, transformOrigin: 'left center' }, {
              scaleX: 1, duration, ease, clearProps: 'transform,transformOrigin',
              scrollTrigger: { trigger: section, start: `top ${start}%`, once: true },
            });
            refreshers.push(() => tween.scrollTrigger?.refresh());
          }
        }
      });
      root.dataset.presentationMotion = 'ready';
      void document.fonts.ready.then(() => {
        if (!controller.signal.aborted && attempt === generation) refreshers.forEach((refresh) => refresh());
      });
    } catch {
      if (controller.signal.aborted || attempt !== generation) return;
      removeMotion();
      root.dataset.presentationMotion = 'failed';
    }
  };
  const preferenceChanged = (): void => { void animate(); };
  observeSections();
  addEventListener('resize', observeSections, { passive: true, signal: controller.signal });
  preference.addEventListener('change', preferenceChanged);
  void animate();

  return (): void => {
    controller.abort();
    generation++;
    removeMotion();
    observer?.disconnect();
    preference.removeEventListener('change', preferenceChanged);
    for (const [link, value] of previousLinks) {
      if (value === null) link.removeAttribute('aria-current');
      else link.setAttribute('aria-current', value);
    }
    if (previousMotion === undefined) delete root.dataset.presentationMotion;
    else root.dataset.presentationMotion = previousMotion;
    if (previousSection === undefined) delete root.dataset.activeSection;
    else root.dataset.activeSection = previousSection;
    root.dataset.motionDisposed = 'true';
  };
}

/** Astro keeps this module across route swaps, so one listener pair owns the current root. */
export function installPresentationMotion(): () => void {
  let activeRoot: HTMLElement | null = null;
  let unmount = (): void => {};
  const stop = (): void => { unmount(); unmount = (): void => {}; activeRoot = null; };
  const start = (): void => {
    const root = document.querySelector<HTMLElement>('[data-presentation]');
    if (root === activeRoot) return;
    stop();
    if (!root) return;
    activeRoot = root;
    try { unmount = mountPresentation(root); }
    catch { root.dataset.presentationMotion = 'failed'; }
  };
  document.addEventListener('astro:page-load', start);
  document.addEventListener('astro:before-swap', stop);
  addEventListener('pagehide', stop);
  addEventListener('pageshow', start);
  start();
  return (): void => {
    stop();
    document.removeEventListener('astro:page-load', start);
    document.removeEventListener('astro:before-swap', stop);
    removeEventListener('pagehide', stop);
    removeEventListener('pageshow', start);
  };
}
