// expect-check: colour
// expect-look: palette
import { defineCanvasFigure } from '../define';

/** Fixture: paints in a colour that is not a night token. Both checks must reject it. */
export default defineCanvasFigure<null>({
  id: 'off-palette',
  title: 'Off palette',
  alt: 'A red disc on the ground; this fixture exists to prove the audit rejects colours outside the tokens.',
  idea: 'A figure that picked its own colour, so the audit can prove it rejects off-palette paint.',
  style: 'field',
  motion: 'still',
  answers: false,
  group: 'fixture',
  seed: 2,
  aspect: 16 / 9,
  setup: () => null,
  draw: ({ ctx, w, h }) => {
    ctx.fillStyle = '#e5484d';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, h * 0.2, 0, Math.PI * 2);
    ctx.fill();
  },
});
