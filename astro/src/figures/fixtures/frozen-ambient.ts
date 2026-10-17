// expect-check: none
// expect-look: motion
import { defineCanvasFigure } from '../define';
import { ink } from '../kit/ink';

/** Fixture: declares ambient motion but never moves. The look must notice. */
export default defineCanvasFigure<null>({
  id: 'frozen-ambient',
  title: 'Frozen ambient',
  alt: 'Three grey rings that never move; this fixture proves the audit checks that ambient figures actually move.',
  idea: 'A figure that claims to move and does not, so the audit can prove it measures motion.',
  style: 'wireframe',
  motion: 'ambient',
  answers: false,
  group: 'fixture',
  seed: 3,
  aspect: 16 / 9,
  setup: () => null,
  draw: ({ ctx, w, h }) => {
    for (let i = 1; i <= 3; i++) {
      ctx.strokeStyle = ink.line(0.5);
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, i * h * 0.12, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = ink.signal(0.9);
    ctx.fillRect(w / 2 - 2, h / 2 - 2, 4, 4);
  },
});
