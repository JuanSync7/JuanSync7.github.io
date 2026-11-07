import type { ChipPlan } from './chip-types';
import type { Pt, Sketch, Tone } from './sketch';

/** A bond wire is a free-span conductor between two landing pads. Its top-down
 * projection follows the ordered fanout directly; it has no routing elbows or vias. */
export function chipBond(S: Sketch, plan: ChipPlan, from: string, to: string): void {
  const ports = plan.components.flatMap((c) => c.ports);
  const a = ports.find((p) => p.id === from),
    b = ports.find((p) => p.id === to);
  if (!a || !b) throw new Error(`bond landing missing: ${from} → ${to}`);
  const points: Pt[] = [[...a.point], [...b.point]];
  plan.nets.push({
    id: `bond${plan.nets.length}`,
    from,
    to,
    points,
    layer: 'bond-wire',
    signal: `bond:${from}`,
    vias: [],
  });
  const retain = (tone: Tone, draw: () => void): void => {
    const start = S.segs[tone].length;
    draw();
    S.interfaceLinework[tone].push(...S.segs[tone].slice(start));
  };
  retain(2, () => S.poly(points, 2));
  for (const p of points) retain(1, () => S.circle(...p, 0.004, 1));
}
