import { cityQueue, cityShapes } from './legocity.ts';
import { F1 } from './legoformula.ts';
import type { Piece } from './legoset.ts';
import type { Shape } from './legoswap.ts';
import { mulberry32 } from './rng.ts';

/** Every LEGO model, by id: `npm run lego:check` swaps and checks each, `npm run lego:sheet`
 *  draws each stage of one. A new model is a shape list in its own kit file, added here. */
export const LEGO_MODELS: Record<string, Shape[]> = { f1: F1, city: cityShapes(mulberry32(7311)) };
/** Models built by several builders at once name how pieces are shared out (see `build`). */
export const LEGO_QUEUES: Record<string, (p: Piece) => string | null> = { city: cityQueue };
