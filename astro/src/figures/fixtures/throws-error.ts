// expect-check: none
// expect-look: load, console
import { defineCanvasFigure } from '../define';

/** Fixture: throws while drawing. The look must report it rather than measure a blank. */
export default defineCanvasFigure<null>({
  id: 'throws-error',
  title: 'Throws error',
  alt: 'Nothing, because it fails; this fixture proves the audit reports a figure that throws while drawing.',
  idea: 'A figure with a bug in its draw call, so the audit can prove it surfaces errors instead of hiding them.',
  style: 'field',
  motion: 'still',
  answers: false,
  group: 'fixture',
  seed: 8,
  aspect: 16 / 9,
  setup: () => null,
  draw: () => {
    throw new Error('fixture: draw failed on purpose');
  },
});
