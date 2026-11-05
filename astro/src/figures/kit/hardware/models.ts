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
const CACHE = new Map<string, HardwareModel>();
export function hardwareModel(kind: HardwareKind, detail = 4): HardwareModel {
  const density = Math.min(5, Math.max(3, Math.trunc(Number.isFinite(detail) ? detail : 4)));
  const key = `${kind}:${density}`;
  const cached = CACHE.get(key);
  if (cached) return cached;
  const draft = new Draft();
  BUILDERS[kind](draft, density);
  const model = { kind, parts: draft.parts };
  CACHE.set(key, model);
  return model;
}
