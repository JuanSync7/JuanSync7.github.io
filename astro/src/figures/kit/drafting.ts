/** Drafting: the solids of `kit/bodies.ts` for a line drawing (`kit/districtsolids.ts`). A line
 *  drawing draws every fold, so a bevel (made to catch the light on a toned board) becomes a
 *  second outline on every edge, and a twelve-sided round body shows twelve facet lines. While drafting, a bevelled
 *  box is a plain box and a round prism has ROUND_DRAFT sides, under the drawing kernel's 24°
 *  crease, so it is drawn by its outline. */
let on = false;
export const ROUND_DRAFT = 24;
export const drafting = (): boolean => on;
export function drafted<T>(make: () => T): T {
  const was = on;
  on = true;
  try {
    return make();
  } finally {
    on = was;
  }
}
