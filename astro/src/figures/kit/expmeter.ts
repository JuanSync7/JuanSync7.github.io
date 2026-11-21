import type { Sketch, V3 } from './drawing/monoline';
import { cable } from './cable';
import { ease, floor, FRAME, legs, PX } from './expbase';
import type { Small } from './hiddenshared';

/** Measured first (`experience-icon`, measurement): on a test bench, a large analogue meter is
 *  wired to the reranker module (a board under its heatsink), and a shipping crate waits on its
 *  pallet in front. The needle swings down from its old mark to 39 % below it and holds there:
 *  the cost was measured on the bench, before anything went in the crate. */

const TOP = 0.9;
const FACE = 0.82;
/** The dial's centre and radius, on the meter's face. */
const DIAL: V3 = [0.9, 1.16, FACE];
const R = 0.36;
const OLD = 0.82;
const NEW = OLD * 0.61;
const CYCLE = 8;
/** The dial's angle for a reading v (0..1): 150° at zero, 30° at full scale. */
const angle = (v: number): number => ((150 - 120 * v) * Math.PI) / 180;

function bench(k: Sketch): void {
  k.object('bench', () => {
    k.box(0.28, TOP - 0.04, 0.18, 2.32, TOP, 0.92);
    legs(k, 0.3, 0.2, 2.3, 0.9, TOP - 0.04, 0.05);
    k.box(0.35, 0.16, 0.25, 2.25, 0.19, 0.85, { tier: 'soft' });
    k.box(0.28, TOP, 0.18, 2.32, 1.12, 0.21);
  });
}

function meter(k: Sketch): void {
  const [cx, cy] = [DIAL[0], DIAL[1]];
  const at = (r: number, v: number, z = FACE + 0.001): V3 => [
    cx + r * Math.cos(angle(v)),
    cy + r * Math.sin(angle(v)),
    z,
  ];
  k.object('meter', () => {
    k.box(0.42, TOP, 0.3, 1.38, 1.62, FACE);
    k.rect('z', FACE + 0.001, 0.48, 1.06, 1.32, 1.56, 'soft');
    k.line(
      Array.from({ length: 41 }, (_, i) => at(R, i / 40)),
      'edge',
    );
    for (let i = 0; i <= 20; i++) k.line([at(R, i / 20), at(i % 5 ? R - 0.03 : R - 0.06, i / 20)], 'faint');
    // The old reading, marked longer and past the scale.
    k.line([at(R + 0.035, OLD), at(R - 0.08, OLD)], 'soft');
    // The terminals the module is wired to, a range knob, the carry handle and the side's vents.
    for (const x of [0.56, 0.66]) k.at([x, 0.98, FACE], 0, () => k.cyl(0, 0, 0, 0.022, 0.045), Math.PI / 2);
    k.at([1.22, 0.98, FACE], 0, () => k.cyl(0, 0, 0, 0.035, 0.03), Math.PI / 2);
    k.box(0.6, 1.62, 0.53, 0.64, 1.68, 0.58);
    k.box(1.16, 1.62, 0.53, 1.2, 1.68, 0.58);
    k.box(0.6, 1.68, 0.53, 1.2, 1.71, 0.58);
    for (let i = 0; i < 8; i++)
      k.line(
        [
          [1.381, 1.5 - i * 0.05, 0.42],
          [1.381, 1.5 - i * 0.05, 0.7],
        ],
        'faint',
      );
  });
  k.moving('needle', DIAL, () => {
    k.box(-0.006, -0.03, 0.004, 0.006, R - 0.02, 0.012, { fill: 'signal', tier: 'hot' });
    k.at([0, 0, 0], 0, () => k.cyl(0, 0, 0, 0.025, 0.02, { tier: 'hot' }), Math.PI / 2);
  });
}

function reranker(k: Sketch): void {
  k.object('reranker', () => {
    k.box(1.6, TOP, 0.45, 1.98, TOP + 0.03, 0.72);
    k.box(1.66, TOP + 0.03, 0.5, 1.9, TOP + 0.05, 0.67);
    for (let i = 0; i < 8; i++) k.box(1.67 + i * 0.03, TOP + 0.05, 0.51, 1.677 + i * 0.03, TOP + 0.13, 0.66);
    k.box(1.56, TOP, 0.53, 1.6, TOP + 0.03, 0.64);
  });
  // The two test leads, module to meter: along the bench in their own lanes, up beside the meter
  // and onto its terminals.
  const lead = (name: string, z: number, x: number, lane: number, post: number): V3[] =>
    cable(k, { name, r: 0.003, px: PX, bend: 0.012, pts: [[1.56, TOP + 0.012, z], [x, TOP + 0.004, z], [x, TOP + 0.004, lane], [post, TOP + 0.004, lane], [post, TOP + 0.004, 0.91], [post, 0.98, 0.91], [post, 0.98, FACE + 0.045]] }); // prettier-ignore
  lead('lead-a', 0.61, 1.52, 0.89, 0.66);
  lead('lead-b', 0.57, 1.48, 0.86, 0.56);
}

function crate(k: Sketch): void {
  k.object('pallet', () => {
    for (const z of [1.4, 1.8, 2.2]) k.box(1.35, 0, z, 2.35, 0.09, z + 0.1);
    for (let i = 0; i < 7; i++) k.box(1.35 + i * 0.148, 0.09, 1.4, 1.46 + i * 0.148, 0.13, 2.3);
  });
  k.object('crate', () => {
    const [x0, x1, z0, z1, y0, y1] = [1.42, 2.28, 1.47, 2.23, 0.13, 0.8];
    k.box(x0, y0, z0, x1, y1, z1);
    k.box(x0 - 0.02, y1, z0 - 0.02, x1 + 0.02, y1 + 0.04, z1 + 0.02);
    for (let i = 1; i < 4; i++) {
      const y = y0 + ((y1 - y0) * i) / 4;
      k.line(
        [
          [x1 + 0.001, y, z0],
          [x1 + 0.001, y, z1],
        ],
        'faint',
      );
      k.line(
        [
          [x0, y, z1 + 0.001],
          [x1, y, z1 + 0.001],
        ],
        'faint',
      );
    }
    for (const [a, b] of [
      [x1, z1 - 0.06],
      [x1 - 0.06, z1],
      [x1, z0],
    ] as const)
      k.box(a, y0, b, a + 0.03, y1, b + 0.06);
    k.rect('z', z1 + 0.001, x0 + 0.12, y0 + 0.36, x0 + 0.36, y0 + 0.5, 'soft');
  });
}

export const measurementScene: Small = {
  frame: FRAME,
  build(k) {
    floor(k);
    bench(k);
    meter(k);
    reranker(k);
    crate(k);
  },
  move(d, t) {
    const u = (t + 0.4) % CYCLE;
    const drop = ease(1.2, 2.0, u) * (1 - ease(6.6, 7.6, u));
    // A meter's needle overshoots and settles.
    const wobble = 0.04 * Math.sin((u - 2.0) * 9) * Math.exp(-(u - 2.0) * 3) * (u > 2.0 ? 1 : 0);
    const v = OLD + (NEW - OLD) * drop - wobble;
    const g = d.moving.get('needle');
    if (g) g.rotation.z = angle(v) - Math.PI / 2;
  },
};
