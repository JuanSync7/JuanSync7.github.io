import { chipDetails, chipPad } from './chip-detail';
import { analogLayout } from './chip-analog-layout';
import { bipolarDie } from './chip-bipolar-layout';
import { chipFrame, chipPart, chipPlan, chipWire } from './chip-plan';
import { inset, type Box, type Sketch } from './sketch';

export function testchip(S: Sketch): void {
  analogLayout(S, 'die');
}
export function bipolar(S: Sketch): void {
  bipolarDie(S);
}

/** ROM/PLA, a repeated bit-sliced datapath, register file and decoder are allocated
 * first. Every bus joins named edge pins through the reserved streets between macros. */
export function nmos(S: Sketch): void {
  S.select([0, 0.25], 'datapath');
  const plan = chipPlan(S, 'die');
  chipFrame(S);
  chipPart(plan, 'datapath', 'logic', S.win, true);
  const parts: [string, string, Box][] = [
    ['rom', 'sram', [-1.5, -0.65, -0.3, -0.3]],
    ['pla', 'sram', [0, -0.65, 1.5, -0.3]],
    ['control', 'logic', [-1.5, -0.1, -0.78, 0.61]],
    ['registers', 'sram', [0.78, -0.1, 1.5, 0.61]],
  ];
  for (const [id, kind, box] of parts) chipPart(plan, id, kind, box);
  for (let i = 0; i < 4; i++) {
    chipPad(plan, `data${i}`, 's', -0.9 + i * 0.6, 0.09);
    chipPad(plan, `ctrl${i}`, 'n', -0.9 + i * 0.6, 0.09);
  }
  chipWire(S, plan, 'rom:s2', 'control:n2', 1);
  chipWire(S, plan, 'pla:s2', 'registers:n2', 1);
  chipWire(S, plan, 'control:e2', 'datapath:w2', 1);
  chipWire(S, plan, 'datapath:e2', 'registers:w2', 1);
  for (let i = 0; i < 4; i++) {
    const left = i < 2;
    const id = left ? 'rom' : 'pla';
    chipWire(S, plan, `ctrl${i}:s2`, `${id}:n${i % 2 ? 3 : 1}`, 2);
    const target = left ? 'control' : 'registers';
    chipWire(S, plan, `data${i}:n2`, `${target}:s${i % 2 ? 3 : 1}`, 2);
  }
  chipDetails(S, plan);
  const pla = parts.find(([id]) => id === 'pla')?.[2];
  if (pla) {
    const r = inset(pla, 0.04);
    for (let x = r[0] + 0.05; x < r[2] - 0.04; x += 0.1)
      for (let y = r[1] + 0.04; y < r[3] - 0.02; y += 0.05) if (S.chance(0.4)) S.dot(x, y);
  }
}

export const ERA_DIES = { testchip, bipolar, nmos } as const;
