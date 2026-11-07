import { BOUND, inset, type Box, type Pt, type Sketch } from './sketch';
import type { ChipComponent, ChipPlan, ChipPort } from './chip-types';
export type { ChipComponent, ChipNet, ChipPlan, ChipPort, ChipSide } from './chip-types';
export { chipWire } from './chip-routing';

export const chipCentre = (b: Box): Pt => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];

export function chipPlan(S: Sketch, level: string): ChipPlan {
  const plan: ChipPlan = {
    type: 'chip',
    level,
    era: S.era,
    components: [],
    nets: [],
    boundary: BOUND,
    unitCount: S.int(1, 3) * 4,
    lanes: 2 ** S.int(1, 3),
    cacheBanks: S.chance(0.5) ? 2 : 4,
    driveStrength: S.int(1, 16),
  };
  S.model = plan;
  return plan;
}

/** Ports are real boundary contacts. Routing never starts at a component's centre. */
export function chipPart(plan: ChipPlan, id: string, kind: string, box: Box, selected = false): ChipComponent {
  const ports: ChipPort[] = [];
  for (const side of ['n', 'e', 's', 'w'] as const)
    for (let i = 1; i <= 3; i++) {
      const u = i / 4;
      const point: Pt =
        side === 'n' || side === 's'
          ? [box[0] + (box[2] - box[0]) * u, side === 'n' ? box[1] : box[3]]
          : [side === 'w' ? box[0] : box[2], box[1] + (box[3] - box[1]) * u];
      ports.push({ id: `${id}:${side}${i}`, point, side });
    }
  const part = { id, kind, box, ports, selected };
  plan.components.push(part);
  return part;
}

export function chipFrame(S: Sketch): void {
  S.rect(BOUND, 0);
  S.rect(inset(BOUND, 0.025), 2);
  S.poly(
    [
      [BOUND[0] + 0.06, BOUND[1] + 0.15],
      [BOUND[0] + 0.06, BOUND[1] + 0.06],
      [BOUND[0] + 0.15, BOUND[1] + 0.06],
    ],
    1,
  );
}
