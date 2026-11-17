/* curl-kernel — the page turn as numbers. Pure: no DOM, no CSS, no timers, so the browser glue
   (page-curl.ts) and the checks (scripts/page-turn/) run the same code. Rules PT-1..PT-8 in
   .claude/skills/page-turn/RULES.md are about this file; `npm run turn:selftest` holds them.

   The turn is a fold line crossing a w by h page from right to left. Past the fold the page has
   lifted; the lifted part lies folded back over the page as its paper back, foreshortened by k
   because it stands up off the pad. Everything the browser does with it is a transform, so the
   turn runs on the compositor and never repaints:

     keepBox   a box whose bottom edge lies on the fold line, covering the side still flat on
               the pad; its overflow clip is what cuts the turning page at the fold.
     keepPage  the exact inverse of keepBox, so the turning page inside it does not move.
     flapFold  reflects the page across the fold and foreshortens it: the paper back's frame.
     flapSheet a paper box whose top edge lies on the fold line, on the lifted side; clipped to
               the page by flapFold's box, it is the lifted part, and its shading is static.

   The boxes reach `span` from where the fold meets the bottom edge: further than any page
   corner ever gets (reach), and no further, because the compositor carries them every frame. */

export const FRAMES = 64;
/** How much further than the furthest corner the boxes reach, as a fraction. */
export const MARGIN = 0.04;
/** Keyframe properties a compositor animates without painting (PT-1). */
export const PROPS: readonly string[] = ['transform', 'opacity', 'offset'];

export interface Fold {
  /** Where the fold line crosses the bottom edge. */
  b: number;
  /** Where it crosses the top edge. */
  a: number;
  /** Angle of the fold line, bottom to top, in radians: always in (-pi, 0). */
  phi: number;
  /** Foreshortening of the lifted part: 1 lies flat, towards 0 stands upright. */
  k: number;
}

export type Layer = 'keepBox' | 'keepPage' | 'flapFold' | 'flapSheet';
export const LAYERS: readonly Layer[] = ['keepBox', 'keepPage', 'flapFold', 'flapSheet'];

export interface Pt {
  x: number;
  y: number;
}

/** Eases in as the corner lifts and out as the page clears, at an even pace between. */
export const ease = (t: number): number => 0.5 - Math.cos(Math.PI * t) / 2;

/** The fold at progress p: 0 flat on the pad, 1 turned clear of it. */
export function fold(p: number, w: number, h: number): Fold {
  const b = w - p * (1.2 * w + 0.15 * h);
  const a = b + h * (0.55 - 0.4 * p);
  return { b, a, phi: Math.atan2(-h, a - b), k: 0.85 - 0.3 * p };
}

/** The furthest any page corner gets from the fold's bottom crossing over a whole turn. */
export function reach(w: number, h: number): number {
  const ends = [fold(0, w, h).b, fold(1, w, h).b];
  return Math.max(...ends.flatMap((b) => [0, w].flatMap((x) => [0, h].map((y) => Math.hypot(x - b, y - h)))));
}

/** How far the boxes reach from the fold, and their sizes (2 span along it, span across). */
export function boxes(w: number, h: number): { span: number; width: number; height: number } {
  const span = Math.ceil(reach(w, h) * (1 + MARGIN));
  return { span, width: 2 * span, height: span };
}

const n = (v: number, d = 2): string => (Object.is(v, -0) ? 0 : v).toFixed(d);

/** The four transforms for one fold. Every string has the same functions in the same order at
 *  every p (PT-2), so the browser interpolates them parameter by parameter and keepBox and
 *  keepPage cancel exactly between keyframes too (PT-3). */
export function transforms(f: Fold, w: number, h: number, span = boxes(w, h).span): Record<Layer, string> {
  const at = `translate(${n(f.b)}px, ${n(h)}px) rotate(${n(f.phi, 5)}rad)`;
  const back = `rotate(${n(-f.phi, 5)}rad) translate(${n(-f.b)}px, ${n(-h)}px)`;
  return {
    keepBox: `${at} translate(${n(-span)}px, ${n(-span)}px)`,
    keepPage: `translate(${n(span)}px, ${n(span)}px) ${back}`,
    flapFold: `${at} scale(1, ${n(-f.k, 4)}) ${back}`,
    flapSheet: `${at} translate(${n(-span)}px, 0px)`,
  };
}

/** Keyframes for every layer of one turn. Forward the old page turns away; back the new page
 *  lays itself down: the same turn played from 1 to 0 (PT-7). Only transform and opacity
 *  appear (PT-1). The page underneath is not dimmed: a filter over a page-tall layer is a pass
 *  over every pixel of it every frame. */
export function timeline(w: number, h: number, back: boolean, frames = FRAMES): Record<Layer, Keyframe[]> {
  const out: Record<Layer, Keyframe[]> = { keepBox: [], keepPage: [], flapFold: [], flapSheet: [] };
  const span = boxes(w, h).span;
  for (let i = 0; i <= frames; i += 1) {
    const e = ease(i / frames);
    const p = back ? 1 - e : e;
    const t = transforms(fold(p, w, h), w, h, span);
    out.keepBox.push({ transform: t.keepBox, opacity: 1 });
    out.keepPage.push({ transform: t.keepPage });
    out.flapFold.push({ transform: t.flapFold, opacity: 1 });
    out.flapSheet.push({ transform: t.flapSheet });
  }
  return out;
}

/* Reference geometry, for the checks and nothing else: where each part of the turn is on the
   screen at progress p, worked out directly rather than through the transforms above. */

/** Which side of the fold a point is on: negative still flat (kept), positive lifted. */
export function side(f: Fold, h: number, q: Pt): number {
  const ux = Math.cos(f.phi);
  const uy = Math.sin(f.phi);
  return (q.x - f.b) * -uy + (q.y - h) * ux;
}

/** Where a lifted point of the page lands on the screen once folded over. */
export function folded(f: Fold, h: number, q: Pt): Pt {
  const ux = Math.cos(f.phi);
  const uy = Math.sin(f.phi);
  const dx = q.x - f.b;
  const dy = q.y - h;
  const along = dx * ux + dy * uy;
  const across = dx * -uy + dy * ux;
  return { x: f.b + along * ux - f.k * across * -uy, y: h + along * uy - f.k * across * ux };
}
