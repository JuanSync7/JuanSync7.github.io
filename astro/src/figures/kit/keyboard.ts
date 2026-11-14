import { CylinderGeometry, Group, InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three';
import { DESK, type Kit } from './desk';
import { allSit } from './bounds';

/** A 75% mechanical keyboard: an aluminium case with a raised bezel, sculpted keycaps (square
 *  frustums, wider at the foot) laid out row by row with real key widths, darker modifiers, a
 *  rotary knob, and a coiled cable to the back. Escape and Enter are returned for the accent. */

const U = 0.0195;
/** Rows of [width in key units, kind]: a = alpha, m = modifier. */
const ROWS: [number, 'a' | 'm'][][] = [
  [[1, 'm'], ...Array.from({ length: 12 }, (): [number, 'a'] => [1, 'a']), [1, 'm']],
  [...Array.from({ length: 13 }, (): [number, 'a'] => [1, 'a']), [2, 'm']],
  [[1.5, 'm'], ...Array.from({ length: 12 }, (): [number, 'a'] => [1, 'a']), [1.5, 'm']],
  [[1.75, 'm'], ...Array.from({ length: 11 }, (): [number, 'a'] => [1, 'a']), [2.25, 'm']],
  [[2.25, 'm'], ...Array.from({ length: 10 }, (): [number, 'a'] => [1, 'a']), [1.75, 'm'], [1, 'm']],
  [
    [1.25, 'm'],
    [1.25, 'm'],
    [1.25, 'm'],
    [6.25, 'a'],
    [1, 'm'],
    [1, 'm'],
    [1, 'm'],
    [1, 'm'],
    [1, 'm'],
  ],
];

export interface Keyboard {
  keys: InstancedMesh;
  rest: Matrix4[];
  /** Per key: modifier or not. */
  mod: boolean[];
  /** Escape and Enter, which take the signal. */
  lit: number[];
}

export function keyboard(k: Kit, root: Group, owned: { dispose(): void }[]): Keyboard {
  const board = new Group();
  board.position.set(-0.12, DESK.top + 0.012, 0.17);
  board.rotation.x = (5 * Math.PI) / 180;
  root.add(board);
  const width = 15.5 * U + 0.022;
  const depth = 6 * U + 0.03;
  const shell = k.add(k.rounded(width, 0.022, depth, 0.006), k.mat('keyCase', 0.3, 0.8), [0, 0, 0], board);
  k.add(k.rounded(width - 0.012, 0.004, depth - 0.012, 0.002), k.mat('bezel', 0.6, 0.2), [0, 0.011, 0], board);
  const cap = new CylinderGeometry(0.36, 0.5, 1, 4, 1);
  cap.rotateY(Math.PI / 4);
  cap.scale(Math.SQRT2, 1, Math.SQRT2);
  owned.push(cap);
  const count = ROWS.reduce((n, r) => n + r.length, 0);
  const keys = new InstancedMesh(cap, k.mat('key', 0.65, 0), count);
  keys.castShadow = true;
  keys.receiveShadow = true;
  const rest: Matrix4[] = [];
  const mod: boolean[] = [];
  const lit: number[] = [0];
  const q = new Quaternion();
  ROWS.forEach((row, r) => {
    let x = -width / 2 + 0.011;
    row.forEach(([w, kind], c) => {
      if (r === 3 && c === row.length - 1) lit.push(rest.length);
      const m = new Matrix4().compose(
        new Vector3(x + (w * U) / 2, 0.019 - r * 0.0006, -depth / 2 + 0.015 + (r + 0.5) * U),
        q,
        new Vector3(w * U - 0.0025, 0.011, U - 0.0025),
      );
      keys.setMatrixAt(rest.length, m);
      rest.push(m);
      mod.push(kind === 'm');
      x += w * U;
    });
  });
  board.add(keys);
  allSit(keys, () => shell, 'key', { axes: 'xz' });
  // A rotary knob over the top right, and a coiled cable out of the back.
  const knob = new CylinderGeometry(0.009, 0.009, 0.014, 16);
  owned.push(knob);
  k.add(knob, k.mat('metal', 0.3, 0.9), [width / 2 - 0.016, 0.02, -depth / 2 + 0.012], board);
  for (let i = 0; i < 6; i++) {
    const coil = k.add(
      k.rounded(0.012, 0.012, 0.006, 0.006),
      k.accent,
      [-width / 2 + 0.05, 0.004, -depth / 2 - 0.01 - i * 0.008],
      board,
    );
    coil.rotation.x = 0.4;
  }
  return { keys, rest, mod, lit };
}
