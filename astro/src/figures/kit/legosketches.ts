import type { SketchPart } from './legosketch';

/** Reference sketches, by id: what a part of a model really looks like, in the model's frame, to
 *  plan its LEGO against (`npm run lego:sheet -- <id> sketch | sketch3d | compare`). */

export interface Sketch {
  /** The LEGO model this is drawn for (its plan is laid over the sketch in `compare`). */
  model: string;
  parts: SketchPart[];
}

/** A 2026-rules rear wing (studs of 0.135 m; the F1's frame: rear axle at x = 33, centre line
 *  z = 7). From the 2026 technical rules as reported: three elements stacked up and back, the two
 *  upper ones moving (straight mode), no beam wing below, simplified endplates carrying the
 *  homologated lights, the wing held from below by two straight pillars (no swan neck), a light
 *  spoon to the main plane's leading edge, a larger second element, and a central actuator. The
 *  top sits about 0.9 m up (6.7 studs); the span is 1.08 m (8 studs). Proportions, not a team's
 *  car: no photograph was traced. */
const span = { z0: 3, z1: 11 };
const ENDPLATE: [number, number][] = [
  [35.3, 6.95], [38.95, 6.95], [38.95, 4.3], [38.6, 3.6], [36.3, 3.6], [35.9, 4.6], [35.45, 5.6], [35.15, 6.5],
]; // prettier-ignore
const PILLAR = (z: number): SketchPart => ({
  kind: 'plate',
  outline: [[35.95, 2.9], [36.55, 2.9], [36.75, 5.0], [35.5, 5.0]], // prettier-ignore
  z,
  t: 0.16,
  tone: 'line4',
});

export const LEGO_SKETCHES: Record<string, Sketch> = {
  rearwing: {
    model: 'f1',
    parts: [
      // The three elements: main plane, a larger second element, a short steep third.
      {
        kind: 'foil',
        le: [35.3, 5.05],
        te: [36.65, 5.15],
        ...span,
        t: 0.12,
        camber: 0.05,
        spoon: 0.2,
        tone: 'inkSoft',
      },
      { kind: 'foil', le: [36.35, 5.38], te: [37.98, 5.88], ...span, t: 0.09, camber: 0.06, tone: 'ink2' },
      { kind: 'foil', le: [37.7, 5.98], te: [38.78, 6.72], ...span, t: 0.08, camber: 0.05, tone: 'ink2' },
      // Endplates, with the light on each trailing edge, and the central actuator fairing.
      { kind: 'plate', outline: ENDPLATE, z: span.z0 - 0.08, t: 0.14, tone: 'inkSoft' },
      { kind: 'plate', outline: ENDPLATE, z: span.z1 + 0.08, t: 0.14, tone: 'inkSoft' },
      { kind: 'post', x0: 38.82, x1: 39.0, y0: 4.35, y1: 5.1, z0: span.z0 - 0.17, z1: span.z0 + 0.01, tone: 'signal' },
      { kind: 'post', x0: 38.82, x1: 39.0, y0: 4.35, y1: 5.1, z0: span.z1 - 0.01, z1: span.z1 + 0.17, tone: 'signal' },
      { kind: 'pod', x0: 36.6, x1: 38.4, y: 5.95, z: 7, r: 0.2, tone: 'line4' },
      // Two straight pillars from the crash structure, longer in chord where they meet the wing.
      PILLAR(6.25),
      PILLAR(7.75),
      // Context: the crash structure, its rain light, and the rear tyres.
      { kind: 'post', x0: 34.5, x1: 39.1, y0: 1.6, y1: 2.9, z0: 6, z1: 8, tone: 'line3' },
      { kind: 'post', x0: 39.1, x1: 39.25, y0: 2.0, y1: 2.5, z0: 6.8, z1: 7.2, tone: 'signal' },
      { kind: 'wheel', x: 33, y: 2.7, r: 2.7, z0: 0, z1: 3, tone: 'line2' },
      { kind: 'wheel', x: 33, y: 2.7, r: 2.7, z0: 11, z1: 14, tone: 'line2' },
    ],
  },
};
