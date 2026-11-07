import type { gsap } from 'gsap';
import { readMotionToken } from './motion-values';

/** All tweens are created inside the caller's GSAP context; native scrolling owns position. */
export function createLandingScroll(engine: typeof gsap, root: HTMLElement, style: CSSStyleDeclaration) {
  const read = (name: string, units: readonly string[]) => readMotionToken(style, name, units);
  const scrub = read('--pr-scroll-scrub', ['ms', 's']);
  const reference = read('--pr-scroll-reference', ['px']);
  const strength = () => Math.min(1, root.clientWidth / reference);
  const travel = (name: string) => read(name, ['px']) * strength();
  const animations: gsap.core.Tween[] = [];
  const chapters = root.querySelector<HTMLElement>('[data-scroll-chapters]');
  const siteNav = document.querySelector<HTMLElement>('body > header.nav');
  const previousInset = root.style.getPropertyValue('--pr-scroll-inset');
  const previousJourney = root.dataset.scrollJourney;
  const previousProgress = root.dataset.scrollFraction;
  const measureInset = () => {
    const height = (chapters?.offsetHeight ?? 0) + (siteNav?.offsetHeight ?? 0);
    root.style.setProperty('--pr-scroll-inset', `${height + read('--pr-scroll-clearance', ['px'])}px`);
  };
  const observer = new ResizeObserver(measureInset);
  if (chapters) observer.observe(chapters);
  if (siteNav) observer.observe(siteNav);
  measureInset();

  const hero = root.querySelector<HTMLElement>('#overview');
  const cabinet = root.querySelector<HTMLElement>('[data-cabinet]');
  const stage = root.querySelector<HTMLElement>('.vault-cabinet-stage');
  const wide = () => hero ? getComputedStyle(hero).gridTemplateColumns.split(' ').length > 1 : false;
  if (hero && cabinet && stage) {
    const narrative = { progress: 0 };
    const publish = () => {
      cabinet.dataset.cabinetProgress = String(narrative.progress);
      cabinet.dispatchEvent(new CustomEvent('vault:cabinet-progress', { detail: narrative.progress }));
    };
    animations.push(engine.fromTo(narrative, { progress: 0 }, {
      progress: 1, ease: 'none', onUpdate: publish,
      scrollTrigger: {
        trigger: hero,
        start: () => wide() ? hero.getBoundingClientRect().top + scrollY : Math.max(0, stage.getBoundingClientRect().top + scrollY - innerHeight * read('--pr-scroll-enter', ['%']) / 100),
        end: () => wide() ? hero.getBoundingClientRect().bottom + scrollY - innerHeight : stage.getBoundingClientRect().bottom + scrollY - innerHeight * read('--pr-scroll-settle', ['%']) / 100,
        scrub, invalidateOnRefresh: true,
      },
    }));
  }

  for (const section of root.querySelectorAll<HTMLElement>('[data-presentation-section]')) {
    if (section === hero) continue;
    const rule = section.querySelector<HTMLElement>('[data-section-rule]');
    const enter = read('--pr-scroll-enter', ['%']);
    const settle = read('--pr-scroll-settle', ['%']);
    const scrollTrigger = { trigger: section, start: `top ${enter}%`, end: `top ${settle}%`, scrub, invalidateOnRefresh: true };
    if (rule) animations.push(engine.fromTo(rule, { scaleX: 0, transformOrigin: 'left' }, {
      scaleX: 1, ease: 'none', scrollTrigger: { ...scrollTrigger },
    }));
  }

  const cards = root.querySelectorAll<HTMLElement>('[data-scroll-card]');
  cards.forEach((card, index) => {
    animations.push(engine.fromTo(card, {
      y: () => travel('--vc-card-travel') * (1 + index % 2 / 2),
      x: () => wide() ? (index % 2 ? 1 : -1) * read('--vc-card-sway', ['px']) : 0,
      rotationZ: () => wide() ? (index % 2 ? 1 : -1) * read('--vc-card-turn', ['deg']) : 0,
      scale: () => 1 - read('--pr-scroll-card-shrink', ['%']) / 100 * strength(),
    }, {
      y: 0, x: 0, rotationZ: 0, scale: 1, ease: 'power2.out',
      scrollTrigger: {
        trigger: card, start: `top ${read('--pr-scroll-card-enter', ['%'])}%`,
        end: `top ${read('--pr-scroll-card-settle', ['%'])}%`, scrub, invalidateOnRefresh: true,
      },
    }));
  });
  root.querySelectorAll<HTMLElement>('.vault-benefits article').forEach((card, index) => {
    animations.push(engine.fromTo(card, { y: () => travel('--vc-card-travel') * (1 + index / 3) }, {
      y: 0, ease: 'power2.out', scrollTrigger: {
        trigger: card.parentElement, start: `top ${read('--pr-scroll-card-enter', ['%'])}%`, end: `top ${read('--pr-scroll-card-settle', ['%'])}%`, scrub, invalidateOnRefresh: true,
      },
    }));
  });

  const progress = root.querySelector<HTMLElement>('[data-scroll-progress]');
  root.dataset.scrollFraction = '0';
  if (progress) animations.push(engine.fromTo(progress, { scaleX: 0, transformOrigin: 'left' }, {
    scaleX: 1, ease: 'none', scrollTrigger: {
      trigger: root, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true,
      onUpdate: (trigger) => { root.dataset.scrollFraction = trigger.progress.toFixed(4); },
    },
  }));
  root.dataset.scrollJourney = 'ready';

  return {
    refresh: () => { measureInset(); animations.forEach((animation) => animation.scrollTrigger?.refresh()); },
    destroy: () => {
      observer.disconnect();
      if (previousInset) root.style.setProperty('--pr-scroll-inset', previousInset);
      else root.style.removeProperty('--pr-scroll-inset');
      if (previousJourney === undefined) delete root.dataset.scrollJourney;
      else root.dataset.scrollJourney = previousJourney;
      if (previousProgress === undefined) delete root.dataset.scrollFraction;
      else root.dataset.scrollFraction = previousProgress;
    },
  };
}
