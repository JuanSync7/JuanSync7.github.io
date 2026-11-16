import type { SketchPart } from './legosketch';

/** Reference sketches, by id: what a part of a model really looks like, in the model's frame, to
 *  plan its LEGO against (`npm run lego:sheet -- <id> sketch | sketch3d | compare`). */

export interface Sketch {
  /** The LEGO model this is drawn for (its plan is laid over the sketch in `compare`). */
  model: string;
  /** The part's name on its drawing, and the real metres one stud stands for. */
  title: string;
  scale: number;
  /** When the sketch was last drawn, for its drawing's title block. */
  drawn: string;
  /** Where section A-A cuts across the span (z, studs): through every element. */
  cut: number;
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
/** A 2026-rules front wing, same frame and scale: from the rules as reported - a fixed main plane
 *  low to the ground with a two-element active flap above it, 100 mm narrower than before
 *  (1.8 m here), arrowhead-like in plan, lower, with a broader, wider footplate, simpler
 *  elements and more prescriptive endplates; held from the nose by two pylons. Proportions, not
 *  a team's car; no photograph was traced. */
const FW_ENDPLATE: [number, number][] = [
  [0.0, 0.2], [4.4, 0.2], [4.4, 1.2], [4.0, 2.05], [2.6, 2.35], [0.9, 2.2], [0.15, 1.6], [-0.1, 0.8],
]; // prettier-ignore
const ENDPLATE: [number, number][] = [
  [35.3, 6.95], [38.95, 6.95], [38.95, 4.3], [38.6, 3.6], [36.3, 3.6], [35.9, 4.6], [35.45, 5.6], [35.15, 6.5],
]; // prettier-ignore
const PILLAR = (z: number): SketchPart => ({
  kind: 'plate',
  outline: [[35.95, 2.9], [36.55, 2.9], [36.75, 5.0], [35.5, 5.0]], // prettier-ignore
  z,
  t: 0.16,
  tone: 'line4',
  explode: [0, -1, 0],
});

export const LEGO_SKETCHES: Record<string, Sketch> = {
  rearwing: {
    model: 'f1',
    title: 'Rear wing, 2026 rules',
    scale: 0.135,
    drawn: '2026-11-14',
    cut: 5,
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
      {
        kind: 'foil',
        le: [36.35, 5.38],
        te: [37.98, 5.88],
        ...span,
        t: 0.09,
        camber: 0.06,
        tone: 'ink2',
        explode: [0, 0.7, 0],
      },
      {
        kind: 'foil',
        le: [37.7, 5.98],
        te: [38.78, 6.72],
        ...span,
        t: 0.08,
        camber: 0.05,
        tone: 'ink2',
        explode: [0, 1.4, 0],
      },
      // Endplates, with the light on each trailing edge, and the central actuator fairing.
      { kind: 'plate', outline: ENDPLATE, z: span.z0 - 0.08, t: 0.14, tone: 'inkSoft', explode: [0, 0, -1.2] },
      { kind: 'plate', outline: ENDPLATE, z: span.z1 + 0.08, t: 0.14, tone: 'inkSoft', explode: [0, 0, 1.2] },
      {
        kind: 'post',
        x0: 38.82,
        x1: 39.0,
        y0: 4.35,
        y1: 5.1,
        z0: span.z0 - 0.17,
        z1: span.z0 + 0.01,
        tone: 'signal',
        explode: [0, 0, -1.2],
      },
      {
        kind: 'post',
        x0: 38.82,
        x1: 39.0,
        y0: 4.35,
        y1: 5.1,
        z0: span.z1 - 0.01,
        z1: span.z1 + 0.17,
        tone: 'signal',
        explode: [0, 0, 1.2],
      },
      { kind: 'pod', x0: 36.6, x1: 38.4, y: 5.95, z: 7, r: 0.2, tone: 'line4', explode: [0, 0.7, 0] },
      // Two straight pillars from the crash structure, longer in chord where they meet the wing.
      PILLAR(6.25),
      PILLAR(7.75),
      // Context: the crash structure, its rain light, and the rear tyres.
      { kind: 'post', x0: 34.5, x1: 39.1, y0: 1.6, y1: 2.9, z0: 6, z1: 8, tone: 'line3', context: true },
      { kind: 'post', x0: 39.1, x1: 39.25, y0: 2.0, y1: 2.5, z0: 6.8, z1: 7.2, tone: 'signal', context: true },
      { kind: 'wheel', x: 33, y: 2.7, r: 2.7, z0: 0, z1: 3, tone: 'line2', context: true },
      { kind: 'wheel', x: 33, y: 2.7, r: 2.7, z0: 11, z1: 14, tone: 'line2', context: true },
    ],
  },
  frontwing: {
    model: 'f1',
    title: 'Front wing, 2026 rules',
    scale: 0.135,
    drawn: '2026-11-14',
    cut: 3.5,
    parts: [
      // The main plane, low and fixed, an arrowhead in plan: its leading edge swept back toward
      // the tips, its middle (under the nose) raised a little.
      ...[-1, 1].map((side): SketchPart => ({ kind: 'foil', le: [0.35, 0.72], te: [2.55, 0.86], z0: side < 0 ? 0.7 : 7, z1: side < 0 ? 7 : 13.3, t: 0.07, camber: 0.04, spoon: 0, sweep: side * 0.55, tone: 'inkSoft' })), // prettier-ignore
      // The two active flap elements above it, steeper going back, either side of the nose.
      ...[
        [0.7, 6.1],
        [7.9, 13.3],
      ].flatMap(([z0 = 0, z1 = 0]): SketchPart[] => [
        {
          kind: 'foil',
          le: [2.05, 0.98],
          te: [3.4, 1.36],
          z0,
          z1,
          t: 0.07,
          camber: 0.05,
          tone: 'ink2',
          explode: [0, 0.6, 0],
        },
        {
          kind: 'foil',
          le: [3.15, 1.45],
          te: [4.15, 1.98],
          z0,
          z1,
          t: 0.07,
          camber: 0.05,
          tone: 'ink2',
          explode: [0, 1.2, 0],
        },
      ]),
      // Endplates and the broad footplates under them.
      { kind: 'plate', outline: FW_ENDPLATE, z: 0.62, t: 0.12, tone: 'inkSoft', explode: [0, 0, -1.2] },
      { kind: 'plate', outline: FW_ENDPLATE, z: 13.38, t: 0.12, tone: 'inkSoft', explode: [0, 0, 1.2] },
      { kind: 'post', x0: 0.4, x1: 4.3, y0: 0.12, y1: 0.2, z0: 0, z1: 1.3, tone: 'line4', explode: [0, -0.6, -1.2] },
      { kind: 'post', x0: 0.4, x1: 4.3, y0: 0.12, y1: 0.2, z0: 12.7, z1: 14, tone: 'line4', explode: [0, -0.6, 1.2] },
      // The nose, its two pylons down to the main plane, and the front tyres.
      { kind: 'post', x0: 1.2, x1: 9.5, y0: 2.1, y1: 3.2, z0: 6.1, z1: 7.9, tone: 'line3', context: true },
      { kind: 'plate', outline: [[1.4, 0.9], [2.3, 0.9], [2.6, 2.2], [1.6, 2.2]], z: 6.4, t: 0.12, tone: 'line4' }, // prettier-ignore
      { kind: 'plate', outline: [[1.4, 0.9], [2.3, 0.9], [2.6, 2.2], [1.6, 2.2]], z: 7.6, t: 0.12, tone: 'line4' }, // prettier-ignore
      { kind: 'wheel', x: 8, y: 2.7, r: 2.7, z0: 0, z1: 2, tone: 'line2', context: true },
      { kind: 'wheel', x: 8, y: 2.7, r: 2.7, z0: 12, z1: 14, tone: 'line2', context: true },
    ],
  },
};
