import { PAPER_ACTION } from './paper-action';
import type { Blueprint } from './types';

/** Every component with a blueprint. Add a spec file and list it here. */
export const BLUEPRINTS: Record<string, Blueprint> = { [PAPER_ACTION.id]: PAPER_ACTION };
export type { Blueprint, Measure, Part, Size, Sizing } from './types';
