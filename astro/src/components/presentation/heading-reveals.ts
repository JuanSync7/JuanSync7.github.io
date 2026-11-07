import type { gsap } from 'gsap';
import type { SplitText } from 'gsap/SplitText';
import { readMotionToken } from './motion-values';

export function createHeadingReveals(engine: typeof gsap, Split: typeof SplitText, root: HTMLElement, style: CSSStyleDeclaration) {
  const splits: SplitText[] = [];
  const animations: gsap.core.Tween[] = [];
  for (const section of root.querySelectorAll<HTMLElement>('.vault-section')) {
    const heading = section.querySelector<HTMLElement>('h2');
    if (!heading) continue;
    const split = Split.create(heading, { type: 'words', mask: 'words', wordsClass: 'vault-word' });
    splits.push(split);
    animations.push(engine.fromTo(split.words, { yPercent: readMotionToken(style, '--vc-word-travel', ['%']) }, {
      yPercent: 0, ease: 'power3.out',
      stagger: readMotionToken(style, '--vc-word-stagger', ['ms', 's']),
      scrollTrigger: {
        trigger: section, start: `top ${readMotionToken(style, '--pr-scroll-enter', ['%'])}%`,
        end: `top ${readMotionToken(style, '--pr-scroll-settle', ['%'])}%`,
        scrub: readMotionToken(style, '--pr-scroll-scrub', ['ms', 's']), invalidateOnRefresh: true,
      },
    }));
  }
  return {
    refresh: () => animations.forEach((animation) => animation.scrollTrigger?.refresh()),
    destroy: () => splits.forEach((split) => split.revert()),
  };
}
