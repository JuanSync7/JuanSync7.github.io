// expect-check: clock
// expect-look: perf
import { defineCanvasFigure } from '../define';
import { ink } from '../kit/ink';

/** Fixture: spends about 12 ms of work on every frame. The look must flag the frame time. */
export default defineCanvasFigure<null>({
  id: 'busy-frame',
  title: 'Busy frame',
  alt: 'Twelve slowly turning grey spokes; this fixture proves the audit measures how long each frame takes.',
  idea: 'A figure that burns time every frame, so the audit can prove it holds figures to a frame budget.',
  style: 'trace',
  motion: 'ambient',
  answers: false,
  group: 'fixture',
  seed: 6,
  aspect: 16 / 9,
  setup: () => null,
  draw: ({ ctx, w, h, t }) => {
    const until = performance.now() + 12;
    let spin = 0;
    while (performance.now() < until) spin += 1;
    ctx.strokeStyle = ink.line(0.6 + (spin % 2) * 0);
    for (let i = 0; i < 12; i++) {
      const a = t * 0.8 + (i * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2);
      ctx.lineTo(w / 2 + Math.cos(a) * h * 0.4, h / 2 + Math.sin(a) * h * 0.4);
      ctx.stroke();
    }
    ctx.fillStyle = ink.signal(0.9);
    ctx.fillRect(w / 2 - 2, h / 2 - 2, 4, 4);
  },
});
