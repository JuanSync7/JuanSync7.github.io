import type { Sketch, V3 } from './monoline';

/** The furniture on the floor: a trolley carrying the mouse enclosure (an empty glass tank with
 *  bedding, a running wheel, a hut, a wire lid and a water bottle), the lab chair at the bench and
 *  a stool by the sink. */

const z90 = Math.PI / 2;

export function cart(k: Sketch): void {
  k.object('cart', () => {
    const corners: [number, number][] = [[5.47, 0.1], [6.23, 0.1], [5.47, 0.68], [6.23, 0.68]]; // prettier-ignore
    for (const [x, z] of corners) {
      k.cyl(x, 0.07, z, 0.014, 0.72);
      k.box(x - 0.015, 0.05, z - 0.008, x + 0.015, 0.07, z + 0.008);
      k.at([x, 0.028, z], 0, () => k.cyl(0, -0.01, 0, 0.026, 0.02), z90);
    }
    k.box(5.45, 0.76, 0.08, 6.25, 0.79, 0.7);
    k.box(5.45, 0.18, 0.08, 6.25, 0.21, 0.7);
    k.tube(
      [
        [6.25, 0.78, 0.16],
        [6.32, 0.84, 0.16],
        [6.32, 0.84, 0.62],
        [6.25, 0.78, 0.62],
      ],
      0.01,
      { sharp: true },
    );
  });
  k.object('cart stock', () => {
    k.box(5.52, 0.21, 0.14, 5.86, 0.4, 0.56);
    k.rect('z', 0.561, 5.6, 0.26, 5.78, 0.34);
    k.box(5.92, 0.21, 0.2, 6.16, 0.3, 0.5, { tier: 'soft' });
  });
}

export function cage(k: Sketch): void {
  k.object('cage', () => {
    k.box(5.5, 0.79, 0.13, 6.2, 1.1, 0.64, { fill: 'none' });
    k.box(5.505, 0.79, 0.135, 6.195, 0.825, 0.635, { tier: 'soft' });
    for (let i = 0; i < 40; i++) {
      const [x, z] = [5.52 + ((i * 37) % 67) / 100, 0.15 + ((i * 53) % 47) / 100];
      k.line([[x, 0.8255, z], [x + 0.012, 0.8255, z + ((i % 3) - 1) * 0.006]], 'faint'); // prettier-ignore
    }
    // The wire lid and its hopper.
    k.box(5.49, 1.1, 0.12, 6.21, 1.12, 0.14);
    k.box(5.49, 1.1, 0.63, 6.21, 1.12, 0.65);
    k.box(5.49, 1.1, 0.14, 5.51, 1.12, 0.63);
    k.box(6.19, 1.1, 0.14, 6.21, 1.12, 0.63);
    for (let x = 5.55; x < 6.19; x += 0.04) k.line([[x, 1.116, 0.14], [x, 1.116, 0.63]], 'faint'); // prettier-ignore
    k.box(5.8, 1.03, 0.3, 5.98, 1.115, 0.47, { fill: 'none', tier: 'soft' });
    // The running wheel on its stand.
    const [wx, wy] = [5.66, 0.94];
    for (const z of [0.34, 0.42]) {
      k.torus(wx, wy, z, 0.09, 0.004);
      for (let a = 0; a < 6; a++) k.line([[wx, wy, z], [wx + Math.cos(a * 1.047) * 0.09, wy + Math.sin(a * 1.047) * 0.09, z]]); // prettier-ignore
    }
    for (let a = 0; a < 24; a++) {
      const [c, s] = [Math.cos(a * 0.2618) * 0.09, Math.sin(a * 0.2618) * 0.09];
      k.line([[wx + c, wy + s, 0.34], [wx + c, wy + s, 0.42]], 'faint'); // prettier-ignore
    }
    k.at([wx, wy, 0.33], 0, () => k.cyl(0, 0, 0, 0.006, 0.11), z90);
    k.box(wx - 0.005, 0.825, 0.44, wx + 0.005, wy, 0.45);
    k.box(wx - 0.04, 0.825, 0.42, wx + 0.04, 0.83, 0.47);
    // A hut with an arched door.
    k.box(5.92, 0.825, 0.42, 6.12, 0.94, 0.6);
    const arch: V3[] = Array.from({ length: 11 }, (_, i): V3 => [6.02 + Math.cos((i / 10) * Math.PI) * 0.035, 0.87 + Math.sin((i / 10) * Math.PI) * 0.035, 0.601]); // prettier-ignore
    k.line([[6.055, 0.825, 0.601], ...arch, [5.985, 0.825, 0.601]]);
    // The water bottle, clipped outside the front glass, its spout through it.
    k.lathe(6.05, 0.98, 0.666, [[0, 0], [0.008, 0], [0.008, 0.02], [0.022, 0.03], [0.022, 0.18], [0.016, 0.19], [0, 0.19]]); // prettier-ignore
    k.tube(
      [
        [6.05, 0.985, 0.666],
        [6.05, 0.96, 0.645],
        [6.05, 0.95, 0.6],
      ],
      0.003,
    );
    k.box(6.02, 1.06, 0.64, 6.08, 1.075, 0.646);
  });
}

/** The chair at the bench: five legs on casters, a gas column with a foot ring, seat and back. */
export function chair(k: Sketch): void {
  const [cx, cz] = [3.0, 1.22];
  k.object('chair', () => {
    for (let i = 0; i < 5; i++)
      k.at([cx, 0, cz], (i / 5) * Math.PI * 2 + 0.3, () => {
        k.box(0.03, 0.06, -0.016, 0.29, 0.09, 0.016);
        k.box(0.255, 0.045, -0.008, 0.285, 0.06, 0.008);
        k.at([0.27, 0.028, 0], 0, () => k.cyl(0, -0.01, 0, 0.026, 0.02), z90);
      });
    k.cyl(cx, 0.05, cz, 0.05, 0.06);
    k.cyl(cx, 0.11, cz, 0.024, 0.42);
    k.cyl(cx, 0.11, cz, 0.034, 0.19);
    k.at([cx, 0.32, cz], 0, () => k.torus(0, 0, 0, 0.19, 0.008), z90);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      k.tube([[cx + Math.cos(a) * 0.024, 0.32, cz + Math.sin(a) * 0.024], [cx + Math.cos(a) * 0.185, 0.32, cz + Math.sin(a) * 0.185]], 0.005, { sharp: true }); // prettier-ignore
    }
    k.box(cx - 0.09, 0.52, cz - 0.09, cx + 0.09, 0.56, cz + 0.09);
    k.lathe(cx, 0.56, cz, [
      [0, 0],
      [0.2, 0],
      [0.225, 0.015],
      [0.23, 0.045],
      [0.215, 0.07],
      [0, 0.075],
    ]);
    k.box(cx - 0.025, 0.53, cz + 0.06, cx + 0.025, 0.555, cz + 0.225);
    k.box(cx - 0.025, 0.555, cz + 0.2, cx + 0.025, 0.86, cz + 0.225);
    k.at([cx, 0, cz], 0, () => k.slab(rounded(0.2, 0.78, 1.06, 0.05), 0.225, 0.28));
  });
  k.object('stool', () => {
    const [sx, sz] = [1.0, 1.9];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      k.tube([[sx + Math.cos(a) * 0.17, 0, sz + Math.sin(a) * 0.17], [sx + Math.cos(a) * 0.12, 0.6, sz + Math.sin(a) * 0.12]], 0.012, { sharp: true }); // prettier-ignore
    }
    k.at([sx, 0.25, sz], 0, () => k.torus(0, 0, 0, 0.155, 0.007), z90);
    k.lathe(sx, 0.6, sz, [
      [0, 0],
      [0.16, 0],
      [0.17, 0.02],
      [0.165, 0.045],
      [0, 0.05],
    ]);
  });
}

/** A rounded rectangle, half-width `w`, from y0 to y1, corner radius `r`. */
function rounded(w: number, y0: number, y1: number, r: number): [number, number][] {
  const out: [number, number][] = [];
  const corner = (cx: number, cy: number, a0: number): void => {
    for (let i = 0; i <= 4; i++)
      out.push([cx + Math.cos(a0 + (i / 4) * z90) * r, cy + Math.sin(a0 + (i / 4) * z90) * r]);
  };
  corner(w - r, y0 + r, -z90);
  corner(w - r, y1 - r, 0);
  corner(-w + r, y1 - r, z90);
  corner(-w + r, y0 + r, Math.PI);
  return out;
}
