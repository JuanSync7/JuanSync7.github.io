import { guard } from './analog';
import { chipDetails, chipPad } from './chip-detail';
import { chipFrame, chipPart, chipPlan, chipWire, type ChipPlan } from './chip-plan';
import type { Box, Sketch } from './sketch';

/** An illustrative differential signal chain and bias network. The architecture stays
 * fixed while matched device size, passive recipe and bond-pad count vary together.
 * It emulates physical organisation, rather than claiming foundry DRC/LVS signoff. */
export function analogLayout(S: Sketch, level: 'die' | 'core'): ChipPlan {
  S.select([0, 0], level === 'die' ? 'analog block' : S.era === 'bipolar' ? 'bipolar array' : 'matched MOS array');
  const plan = chipPlan(S, level);
  chipFrame(S);
  const bipolar = S.era === 'bipolar';
  const gain = bipolar ? 'bjt-pair' : 'mos-pair';
  const rf = S.era === 'testchip' && level === 'die';
  const width = S.r(0.5, 0.63);
  const height = S.r(0.43, 0.54);
  const leftA: Box = [-1.13 - width / 2, -0.34 - height / 2, -1.13 + width / 2, -0.34 + height / 2];
  const leftB: Box = [leftA[0], -leftA[3], leftA[2], -leftA[1]];
  const rightA: Box = [-leftA[2], leftA[1], -leftA[0], leftA[3]];
  const rightB: Box = [-leftB[2], leftB[1], -leftB[0], leftB[3]];
  chipPart(plan, 'selected', level === 'die' ? 'analog-block' : gain, S.win, true);
  const parts: [string, string, Box][] = [
    ['inputA', rf ? 'spiral' : gain, leftA],
    ['inputB', rf ? 'resistor' : gain, leftB],
    ['load', bipolar ? 'resistor' : 'capacitor', [-0.43, -0.63, 0.43, -0.39]],
    ['output', rf ? 'spiral' : gain, rightA],
    ['compensation', 'capacitor', rightB],
    ['bias', bipolar ? 'resistor' : gain, [-0.43, 0.39, 0.43, 0.63]],
  ];
  for (const [id, kind, box] of parts) chipPart(plan, id, kind, box);
  chipPad(plan, 'inP', 'w', -0.34, 0.12);
  chipPad(plan, 'inN', 'w', 0.34, 0.12);
  chipPad(plan, 'out', 'e', -0.34, 0.12);
  chipPad(plan, 'sense', 'e', 0.34, 0.12);
  chipPad(plan, 'vdd', 'n', -0.52, 0.12);
  chipPad(plan, 'trimP', 'n', 0.52, 0.12);
  chipPad(plan, 'vss', 's', -0.52, 0.12);
  chipPad(plan, 'trimN', 's', 0.52, 0.12);
  const links: [string, string][] = [
    ['inP:e2', 'inputA:w2'],
    ['inputA:e2', 'selected:w1'],
    ['inN:e2', 'inputB:w2'],
    ['inputB:e2', 'selected:w3'],
    ['vdd:s2', 'load:w2'],
    ['load:e2', 'selected:n2'],
    ['selected:e1', 'output:w2'],
    ['output:e2', 'out:w2'],
    ['selected:e3', 'compensation:w2'],
    ['compensation:e2', 'sense:w2'],
    ['vss:n2', 'bias:w2'],
    ['bias:e2', 'selected:s2'],
    ['trimP:s2', 'selected:n3'],
    ['trimN:n2', 'selected:s3'],
  ];
  for (const [a, b] of links) chipWire(S, plan, a, b, 1);
  chipDetails(S, plan);
  // Local guard contacts and equal dimensions keep matched units visibly related.
  if (level === 'core') {
    for (const [, kind, b] of parts) if (kind === gain) guard(S, [b[0] + 0.08, b[1] + 0.08, b[2] - 0.08, b[3] - 0.08]);
    for (const x of [-0.6, 0.6]) for (let y = -0.25; y <= 0.25; y += 0.05) S.dot(x, y);
  }
  return plan;
}
