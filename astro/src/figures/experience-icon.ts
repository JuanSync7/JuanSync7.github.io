import { defineCanvasFigure } from './define';
import { isometric } from './kit/camera';
import { clear } from './kit/draw';
import { adoption, knowledge, measurement } from './kit/expicons';
import { agents, platform, visibility } from './kit/expflows';
import type { Pen } from './kit/hairline';

/** The six experience cards as hairline isometric objects (after lucasmarkes/hairline: filled
 *  plates that hide what is behind them, one stroke width, bright silhouettes and dim creases),
 *  one figure picking its object from the page's data (`{ kind }`), each the thing its card is
 *  about, with one motion that says what the work did:
 *  adoption: one console wiring up the desks around it, one by one;
 *  knowledge: a shared filing cabinet with a card drawn out, beside two locked project boxes;
 *  measurement: a bar chart whose one bar (the reranker) drops 39 % below its old height;
 *  agents: a requirement sheet whose path lights hop by hop through a task to its typed output;
 *  platform: teams on one side, models on the other, one gateway between that every call passes;
 *  visibility: a rack of blades scanned top to bottom while the forecast beside it extends. */

export const KINDS = ['adoption', 'knowledge', 'measurement', 'agents', 'platform', 'visibility'] as const;
type Kind = (typeof KINDS)[number];
const DRAW: Record<Kind, (p: Pen) => void> = { adoption, knowledge, measurement, agents, platform, visibility };

function kindOf(data: unknown): Kind {
  const k = typeof data === 'object' && data !== null && 'kind' in data ? (data as { kind: unknown }).kind : undefined;
  return KINDS.find((x) => x === k) ?? 'adoption';
}

export default defineCanvasFigure<null>({
  id: 'experience-icon',
  title: 'Experience icons',
  alt: 'A small hairline isometric object for each experience card: desks wiring up to one console, a filing cabinet beside locked boxes, a bar chart with one bar dropping, a requirement tracing through a task, a gateway between teams and models, a scanned rack beside a forecast.',
  idea: 'Each card gets the object its work is about, drawn as hairline plates, and one motion that tells what the work did.',
  style: 'hairline',
  motion: 'ambient',
  answers: false,
  group: 'post',
  seed: 903,
  aspect: 1.3,
  setup: () => null,
  draw: ({ ctx, w, h, t, data }) => {
    clear(ctx, w, h);
    const cam = isometric(w * 0.5, h * 0.66, Math.min(w * 0.8, h * 1.1) * 0.108);
    DRAW[kindOf(data)]({ ctx, cam, t });
  },
});
