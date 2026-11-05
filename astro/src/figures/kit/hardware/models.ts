import { Draft } from './primitives';
import { processor, memory, board, accelerator } from './silicon';
import { server, storage, networkSwitch, rack } from './infrastructure';
import { cooler, power, sensor, optics } from './devices';
import type { HardwareKind, HardwareModel } from './types';

const BUILDERS = {
  processor,
  memory,
  board,
  server,
  storage,
  switch: networkSwitch,
  rack,
  cooler,
  power,
  accelerator,
  sensor,
  optics,
};
export function hardwareModel(kind: HardwareKind, detail = 4): HardwareModel {
  const draft = new Draft();
  BUILDERS[kind](draft, Math.min(5, Math.max(3, Math.trunc(detail))));
  return { kind, parts: draft.parts };
}
