import { box, isoFit, materials, type Swatch } from './swatch';

/** The keyboard's layout for the flat (no-WebGL) drawing of `swatch-keyboard`. The 3D board is
 *  modelled in Blender by `scripts/palette/keyboard_blend.py`, whose ROWS this mirrors: a
 *  Keychron Q1-style 75% with the function row a quarter unit apart and a knob top right. */

type Kind = 'a' | 'm' | 'x' | 'y' | 'k';
const ones = (n: number, k: Kind): [number, Kind][] => Array.from({ length: n }, (): [number, Kind] => [1, k]);
const GAP: [number, Kind] = [-0.25, 'a'];
export const ROWS: [number, Kind][][] = [
  [[1, 'x'], GAP, ...ones(4, 'm'), GAP, ...ones(4, 'a'), GAP, ...ones(4, 'm'), GAP, [1, 'm'], [1, 'k']],
  [...ones(13, 'a'), [2, 'm'], [1, 'm']],
  [[1.5, 'm'], ...ones(12, 'a'), [1.5, 'a'], [1, 'm']],
  [[1.75, 'm'], ...ones(11, 'a'), [2.25, 'x'], [1, 'm']],
  [[2.25, 'm'], ...ones(10, 'a'), [1.75, 'm'], [1, 'y'], [1, 'm']],
  [[1.25, 'm'], [1.25, 'm'], [1.25, 'm'], [6.25, 'a'], ...ones(3, 'm'), ...ones(3, 'y')],
];

/** The board in isometric boxes: case, then each key back to front, the pressed one lower. */
export function flatKeyboard(ctx: CanvasRenderingContext2D, w: number, h: number, s: Swatch, pressed: number): void {
  const m = materials(s);
  const c = isoFit(ctx, w, h, 17, 7.2, 1.6, s.ink);
  box(c, 0, 0, 0, 17, 0.9, 7.2, m.ink);
  const fill = { a: m.paper, m: m.sunk, x: m.accent, y: m.accent2, k: m.ink } as const;
  let n = 0;
  ROWS.forEach((row, r) => {
    let x = 0.5;
    const z = 0.5 + r + (r > 0 ? 0.25 : 0);
    for (const [kw, kind] of row) {
      if (kw > 0) {
        const down = kind !== 'k' && n++ === pressed;
        box(c, x + 0.05, 0.9, z + 0.05, kw - 0.1, kind === 'k' ? 0.7 : down ? 0.25 : 0.45, 0.9, fill[kind]);
      }
      x += Math.abs(kw);
    }
  });
}
