import { CAR_SKETCHES } from './legosketchcar';
import { WING_SKETCHES } from './legosketchwings';
import type { Sketch } from './drawing/sketch';

/** The F1's reference sketches, by id: what a part of a model really looks like, in the model's
 *  frame, to plan its LEGO against (`npm run lego:sheet -- <id> sketch | sketch3d | compare`), and
 *  the drawing set made from them (`drawing`; an assembly's parts list is `parts`). The drawing
 *  kernel reads them through `drawing/host.ts`. */
export const LEGO_SKETCHES: Record<string, Sketch> = { ...CAR_SKETCHES, ...WING_SKETCHES };

export { itemsOf, partsOf, type Sketch } from './drawing/sketch';
