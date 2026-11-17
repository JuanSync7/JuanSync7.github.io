import { cityQueue, cityShapes } from './legocity.ts';
import { F1 } from './legoformula.ts';
import { RIG } from './legorig.ts';
import type { Piece } from './legoset.ts';
import type { Shape } from './legoswap.ts';
import { mulberry32 } from './rng.ts';

/** Every LEGO model, by id: `npm run lego:check` swaps and checks each, `npm run lego:sheet`
 *  draws each stage of one. A new model is a shape list in its own kit file, added here. */
export const LEGO_MODELS: Record<string, Shape[]> = { f1: F1, city: cityShapes(mulberry32(7311)), rig: RIG };
/** Models built by several builders at once name how pieces are shared out (see `build`). */
export const LEGO_QUEUES: Record<string, (p: Piece) => string | null> = { city: cityQueue };
/** Display stands a figure puts a model on, LEGO too: real parts are fitted for these as well. */
export const LEGO_STANDS: Record<string, Shape[]> = {
  f1: [{ kind: 'block', x: -1, y: -2, z: -1, w: 42, d: 16, h: 2, top: 'tiles', tone: 'line2' }],
};
