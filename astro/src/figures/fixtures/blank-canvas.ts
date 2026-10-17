// expect-check: none
// expect-look: blank
import { defineCanvasFigure } from '../define';

/** Fixture: draws nothing. The look must call it blank. */
export default defineCanvasFigure<null>({
  id: 'blank-canvas',
  title: 'Blank canvas',
  alt: 'Nothing at all; this fixture exists to prove the audit notices an empty figure.',
  idea: 'A figure that forgot to draw, so the audit can prove it notices an empty canvas.',
  style: 'field',
  motion: 'still',
  answers: false,
  group: 'fixture',
  seed: 1,
  aspect: 16 / 9,
  setup: () => null,
  draw: () => undefined,
});
