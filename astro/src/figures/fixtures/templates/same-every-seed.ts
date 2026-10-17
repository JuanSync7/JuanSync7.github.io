// expect-check: none
// expect-look: seed
import { defineTemplate } from '../../defineTemplate';
import { ink } from '../../kit/ink';

/** Fixture: a template whose grammar ignores the seed, so every instance draws the same
 *  picture. Each instance passes every other check; the look must still fail the template. */
export default defineTemplate<{ spokes: number }, null>({
  id: 'same-every-seed',
  title: 'Same every seed',
  idea: 'A template that ignores its seed, so the audit can prove it checks that seeds make different pictures.',
  style: 'wireframe',
  motion: 'ambient',
  answers: false,
  aspect: 2,
  grammar: () => ({ spokes: 12 }),
  name: () => 'always the same',
  alt: () => 'Twelve grey spokes turning slowly around a centre, one of them teal; every seed draws the same thing.',
  setup: () => null,
  draw: ({ ctx, w, h, t, params }) => {
    for (let i = 0; i < params.spokes; i++) {
      const a = (i / params.spokes) * Math.PI * 2 + t * 0.4;
      ctx.strokeStyle = i === 0 ? ink.signal(0.9) : ink.line(0.45);
      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2);
      ctx.lineTo(w / 2 + Math.cos(a) * h * 0.4, h / 2 + Math.sin(a) * h * 0.4);
      ctx.stroke();
    }
  },
});
