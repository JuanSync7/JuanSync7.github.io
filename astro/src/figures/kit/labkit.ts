import type { Sketch, V3 } from './monoline';
import { TOP } from './labshell';
import { beaker, dish, erlenmeyer, glass, roundFlask, testTube } from './labware';

/** What stands on the bench, left to right after the notebook: a microscope; a retort stand with
 *  a round flask in its ring over a Bunsen burner piped to the gas tap; a rack of test tubes; a
 *  carousel of pipettes; the culture (an open dish, its lid, a stack of plates, a loop); a conical
 *  flask, a beaker with its rod, a vernier caliper, and a balance under its draft shield. */

/** The open dish's agar: where the culture grows (`labculture.ts`). */
export const DISH = { x: 4.22, y: TOP + 0.0105, z: 0.5, r: 0.06 };
/** The burner's mouth: the flame's pivot. */
export const FLAME: V3 = [3.27, TOP + 0.13, 0.24];

const along = (k: Sketch, at: V3, draw: () => void, dir: 'x' | '-x' | 'z'): void =>
  dir === 'z' ? k.at(at, 0, draw, Math.PI / 2) : k.at(at, 0, draw, 0, dir === 'x' ? -Math.PI / 2 : Math.PI / 2);

export function microscope(k: Sketch): void {
  k.object('microscope', () => {
    k.box(2.65, TOP, 0.16, 2.89, TOP + 0.03, 0.44);
    k.box(2.74, TOP + 0.03, 0.16, 2.8, TOP + 0.3, 0.22);
    k.box(2.735, TOP + 0.28, 0.16, 2.805, TOP + 0.34, 0.36);
    for (const x of [2.755, 2.785]) {
      k.at([x, TOP + 0.33, 0.27], 0, () => { k.cyl(0, 0, 0, 0.01, 0.09); k.cyl(0, 0.09, 0, 0.013, 0.02); }, 0.55); // prettier-ignore
    }
    k.cyl(2.77, TOP + 0.255, 0.31, 0.03, 0.025);
    for (let i = 0; i < 3; i++) k.cyl(2.77 + 0.016 * Math.cos(i * 2.1), TOP + 0.2, 0.31 + 0.016 * Math.sin(i * 2.1), 0.007, 0.055); // prettier-ignore
    k.box(2.7, TOP + 0.15, 0.22, 2.84, TOP + 0.165, 0.4);
    k.rect('y', TOP + 0.1655, 2.72, 0.29, 2.82, 0.33);
    along(k, [2.74, TOP + 0.11, 0.19], () => k.cyl(0, 0, 0, 0.028, 0.02), '-x');
    along(k, [2.8, TOP + 0.11, 0.19], () => k.cyl(0, 0, 0, 0.028, 0.02), 'x');
    k.cyl(2.77, TOP + 0.03, 0.31, 0.022, 0.015);
  });
}

export function burner(k: Sketch): void {
  const [cx, cz] = [3.27, 0.24];
  const ring = TOP + 0.21;
  const base = TOP + 0.1864;
  k.object('burner', () => {
    k.box(3.0, TOP, 0.1, 3.4, TOP + 0.02, 0.36);
    k.cyl(3.06, TOP + 0.02, 0.16, 0.008, 0.68);
    for (const y of [ring, TOP + 0.36]) k.box(3.045, y - 0.015, 0.145, 3.075, y + 0.015, 0.175);
    k.at([cx, ring, cz], 0, () => k.torus(0, 0, 0, 0.06, 0.004), Math.PI / 2);
    k.tube(
      [
        [3.075, ring, 0.165],
        [3.214, ring, 0.2186],
      ],
      0.004,
      { sharp: true },
    );
    glass(k, cx, base, cz, roundFlask(0.075, 0.016, 0.24), 0.3);
    k.tube(
      [
        [3.075, TOP + 0.36, 0.165],
        [3.25, TOP + 0.36, 0.232],
      ],
      0.005,
      { sharp: true },
    );
    k.at([cx, TOP + 0.36, cz], 0, () => k.torus(0, 0, 0, 0.021, 0.004), Math.PI / 2);
    // The burner, its collar and the hose to the tap on the upstand.
    k.lathe(cx, TOP + 0.02, cz, [
      [0, 0],
      [0.042, 0],
      [0.042, 0.01],
      [0.02, 0.018],
      [0, 0.018],
    ]);
    k.cyl(cx, TOP + 0.038, cz, 0.011, 0.092);
    k.cyl(cx, TOP + 0.05, cz, 0.014, 0.016);
    k.tube(
      [
        [cx, TOP + 0.045, cz],
        [3.31, TOP + 0.045, 0.21],
      ],
      0.005,
      { sharp: true },
    );
    k.tube([[3.31, TOP + 0.045, 0.21], [3.37, TOP + 0.032, 0.15], [3.425, TOP + 0.024, 0.09], [3.425, TOP + 0.032, 0.05], [3.42, TOP + 0.05, 0.036]], 0.006); // prettier-ignore
    along(k, [3.42, TOP + 0.06, 0.02], () => k.cyl(0, 0, 0, 0.012, 0.03), 'z');
    k.box(3.42, TOP + 0.07, 0.034, 3.48, TOP + 0.08, 0.044);
  });
  k.moving('flame', FLAME, () => {
    k.lathe(
      0,
      0,
      0,
      [
        [0, 0],
        [0.011, 0],
        [0.014, 0.012],
        [0.009, 0.034],
        [0, 0.05],
      ],
      { fill: 'none' },
    );
    k.lathe(
      0,
      0,
      0,
      [
        [0, 0],
        [0.007, 0],
        [0, 0.022],
      ],
      { fill: 'none', tier: 'soft' },
    );
  });
}

export function glassware(k: Sketch): void {
  k.object('tubes', () => {
    k.box(3.52, TOP, 0.42, 3.86, TOP + 0.012, 0.56);
    k.box(3.52, TOP + 0.012, 0.42, 3.535, TOP + 0.1, 0.56);
    k.box(3.845, TOP + 0.012, 0.42, 3.86, TOP + 0.1, 0.56);
    k.box(3.535, TOP + 0.09, 0.42, 3.845, TOP + 0.1, 0.56);
    [0.5, 0.3, 0.65, 0, 0.4].forEach((level, i) => {
      const x = 3.57 + i * 0.065;
      glass(k, x, TOP + 0.012, 0.49, testTube(0.011, 0.15), level);
      k.circle([x, TOP + 0.1005, 0.49], 0.014, 'y', 'soft', 16);
    });
  });
  k.object('pipettes', () => {
    k.lathe(3.98, TOP, 0.28, [
      [0, 0],
      [0.07, 0],
      [0.07, 0.012],
      [0.05, 0.018],
      [0, 0.018],
    ]);
    k.cyl(3.98, TOP + 0.018, 0.28, 0.008, 0.34);
    k.cyl(3.98, TOP + 0.32, 0.28, 0.06, 0.012);
    const pip: [number, number][] = [[0, 0], [0.0025, 0], [0.006, 0.07], [0.009, 0.08], [0.011, 0.09], [0.012, 0.2], [0.016, 0.215], [0.016, 0.255], [0.01, 0.265], [0.005, 0.265], [0.005, 0.29], [0.009, 0.29], [0.009, 0.3], [0, 0.3]]; // prettier-ignore
    for (const a of [0.5, 2.6, 4.7]) k.lathe(3.98 + 0.045 * Math.cos(a), TOP + 0.05, 0.28 + 0.045 * Math.sin(a), pip);
  });
  k.object('culture', () => {
    dish(k, DISH.x, TOP, DISH.z, 0.072);
    k.lathe(DISH.x, TOP, 0.3, [[0, 0], [0.074, 0], [0.074, 0.012], [0.072, 0.012], [0.072, 0.002], [0, 0.002]], { fill: 'none' }); // prettier-ignore
    for (let i = 0; i < 3; i++) {
      dish(k, 4.42, TOP + i * 0.016, 0.3, 0.07);
      k.cyl(4.42, TOP + 0.002 + i * 0.016, 0.3, 0.072, 0.014, { fill: 'none', tier: 'soft' });
    }
    along(k, [4.34, TOP + 0.006, 0.44], () => { k.cyl(0, 0, 0, 0.006, 0.12); k.cyl(0, 0.12, 0, 0.0015, 0.06); }, 'z'); // prettier-ignore
    k.circle([4.34, TOP + 0.006, 0.626], 0.006, 'y', 'edge', 12);
  });
  k.object('flask', () => glass(k, 4.62, TOP, 0.28, erlenmeyer(0.075, 0.21), 0.35));
  k.object('beaker', () => {
    glass(k, 4.86, TOP, 0.5, beaker(0.055, 0.12), 0.5);
    for (let y = TOP + 0.03; y < TOP + 0.11; y += 0.02) k.line([[4.866, y, 0.5545], [4.886, y, 0.5525]]); // prettier-ignore
    k.tube(
      [
        [4.85, TOP + 0.008, 0.51],
        [4.93, TOP + 0.17, 0.44],
      ],
      0.003,
      { fill: 'none', sharp: true },
    );
  });
}

export function instruments(k: Sketch): void {
  k.object('wash bottle', () => {
    k.lathe(3.2, TOP, 0.58, [[0, 0], [0.034, 0], [0.036, 0.02], [0.036, 0.12], [0.026, 0.145], [0.012, 0.15], [0, 0.15]]); // prettier-ignore
    k.cyl(3.2, TOP + 0.15, 0.58, 0.014, 0.022);
    k.tube([[3.2, TOP + 0.17, 0.58], [3.2, TOP + 0.215, 0.58], [3.215, TOP + 0.23, 0.58], [3.27, TOP + 0.205, 0.58], [3.285, TOP + 0.18, 0.58]], 0.003); // prettier-ignore
  });
  k.object('timer', () => {
    k.box(3.64, TOP, 0.62, 3.76, TOP + 0.055, 0.7);
    k.rect('z', 0.701, 3.655, TOP + 0.012, 3.745, TOP + 0.043);
    for (const x of [3.67, 3.73]) k.cyl(x, TOP + 0.055, 0.66, 0.009, 0.008);
  });
  k.object('goggles', () => {
    const lens = (cx: number): [number, number][] =>
      Array.from({ length: 9 }, (_, i): [number, number] => [cx + Math.cos(-Math.PI / 2 + (i / 8) * Math.PI) * 0.04 * Math.sign(cx), Math.sin(-Math.PI / 2 + (i / 8) * Math.PI) * 0.033]); // prettier-ignore
    const right = lens(0.04);
    const left = lens(-0.04).reverse();
    const outline: [number, number][] = [...right, [0.012, 0.033], [0, 0.022], [-0.012, 0.033], ...left, [-0.012, -0.033], [0, -0.026], [0.012, -0.033]]; // prettier-ignore
    k.at(
      [2.96, TOP, 0.605],
      0.15,
      () => {
        k.slab(outline, 0, 0.028);
        k.tube([[0.08, 0.004, 0.008], [0.11, -0.04, 0.008], [0, -0.075, 0.008], [-0.11, -0.04, 0.008], [-0.08, 0.004, 0.008]], 0.005); // prettier-ignore
      },
      -Math.PI / 2,
    );
    for (const dx of [-0.04, 0.04]) k.at([2.96, TOP + 0.0285, 0.605], 0.15, () => k.circle([dx, 0, 0], 0.024, 'y', 'soft', 20)); // prettier-ignore
  });
  k.object('caliper', () => {
    k.box(4.5, TOP, 0.655, 4.82, TOP + 0.004, 0.672);
    k.box(4.5, TOP, 0.6, 4.52, TOP + 0.004, 0.655);
    k.box(4.62, TOP, 0.645, 4.69, TOP + 0.009, 0.69);
    k.box(4.67, TOP, 0.6, 4.69, TOP + 0.004, 0.645);
    k.circle([4.655, TOP + 0.0095, 0.6675], 0.016, 'y', 'soft', 20);
    for (let x = 4.53; x < 4.61; x += 0.01) k.line([[x, TOP + 0.0045, 0.658], [x, TOP + 0.0045, 0.664]], 'faint'); // prettier-ignore
  });
  k.object('balance', () => {
    k.box(4.98, TOP, 0.1, 5.22, TOP + 0.06, 0.42);
    k.rect('z', 0.421, 5.03, TOP + 0.015, 5.13, TOP + 0.045);
    k.box(5.0, TOP + 0.06, 0.12, 5.2, TOP + 0.27, 0.36, { fill: 'none', tier: 'soft' });
    k.cyl(5.1, TOP + 0.06, 0.24, 0.006, 0.015);
    k.cyl(5.1, TOP + 0.075, 0.24, 0.045, 0.005);
  });
}
