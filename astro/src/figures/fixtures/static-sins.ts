// expect-check: random, words, glow, clock, dom, width
// expect-look: blank, motion
import { defineCanvasFigure } from '../define';
import { ink } from '../kit/ink';

/** Fixture: breaks the source rules one by one. The check must name every one. */
export default defineCanvasFigure<null>({
  id: 'static-sins',
  title: 'Static sins',
  alt: 'Grey dots and a label; this fixture proves the source check catches each banned call.',
  idea: 'A figure written against every source rule, so the check can prove each rule is enforced.',
  style: 'field',
  motion: 'ambient',
  answers: false,
  group: 'fixture',
  seed: 5,
  aspect: 16 / 9,
  setup: () => null,
  draw: ({ ctx, w, h }) => {
    const wobble = Math.random() * 4;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 4;
    ctx.fillStyle = ink.line(0.6);
    ctx.fillText('label', w / 2 + wobble, h / 2);
    if (performance.now() > 0 && document.hidden) requestAnimationFrame(() => undefined);
  },
});
