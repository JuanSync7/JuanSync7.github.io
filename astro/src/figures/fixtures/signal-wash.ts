// expect-check: none
// expect-look: wash, signal
import { defineCanvasFigure } from '../define';
import { ink } from '../kit/ink';

/** Fixture: floods the frame with the signal. The look must call it a wash. */
export default defineCanvasFigure<null>({
  id: 'signal-wash',
  title: 'Signal wash',
  alt: 'A canvas filled almost edge to edge with teal; this fixture proves the audit rejects using the signal as paint.',
  idea: 'A figure that spends its one highlight on everything, so the audit can prove it keeps the signal rare.',
  style: 'field',
  motion: 'still',
  answers: false,
  group: 'fixture',
  seed: 4,
  aspect: 16 / 9,
  setup: () => null,
  draw: ({ ctx, w, h }) => {
    ctx.fillStyle = ink.signal(0.85);
    ctx.fillRect(w * 0.05, h * 0.05, w * 0.9, h * 0.9);
  },
});
