import { chipDetails, chipPad } from './chip-detail';
import { chipFrame, chipPart, chipPlan, chipWire } from './chip-plan';
import type { Box, Sketch } from './sketch';

/** The 741 die is visibly asymmetric: small matched mirror clusters, long resistors,
 * a dominant compensation plate, then larger output transistors. This is an original
 * floorplan using that organisation; no microscopy pixels or foundry layout are copied. */
export function bipolarDie(S: Sketch): void {
  S.select([-0.34, 0.12], 'input stage');
  const plan = chipPlan(S, 'die');
  chipFrame(S);
  chipPart(plan, 'input', 'input-stage', S.win, true);
  const parts: [string, string, Box][] = [
    ['mirror0', 'bjt-pair', [-1.48, -0.6, -1.01, -0.24]],
    ['mirror1', 'bjt-pair', [-1.48, -0.12, -1.01, 0.24]],
    ['mirror2', 'bjt-pair', [-1.48, 0.36, -1.01, 0.63]],
    ['bias', 'resistor', [-0.76, -0.63, 0.36, -0.36]],
    ['gain', 'bjt-pair', [0.3, -0.17, 0.53, 0.35]],
    ['output', 'bjt-pair', [0.68, -0.63, 1.47, -0.27]],
    ['compensation', 'capacitor', [0.7, -0.08, 1.47, 0.63]],
    ['tail', 'resistor', [-0.78, 0.51, 0.32, 0.64]],
  ];
  for (const [id, kind, box] of parts) chipPart(plan, id, kind, box);
  for (const [id, side, u] of [
    ['inP', 'w', -0.36],
    ['inN', 'w', 0.36],
    ['vdd', 'n', -0.75],
    ['trimP', 'n', 0.75],
    ['out', 'e', -0.36],
    ['sense', 'e', 0.36],
    ['vss', 's', -0.75],
    ['trimN', 's', 0.75],
  ] as const)
    chipPad(plan, id, side, u, 0.115);
  const links: [string, string][] = [
    ['inP:e2', 'input:w1'],
    ['inN:e2', 'input:w3'],
    ['vdd:s2', 'bias:w2'],
    ['bias:e2', 'mirror0:n2'],
    ['mirror0:s2', 'mirror1:n2'],
    ['mirror1:s2', 'mirror2:n2'],
    ['mirror1:e2', 'input:n1'],
    ['mirror2:e2', 'input:s1'],
    ['input:e1', 'gain:w2'],
    ['gain:e2', 'output:w2'],
    ['output:e2', 'out:w2'],
    ['input:e3', 'compensation:w2'],
    ['compensation:e2', 'sense:w2'],
    ['vss:n2', 'tail:w2'],
    ['tail:e2', 'input:s2'],
    ['trimP:s2', 'output:n2'],
    ['trimN:n2', 'input:s3'],
  ];
  for (const [from, to] of links) chipWire(S, plan, from, to, 1);
  chipDetails(S, plan);
}
