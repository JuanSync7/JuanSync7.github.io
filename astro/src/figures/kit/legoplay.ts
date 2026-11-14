/** The standard LEGO build animation, shared by every LEGO figure: the base (order 0) is there
 *  from the first frame and never moves; each piece drops onto the studs below it in its turn,
 *  falling under gravity and settling; the finished model holds; then the pieces lift off, last on
 *  first off, and the base waits for the next build. Times in seconds. */
export interface Timeline {
  build: number;
  hold: number;
  tear: number;
  rest: number;
  /** How long one piece takes to drop on, and to lift off. */
  press: number;
  lift: number;
  /** How far above its place a piece appears, in world units. */
  drop: number;
}

export const loopOf = (t: Timeline): number => t.build + t.hold + t.tear + t.rest;
/** A time in the loop at which the model stands finished. */
export const finishedAt = (t: Timeline): number => t.build + t.hold / 2;

const clamp = (x: number): number => Math.min(1, Math.max(0, x));

/** Height above its place of a piece with build `order` at u seconds into the loop, or null
 *  while it is off the table. */
export function liftAt(order: number, u: number, t: Timeline): number | null {
  if (order === 0) return 0;
  if (u < t.build + t.hold) {
    const k = clamp((u - order * (t.build - t.press)) / t.press);
    return k <= 0 ? null : (1 - k * k) * t.drop;
  }
  const k = clamp((u - t.build - t.hold - (1 - order) * (t.tear - t.lift)) / t.lift);
  return k >= 1 ? null : k * k * t.drop * 2.2;
}
