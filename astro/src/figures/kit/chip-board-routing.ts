import type { ChipPlan } from './chip-types';
import type { Pt, Sketch } from './sketch';

/** The input supply has a reserved straight strap between socket and DIMM banks.
 * A generic edge channel can otherwise land its vias a few microns from DDR escape. */
export function boardInputStrap(S: Sketch, plan: ChipPlan): void {
  const ports = plan.components.flatMap((c) => c.ports);
  const a = ports.find((p) => p.id === 'power:w2'),
    b = ports.find((p) => p.id === 'vrm:e2');
  if (!a || !b) throw new Error('board power strap terminals missing');
  const points: Pt[] = [[...a.point], [0.56, a.point[1]], [0.56, b.point[1]], [...b.point]];
  const vias = points.slice(1, -1);
  plan.nets.push({
    id: `net${plan.nets.length}`,
    from: a.id,
    to: b.id,
    points,
    layer: 'metal-hv',
    signal: `signal${plan.nets.length}`,
    vias,
  });
  S.poly(points, 1);
  for (const p of [a.point, b.point]) S.rect([p[0] - 0.006, p[1] - 0.006, p[0] + 0.006, p[1] + 0.006], 1);
  for (const p of vias) S.dot(...p);
}
