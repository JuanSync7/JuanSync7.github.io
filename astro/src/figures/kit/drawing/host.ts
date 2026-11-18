import { LEGO_SKETCHES } from '../legosketches';

/** What the drawing kernel needs from this site, and the one file of `drawing/` that is the site's
 *  own (the rest are synced from the experience vault's Playbooks/drawing/kernel): its colours by
 *  name, the names a sketch part's tone may take, and the sketches by id. */
export { hexOf } from '../ink';
export type { NightKey as Tone } from '../../../styles/tokens/palette';
export const SKETCHES = LEGO_SKETCHES;
/** The sheet's note on units: the F1's are studs. */
export const unitNote = (scale: number): string => `1 stud = ${Math.round(scale * 1000)} mm real, 8 mm in LEGO.`;
