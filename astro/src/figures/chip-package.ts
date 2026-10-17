import { defineCanvasFigure } from './define';
import { isometric, project } from './kit/camera';
import { box, line } from './kit/draw';
import { ink, mix } from './kit/ink';
import { clamp, follow } from './kit/motion';

/** A flip-chip package in hairline isometric: substrate with its ball grid, the die, the
 *  heat spreader. Rest holds the stack slightly open with the die lit; the pointer opens the
 *  gaps, its height picks a layer, and that layer slides out like a drawer. */

const LAYERS = [
  { name: 'balls', y0: -0.05, y1: 0, half: 0.95 },
  { name: 'substrate', y0: 0, y1: 0.08, half: 1 },
  { name: 'die', y0: 0.08, y1: 0.16, half: 0.48 },
  { name: 'lid', y0: 0.16, y1: 0.21, half: 0.82 },
] as const;

interface State {
  lift: number[];
  slide: number[];
}

export default defineCanvasFigure<State>({
  id: 'chip-package',
  title: 'Chip package',
  alt: 'An isometric line drawing of a chip package: a substrate on a grid of solder balls, a die, and a heat spreader above, lifted slightly apart.',
  idea: 'A flip-chip package opened in layers: hovering opens the gaps, pointer height picks a layer and it slides out like a drawer, the way the post walks down from lid to die to substrate.',
  style: 'hairline',
  motion: 'responsive',
  answers: true,
  group: 'cover',
  seed: 1206,
  aspect: 2,
  setup: () => ({ lift: LAYERS.map(() => 0), slide: LAYERS.map(() => 0) }),
  draw: ({ ctx, w, h, dt, pointer, hover, still, state }) => {
    const cam = isometric(w / 2, h * 0.7, Math.min(w, h * 1.7) * 0.2);
    const pick = pointer.active ? clamp(Math.floor((1 - pointer.y) * 4.6), 0, LAYERS.length - 1) : 2;
    let read = 'rest';
    LAYERS.forEach((_, i) => {
      // Rest holds the stack open far enough to see the die under the lid; hover opens it
      // further and draws the picked layer out toward the viewer's right.
      const lift = 0.2 * i * (1 + hover * 0.6);
      const slide = i === pick ? 0.28 + 0.3 * hover : 0;
      state.lift[i] = still ? lift : follow(state.lift[i] ?? 0, lift, dt, 7);
      state.slide[i] = still ? slide : follow(state.slide[i] ?? 0, slide, dt, 7);
    });
    for (let i = 0; i < LAYERS.length; i++) {
      const l = LAYERS[i];
      if (!l) continue;
      const up = state.lift[i] ?? 0;
      const sx = state.slide[i] ?? 0;
      const lit = i === pick;
      if (l.name === 'balls') {
        for (let a = -3; a <= 3; a++) {
          for (let b = -3; b <= 3; b++) {
            const x = (a / 3) * l.half * 0.86 + sx;
            const z = (b / 3) * l.half * 0.86;
            const p = project(cam, x, l.y1 + up - 0.025, z);
            ctx.beginPath();
            ctx.ellipse(p[0], p[1], 3.2, 1.9, 0, 0, Math.PI * 2);
            ctx.fillStyle = ink.face();
            ctx.fill();
            ctx.strokeStyle = lit ? ink.signal(0.85) : ink.line(0.3);
            ctx.stroke();
          }
        }
      } else {
        box(ctx, cam, -l.half + sx, -l.half, l.half + sx, l.half, l.y0 + up, l.y1 + up, {
          top: lit ? mix('panelSignal', 'signalLine', 0.6) : mix('panel', 'panel2', 0.8),
          left: mix('ground', 'panel', 0.9),
          right: mix('ground', 'panel', 0.5),
          edge: lit ? ink.signal(0.95) : ink.line(0.55),
          crease: lit ? ink.signal(0.4) : ink.line(0.16),
        });
        if (l.name === 'die') {
          for (let k = -2; k <= 2; k++) {
            const a = project(cam, -l.half * 0.8 + sx, l.y1 + up, (k / 2.6) * l.half);
            const b = project(cam, l.half * 0.8 + sx, l.y1 + up, (k / 2.6) * l.half);
            line(ctx, a, b, lit ? ink.signal(0.35) : ink.line(0.1));
          }
        }
      }
      if (lit) read = pointer.active ? l.name : 'rest';
    }
    return read;
  },
});

