import { adoptionScene } from './expdesk';
import { knowledgeScene } from './expfiles';
import { platformScene } from './expgate';
import { agentsScene } from './expline';
import { measurementScene } from './expmeter';
import { visibilityScene } from './exprack';
import type { Small } from './hiddenshared';

/** Every small hidden-line scene, by the name its baked file goes by: built and drawn once at the
 *  site's build (`pages/baked/[scene].json.ts`), so a visitor's browser only draws the result. */
export const SMALL = {
  adoption: adoptionScene,
  knowledge: knowledgeScene,
  measurement: measurementScene,
  agents: agentsScene,
  platform: platformScene,
  visibility: visibilityScene,
} satisfies Record<string, Small>;

export type SmallId = keyof typeof SMALL;
