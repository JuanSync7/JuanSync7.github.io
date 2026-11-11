import { chipDetails } from './chip-detail';
import { chipFrame, chipPart, chipPlan, chipWire } from './chip-plan';
import { chipDecoupling, wireDecoupling } from './chip-power';
import { makeBoardLayout } from './chip-board-layout';
import { paintBoardLayout } from './chip-board-paint';
import { boardInputStrap } from './chip-board-routing';
import type { BoardLayout } from './chip-board-types';
import { inset, type Box, type Sketch } from './sketch';

/** Reserve component neighborhoods before routing. The visual variant changes
 * memory population, VRM phase count and controller packaging, never random clutter. */
export function buildBoard(S: Sketch): void {
  S.select([S.r(-0.37, -0.22), S.r(-0.12, -0.04)], 'package');
  const plan = chipPlan(S, 'board');
  const variant: BoardLayout['variant'] =
    (['embedded', 'instrument', 'workstation'] as const)[S.int(0, 2)] ?? 'workstation';
  chipFrame(S);
  const socket = chipPart(plan, 'socket', 'socket', S.win, true);
  socket.pinGroups = [['socket:n2', 'socket:s3']];
  S.rect(inset(S.win, -0.045), 1);
  for (const [i, [x, y]] of [
    [-1.73, -0.77],
    [1.73, -0.77],
    [-1.73, 0.77],
    [1.73, 0.77],
  ].entries())
    chipPart(plan, `mount${i}`, 'mount-hole', [x - 0.04, y - 0.04, x + 0.04, y + 0.04]);
  const count = variant === 'workstation' ? 4 : variant === 'embedded' ? 2 : 3;
  for (let i = 0; i < count; i++) {
    const y = -0.63 + i * 0.17;
    chipPart(plan, `dimm${i}`, 'dimm', [0.65, y, 1.55, y + 0.065]);
  }
  const parts: [string, string, Box][] = [
    ['vrm', 'vrm', [-1.12, -0.72, 0.2, -0.53]],
    ['power', 'io', [0.7, 0.15, 1.55, 0.25]],
    ['chipset', 'logic', [-1.18, 0.3, -0.65, 0.71]],
    ['io0', 'io', [-1.67, -0.65, -1.47, -0.1]],
    ['io1', 'io', [-1.67, 0.05, -1.47, 0.6]],
    ['pcie0', 'pcie', [-0.35, 0.52, 1.35, 0.61]],
    ['pcie1', 'pcie', [-0.35, 0.72, 1.35, 0.81]],
    ['flash', 'flash', [0.83, 0.31, 1.11, 0.47]],
    ['crystal', 'crystal', [-1.4, 0.66, -1.24, 0.74]],
  ];
  for (const [id, kind, box] of parts) chipPart(plan, id, kind, box);
  const vrm = plan.components.find((c) => c.id === 'vrm');
  if (vrm) vrm.pinGroups = [['vrm:s1', 'vrm:s2', 'vrm:s3']];
  const caps = plan.lanes === 8 ? 8 : 6;
  chipDecoupling(plan, 'core-power', [-0.5, 0.27, 0.47, 0.45], caps);
  const backbone = [
    ['vrm:s2', 'socket:n2', 1],
    ['io0:e2', 'socket:w1', 2],
    ['io1:e2', 'chipset:w2', 2],
    ['chipset:n2', 'socket:s1', 2],
    ['chipset:e1', 'pcie0:w2', 2],
    ['chipset:e3', 'pcie1:w2', 2],
    ['vrm:s3', 'core-power-vdd:w2', 1],
    ['power:e2', 'core-power-vss:e2', 1],
    ['socket:s3', 'core-power-vdd:n2', 1],
    ['socket:s2', 'core-power-vss:w2', 1],
  ] as const;
  const support = [
    ['vrm:n2', 'core-power-vss:n2', 1],
    ['flash:w2', 'chipset:e2', 2],
    ['crystal:e2', 'chipset:w3', 2],
    ['crystal:w2', 'chipset:s1', 2],
  ] as const;
  const lanes = count === 4 ? [0.13, 0.36, 0.57, 0.88] : count === 3 ? [0.16, 0.43, 0.84] : [0.19, 0.83];
  const ddr: [string, string][] = [],
    memory: [string, string][] = [];
  for (let i = 0; i < count; i++) {
    const u = lanes[i] ?? 0.4,
      id = `socket:ddr${i}`;
    socket.ports.push({ id, point: [socket.box[2], socket.box[1] + (socket.box[3] - socket.box[1]) * u], side: 'e' });
    ddr.push([id, `dimm${i}:w1`]);
    memory.push([`socket:e${i % 2 ? 3 : 1}`, `dimm${i}:w2`]);
  }
  const decaps = Array.from({ length: caps }, (_v, i) => [
    `core-power-cap${i}:n2`,
    `core-power-vdd:tap${i}`,
    `core-power-cap${i}:s2`,
    `core-power-vss:tap${i}`,
  ]);
  plan.routePorts = [
    ...new Set([
      ...memory.flat(),
      'power:w2',
      'vrm:e2',
      ...backbone.flatMap(([a, b]) => [a, b]),
      ...support.flatMap(([a, b]) => [a, b]),
      ...decaps.flat(),
      ...ddr.flat(),
    ]),
  ];
  for (const [a, b] of memory) chipWire(S, plan, a, b, 2);
  boardInputStrap(S, plan);
  for (const [a, b, t] of backbone) chipWire(S, plan, a, b, t);
  wireDecoupling(S, plan, 'core-power', caps);
  for (const [a, b, t] of support) chipWire(S, plan, a, b, t);
  for (const [a, b] of ddr) chipWire(S, plan, a, b, 2);
  // These are real connected decouplers, not a second generic texture on the PCB.
  chipDetails(S, { ...plan, components: plan.components.filter((c) => c.kind === 'decap' || c.kind === 'power-rail') });
  plan.board = makeBoardLayout(plan, variant);
  paintBoardLayout(S, plan.board);
}
