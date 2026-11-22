import { defineCanvasFigure } from './define';
import { isometric } from './kit/camera';
import { clear } from './kit/draw';
import { adoptionScene } from './kit/expdesk';
import { knowledgeScene } from './kit/expfiles';
import { platformScene } from './kit/expgate';
import { agentsScene } from './kit/expline';
import { measurementScene } from './kit/expmeter';
import { visibilityScene } from './kit/exprack';
import { adoption, knowledge, measurement } from './kit/expicons';
import { agents, platform, visibility } from './kit/expflows';
import type { Pen } from './kit/hairline';
import { paintSmall, paper, type Paper, type Small } from './kit/hiddenshared';

/** The six experience cards, each a 3D isometric hidden-line drawing, monoline (R-FIG-28): the
 *  thing its card is about, drawn by the drawing kernel's pen, with one motion that says what the
 *  work did. One figure picks its scene from the page's data (`{ kind }`); all six share one
 *  hidden WebGL renderer (`kit/hiddenshared.ts`), so the page holds one context, not six.
 *  adoption: engineers' screens fill one desk after another while IT's padlocked policy cabinet stays shut;
 *  knowledge: the company archive's drawer slides out and a document lifts from it, beside two locked project cabinets;
 *  measurement: a bench meter's needle drops 39 % below its old mark while the crate waits unshipped;
 *  agents: a part rides a conveyor through three task stations, typed square or round, its thread back to the requirement;
 *  platform: a request travels from a team's laptop through the one gateway to a model and back;
 *  visibility: a chart recorder beside the compute rack plots licence use, then its forecast under the cap. */

export const KINDS = ['adoption', 'knowledge', 'measurement', 'agents', 'platform', 'visibility'] as const;
type Kind = (typeof KINDS)[number];
const SCENE: Record<Kind, Small> = {
  adoption: adoptionScene,
  knowledge: knowledgeScene,
  measurement: measurementScene,
  agents: agentsScene,
  platform: platformScene,
  visibility: visibilityScene,
};
/** Without WebGL: the earlier hairline objects. */
const FLAT: Record<Kind, (p: Pen) => void> = { adoption, knowledge, measurement, agents, platform, visibility };

function kindOf(data: unknown): Kind {
  const k = typeof data === 'object' && data !== null && 'kind' in data ? (data as { kind: unknown }).kind : undefined;
  return KINDS.find((x) => x === k) ?? 'adoption';
}

export default defineCanvasFigure<Paper>({
  id: 'experience-icon',
  title: 'Experience icons',
  alt: 'A small isometric line drawing for each experience card: engineers at desks beside a padlocked IT cabinet, a filing archive with a document lifting from an open drawer, a bench meter whose needle drops beside a waiting crate, a conveyor through three task stations, laptops cabled through one gateway to a server rack and a GPU tower, and a chart recorder plotting beside a compute rack.',
  idea: 'Each card gets the scene its work is about, drawn as a hidden-line drawing, and one motion that tells what the work did.',
  style: 'three',
  motion: 'ambient',
  answers: false,
  group: 'post',
  seed: 903,
  aspect: 1.3,
  setup: () => paper(),
  draw: ({ ctx, w, h, t, data, state }) => {
    clear(ctx, w, h);
    const kind = kindOf(data);
    const scene = SCENE[kind];
    if (paintSmall(ctx, state, scene, w, h, t)) return;
    const cam = isometric(w * 0.5, h * 0.66, Math.min(w * 0.8, h * 1.1) * 0.108);
    FLAT[kind]({ ctx, cam, t });
  },
});
