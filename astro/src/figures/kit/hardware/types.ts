import type { Vec3 } from '../camera';

export const HARDWARE_KINDS = [
  'processor',
  'memory',
  'board',
  'server',
  'storage',
  'switch',
  'rack',
  'cooler',
  'power',
  'accelerator',
  'sensor',
  'optics',
] as const;
export type HardwareKind = (typeof HARDWARE_KINDS)[number];
export type HardwareMode = 'isometric' | 'wireframe';
export type HardwareView = 'three-quarter' | 'front' | 'plan';
export interface Surface {
  solid: number;
  points: Vec3[];
  face: boolean;
}
export interface HardwarePart {
  name: string;
  note: string;
  surfaces: Surface[];
}
export interface HardwareModel {
  kind: HardwareKind;
  parts: HardwarePart[];
}
export interface HardwareOptions {
  mode: HardwareMode;
  view: HardwareView;
  open: number;
  pick: number;
}
export const DEFAULT_OPTIONS: HardwareOptions = {
  mode: 'isometric',
  view: 'three-quarter',
  open: 0,
  pick: -1,
};
export const VIEWS: Record<HardwareView, readonly [number, number]> = {
  'three-quarter': [Math.PI / 4, Math.atan(1 / Math.SQRT2)],
  front: [0.12, 0.28],
  plan: [Math.PI / 4, 1.35],
};
export function isHardwareKind(value: unknown): value is HardwareKind {
  return HARDWARE_KINDS.some((kind) => kind === value);
}
