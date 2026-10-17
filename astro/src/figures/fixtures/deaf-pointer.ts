// expect-check: none
// expect-look: answer
import { defineCanvasFigure } from '../define';
import { ink } from '../kit/ink';

/** Fixture: declares that it answers the pointer, then ignores it. The look must notice. */
export default defineCanvasFigure<null>({
  id: 'deaf-pointer',
  title: 'Deaf pointer',
  alt: 'A still grid of grey dots with one teal dot; this fixture proves the audit checks that a figure really answers the pointer.',
  idea: 'A figure that promises to answer the pointer and never does, so the audit can prove it tests the answer.',
  style: 'pixel',
  motion: 'still',
  answers: true,
  group: 'fixture',
  seed: 7,
  aspect: 16 / 9,
  setup: () => null,
  draw: ({ ctx, w, h }) => {
    for (let x = 1; x < 16; x++) {
      for (let y = 1; y < 9; y++) {
        ctx.fillStyle = x === 8 && y === 4 ? ink.signal(1) : ink.line(0.5);
        ctx.fillRect((x * w) / 16 - 2, (y * h) / 9 - 2, 4, 4);
      }
    }
  },
});
