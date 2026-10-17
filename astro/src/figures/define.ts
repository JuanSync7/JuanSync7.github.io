import { mulberry32 } from './kit/rng';
import type { CanvasFigureSpec, Figure, FigureInstance, FrameInput } from './types';

/** Wraps a 2D spec into a Figure. The spec's state lives inside `mount`, so many copies of
 *  one figure can run on a page without sharing anything. */
export function defineCanvasFigure<S>(spec: CanvasFigureSpec<S>): Figure {
  const { setup, draw, ...meta } = spec;
  return {
    ...meta,
    kind: '2d',
    mount(canvas: HTMLCanvasElement): FigureInstance {
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error(`figure ${spec.id}: no 2D context`);
      let w = 1;
      let h = 1;
      let dpr = 1;
      let rng = mulberry32(spec.seed);
      let state = setup({ w, h, rng });
      return {
        resize(nw: number, nh: number, ndpr: number): void {
          w = Math.max(1, nw);
          h = Math.max(1, nh);
          dpr = ndpr;
          canvas.width = Math.round(w * dpr);
          canvas.height = Math.round(h * dpr);
          rng = mulberry32(spec.seed);
          state = setup({ w, h, rng });
        },
        frame(input: FrameInput): string | void {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, w, h);
          ctx.lineWidth = 1;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          return draw({ ...input, ctx, w, h, state, rng });
        },
        dispose(): void {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        },
      };
    },
  };
}
