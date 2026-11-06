import { compute } from './slide-icons/compute';
import { systems } from './slide-icons/systems';
import { data } from './slide-icons/data';
import { research } from './slide-icons/research';
import { workflow } from './slide-icons/workflow';
import { communication } from './slide-icons/communication';

export const SLIDE_ICONS = [...compute, ...systems, ...data, ...research, ...workflow, ...communication] as const;

export type SlideIconId = (typeof SLIDE_ICONS)[number]['id'];
export type SlideGroup = (typeof SLIDE_ICONS)[number]['group'];
export const SLIDE_GROUPS: readonly SlideGroup[] = [
  'compute',
  'systems',
  'data',
  'research',
  'workflow',
  'communication',
];
export function isSlideIcon(value: unknown): value is SlideIconId {
  return SLIDE_ICONS.some((icon) => icon.id === value);
}
export function isSlideGroup(value: unknown): value is SlideGroup {
  return SLIDE_GROUPS.some((group) => group === value);
}
