import { analogBlock, bonded, datapath } from './circuits';
import { chipDetails } from './chip-detail';
import { modernPackage } from './chip-package-layout';
import { modernDie } from './chip-die-layout';
import { chipFrame, chipPart, chipPlan, chipWire } from './chip-plan';
import { ERA_DIES } from './eras';
import { type Box, type Sketch } from './sketch';

/** Packages and dies share typed physical layouts with the independent surface audit. */
export function pkg(S: Sketch): void {
  if (S.era !== 'modern') return bonded(S);
  modernPackage(S);
}

export function die(S: Sketch): void {
  const old = ERA_DIES[S.era as keyof typeof ERA_DIES];
  if (old) return old(S);
  modernDie(S);
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
