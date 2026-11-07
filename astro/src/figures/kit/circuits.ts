import { analogLayout } from './chip-analog-layout';
import { physicalCells, physicalDatapath } from './chip-cells';
import { chipDetails } from './chip-detail';
import { chipFrame, chipPart, chipPlan } from './chip-plan';
import { chipBond } from './chip-bond';
import { registerChildPads } from './chip-package-pins';
import { inset, type Sketch } from './sketch';

export function analogBlock(S: Sketch): void {
  analogLayout(S, 'core');
}
export { physicalDatapath as datapath, physicalCells as cells };

/** A ceramic package cutaway: pin-one, a sealed cavity, ordered lead fingers, and one
 * bond from every package lead to its corresponding die-edge pad. No radial fanout
 * converges on the die centre, and no bond wire ends on an empty patch of substrate. */
export function bonded(S: Sketch): void {
  S.select([S.r(-0.09, 0.09), S.r(-0.035, 0.035)], 'die');
  const plan = chipPlan(S, 'package');
  chipFrame(S);
  chipPart(plan, 'die', 'die', S.win, true).ports = [];
  S.rect(inset(S.win, -0.12), 1);
  S.rect(inset(S.win, -0.15), 2);
  for (const link of registerChildPads(S, plan)) chipBond(S, plan, link.lead, link.target);
  chipDetails(S, plan);
}
