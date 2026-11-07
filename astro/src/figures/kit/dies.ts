import { analogBlock, bonded, datapath } from './circuits';
import { chipDetails, chipPad } from './chip-detail';
import { chipFrame, chipPart, chipPlan, chipWire } from './chip-plan';
import { chipDecoupling, wireDecoupling } from './chip-power';
import { ERA_DIES } from './eras';
import { BOUND, inset, type Box, type Sketch } from './sketch';

/** The package exposes a central die and symmetric HBM stacks on an interposer.
 * All links stop on real edge contacts; passives stay inside the substrate. */
export function pkg(S: Sketch): void {
  if (S.era !== 'modern') return bonded(S);
  S.select([S.r(-0.09, 0.09), S.r(-0.04, 0.04)], 'die');
  const plan = chipPlan(S, 'package');
  chipFrame(S);
  S.rect(inset(BOUND, 0.08), 1);
  S.rect([-1.5, -0.52, 1.5, 0.52], 1);
  const selected = chipPart(plan, 'die', 'die', S.win, true);
  selected.pinGroups = [
    ['die:n1', 'die:s1'],
    ['die:n3', 'die:s3'],
  ];
  const pairs = S.int(1, 2);
  for (let j = 0; j < pairs; j++)
    for (const side of [-1, 1]) {
      const x = side * 1.06;
      const h = pairs === 1 ? 0.76 : 0.34;
      const y = pairs === 1 ? -0.38 : -0.38 + j * 0.42;
      const id = `hbm${side < 0 ? 'L' : 'R'}${j}`;
      chipPart(plan, id, 'hbm', [x - 0.23, y, x + 0.23, y + h]);
    }
  const banks = plan.lanes === 8 ? 16 : 12;
  chipDecoupling(plan, 'upper', [-1.35, -0.72, 1.35, -0.55], banks);
  chipDecoupling(plan, 'lower', [-1.35, 0.55, 1.35, 0.72], banks);
  for (const side of ['w', 'e'] as const)
    for (const [id, y] of [
      ['upper', -0.6],
      ['lower', 0.6],
    ] as const)
      chipPad(plan, `${id}-${side === 'w' ? 'vdd' : 'vss'}-pin`, side, y, 0.07);
  for (const c of plan.components.filter((c) => c.kind === 'hbm')) {
    const left = c.box[2] < S.win[0];
    const stack = c.id.endsWith('0') ? 0 : 1;
    for (let lane = 1; lane <= 3; lane++) {
      const y = S.win[1] + ((stack * 3 + lane - 0.5) * (S.win[3] - S.win[1])) / (pairs * 3);
      const side = left ? 'w' : 'e';
      const id = `die:${side}-${stack}-${lane}`;
      selected.ports.push({ id, point: [left ? S.win[0] : S.win[2], y], side });
      chipWire(S, plan, `${c.id}:${left ? 'e' : 'w'}${lane}`, id, 2);
    }
  }
  for (const id of ['upper', 'lower']) {
    chipWire(S, plan, `${id}-vdd-pin:e2`, `${id}-vdd:w2`, 2);
    chipWire(S, plan, `${id}-vss-pin:w2`, `${id}-vss:e2`, 2);
    chipWire(S, plan, `${id}-vdd:e2`, `die:${id === 'upper' ? 'n' : 's'}1`, 1);
    chipWire(S, plan, `${id}-vss:w2`, `die:${id === 'upper' ? 'n' : 's'}3`, 1);
    wireDecoupling(S, plan, id, banks);
  }
  for (let x = -1.6; x <= 1.6; x += 0.1)
    for (const y of [-0.79, 0.79]) if (!(x < -1.4 && y < 0)) S.circle(x, y, 0.012, 2);
  chipDetails(S, plan);
}

/** Six repeated core/cache tiles, reserved channels and ordered boundary IO contacts. */
export function die(S: Sketch): void {
  const old = ERA_DIES[S.era as keyof typeof ERA_DIES];
  if (old) return old(S);
  const selectedRow = S.int(0, 1);
  S.select([0, selectedRow ? 0.28 : -0.28], 'core');
  const plan = chipPlan(S, 'die');
  chipFrame(S);
  for (let j = 0; j < 2; j++)
    for (let i = 0; i < 3; i++) {
      const [x, y] = [(i - 1) * 1.06, j ? 0.28 : -0.28];
      chipPart(plan, `core${j}${i}`, 'core', [x - 0.5, y - 0.25, x + 0.5, y + 0.25], i === 1 && j === selectedRow);
    }
  for (const side of ['n', 's'] as const)
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 1.06;
      const y = side === 'n' ? -0.67 : 0.59;
      chipPart(plan, `phy${side}${i}`, 'phy', [x - 0.44, y, x + 0.44, y + 0.08]);
      for (let pin = 1; pin <= 3; pin++) chipPad(plan, `io${side}${i}${pin}`, side, x + (pin - 2) * 0.22, 0.07);
    }
  for (const side of ['w', 'e'] as const)
    for (let i = 0; i < 3; i++) chipPad(plan, `io${side}${i}`, side, -0.42 + i * 0.42, 0.07);
  for (let j = 0; j < 2; j++) {
    for (let i = 0; i < 2; i++) chipWire(S, plan, `core${j}${i}:e2`, `core${j}${i + 1}:w2`, 2);
    for (let i = 0; i < 3; i++) {
      const side = j ? 's' : 'n';
      chipWire(S, plan, `core${j}${i}:${side}2`, `phy${side}${i}:${j ? 'n' : 's'}2`, 2);
      for (let pin = 1; pin <= 3; pin++)
        chipWire(S, plan, `phy${side}${i}:${side}${pin}`, `io${side}${i}${pin}:${j ? 'n' : 's'}2`, 2);
    }
  }
  for (let i = 0; i < 3; i++) chipWire(S, plan, `core0${i}:s2`, `core1${i}:n2`, 2);
  for (const side of ['w', 'e'] as const)
    for (let i = 0; i < 3; i++) {
      const row = i === 0 ? 0 : 1;
      const pin = i === 0 ? 1 : i === 1 ? 1 : 3;
      chipWire(
        S,
        plan,
        `io${side}${i}:${side === 'w' ? 'e' : 'w'}2`,
        `core${row}${side === 'w' ? 0 : 2}:${side}${pin}`,
        2,
      );
    }
  chipDetails(S, plan);
}

/** Caches, decoder/control, register file and repeated execution slices have distinct
 * structures. Buses run through the channels reserved between them. */
export function core(S: Sketch): void {
  if (S.era === 'nmos') return datapath(S);
  if (S.era !== 'modern') return analogBlock(S);
  S.select([0, 0.24], 'cell');
  const plan = chipPlan(S, 'core');
  chipFrame(S);
  chipPart(plan, 'execute', 'logic', S.win, true);
  const parts: [string, string, Box][] = [
    ['icache', 'cache', [-1.59, -0.68, -0.13, -0.34]],
    ['dcache', 'cache', [0.13, -0.68, 1.59, -0.34]],
    ['decode', 'logic', [-1.59, -0.12, -0.79, 0.58]],
    ['vector', 'logic', [0.79, -0.12, 1.59, 0.58]],
    ['registers', 'sram', [-0.5, 0.64, 0.5, 0.78]],
  ];
  for (const [id, kind, box] of parts) chipPart(plan, id, kind, box);
  chipWire(S, plan, 'icache:s2', 'decode:n2', 1);
  chipWire(S, plan, 'decode:e2', 'execute:w2', 1);
  chipWire(S, plan, 'execute:e2', 'vector:w2', 1);
  chipWire(S, plan, 'execute:n3', 'dcache:s2', 1);
  chipWire(S, plan, 'execute:s2', 'registers:n2', 1);
  chipDetails(S, plan);
}

export { cells as cell } from './circuits';
