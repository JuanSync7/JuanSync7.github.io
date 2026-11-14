import { F1 } from './legoformula.ts';
import type { Shape } from './legoswap.ts';

/** Every LEGO model, by id: `npm run lego:check` swaps and checks each, `npm run lego:sheet`
 *  draws each stage of one. A new model is a shape list in its own kit file, added here. */
export const LEGO_MODELS: Record<string, Shape[]> = { f1: F1 };
