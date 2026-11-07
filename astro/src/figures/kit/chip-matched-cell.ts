import { chipDetails, chipPad } from './chip-detail';
import { chipFrame, chipPart, chipPlan, chipWire, type ChipPlan } from './chip-plan';
import type { Sketch } from './sketch';

/** An RF/analog terminal is a repeated matched MOS array with five real electrical
 * nodes, not a complementary digital gate row. Shared electrodes are routed as such. */
export function matchedCells(S: Sketch): void {
  S.select([0, 0], 'matched MOS array');
  const plan = chipPlan(S, 'cell');
  chipFrame(S);
  for (let col = 0; col < 3; col++) {
    const x = (col - 1) * 1.08;
    chipPart(plan, `pair${col}`, 'mos-pair', [x - 0.5, -0.25, x + 0.5, 0.25], col === 1);
  }
  chipPad(plan, 'gateA', 'w', 0, 0.055);
  chipPad(plan, 'gateB', 'e', 0, 0.055);
  chipPad(plan, 'drainA', 'w', -0.7, 0.055);
  chipPad(plan, 'drainB', 'e', 0.7, 0.055);
  chipPart(plan, 'source', 'pad', [-0.035, -0.83, 0.035, -0.76]);
  for (const c of plan.components.filter((c) => c.kind === 'mos-pair')) {
    chipWire(S, plan, 'source:s2', `${c.id}:n2`, 2);
    chipWire(S, plan, 'gateA:e2', `${c.id}:w2`, 2);
    chipWire(S, plan, 'gateB:w2', `${c.id}:e2`, 2);
    chipWire(S, plan, 'drainA:e2', `${c.id}:w3`, 2);
    chipWire(S, plan, 'drainB:w2', `${c.id}:e1`, 2);
  }
  plan.matches = [];
  const rendered: ChipPlan = {
    ...plan,
    components: plan.components.map((c) => ({ ...c, selected: false })),
    matches: plan.matches,
  };
  chipDetails(S, rendered);
}
