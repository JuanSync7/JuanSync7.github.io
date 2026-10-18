import type { Vec3 } from './camera';
import type { Plot } from './city';
import { assembly } from './industry';
import { grid, smalls } from './power';

/** The foundry island's two boards. Below, a great storage facility (a warehouse with its
 *  crane yard and loading docks) and a second, enclosed line that builds drive units:
 *  parts go hall to hall on belts under robot gantries; lorries loop between the docks,
 *  the line and the lift where finished units go up. On top, the open car line the units
 *  feed, its chimneys and offices behind, a test track out front. */

/** Where the lower level's units go up: under the car line's first hall. */
const LIFT: [number, number] = [-0.62, -0.02];

export function foundry(P: Plot, k: number): void {
  if (k === 1) {
    assembly(P, -0.52, 0.42, -0.02);
    for (let i = 0; i < 3; i++) P.add('stack', -0.5 + i * 0.36, -0.4, 0.045, 0.045, P.r(0.24, 0.32));
    P.add('factory', 0.0, -0.36, 0.5, 0.14, 0.07);
    P.road(
      Array.from(
        { length: 24 },
        (_, i): Vec3 => [
          0.1 + Math.cos((i / 24) * Math.PI * 2) * 0.42,
          0.004,
          0.33 + Math.sin((i / 24) * Math.PI * 2) * 0.13,
        ],
      ),
      0.045,
    );
    P.trees(0.1, 0.33, 0.5, 0.12, 4, false);
    grid(P, 0.7, -0.4, [
      [0.0, -0.25],
      [0.55, -0.02],
    ]);
    smalls(P, -0.8, 0.45, 3);
  } else {
    // Storage: the warehouse, its crane yard of stacked containers, and docks along its face.
    P.add('warehouse', -0.32, -0.3, 0.7, 0.2, 0.09);
    P.add('crane', 0.25, -0.33, 0.3, 0.2, 0.12);
    for (let i = 0; i < 8; i++)
      P.add('battery', 0.15 + (i % 4) * 0.07, -0.4 + Math.floor(i / 4) * 0.08, 0.06, 0.035, 0.03 + (i % 3) * 0.015);
    // The second line: three halls joined by belts, robot gantries over the belts.
    for (let i = 0; i < 3; i++) P.add('factory', -0.35 + i * 0.35, 0.22, 0.2, 0.14, 0.08);
    for (let i = 0; i < 2; i++) {
      const x0 = -0.25 + i * 0.35;
      P.add('belt', x0 + 0.075, 0.22, 0.15, 0.04, 0.012);
      P.add('gantry', x0 + 0.075, 0.22, 0.025, 0.1, 0.07);
      for (let j = 0; j < 2; j++) P.add('block', x0 + 0.04 + j * 0.07, 0.22, 0.025, 0.02, 0.02, 0.012);
      P.pipe([x0, 0.016, 0.22], [x0 + 0.15, 0.016, 0.22]);
    }
    P.add('hopper', LIFT[0], LIFT[1], 0.07, 0.07, 0.08);
    P.road(
      [
        [-0.75, 0.004, -0.1],
        [0.55, 0.004, -0.1],
        [0.62, 0.004, 0.42],
        [-0.75, 0.004, 0.42],
      ],
      0.05,
    );
    P.road(
      [
        [-0.72, 0.004, -0.15],
        [LIFT[0] + 0.1, 0.004, LIFT[1]],
        [-0.45, 0.004, 0.1],
      ],
      0.04,
    );
    grid(P, 0.7, 0.15, [
      [0.35, 0.22],
      [-0.3, -0.18],
    ]);
    P.trees(0.72, -0.45, 0.16, 0.1, 3, false);
    P.port(LIFT[0], LIFT[1]);
  }
}
