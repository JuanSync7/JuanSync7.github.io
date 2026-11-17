import type { SketchPart } from './legosketch';
import type { Sketch } from './legosketches';

/** The 2026-rules car the F1 model is planned against, part by part, and its general arrangement.
 *  Frame and scale as the wings': studs of 0.135 m, x along the car (the front wing's leading edge
 *  near 0), y up from the ground, z across (centre line z = 7), front axle x = 8, rear x = 33.
 *  Sources, as reported (no photograph traced, no team's car):
 *  - FIA 2026 rules via formula1.com and fia.com: wheelbase at most 3400 mm (drawn 3375, the
 *    LEGO's 25 studs), width 1900 mm (taken across the tyres), floor 150 mm narrower than 2025's.
 *  - Pirelli via Autosport, grandprix247 and f1technical: 18-inch rims; tyres 25 mm (front) and
 *    30 mm (rear) narrower than 2025's 305 and 405 mm, so 280 and 375 mm; diameters 15 and 10 mm
 *    under 720, so 705 and 710 mm.
 *  - Height: the 950 mm limit of the 2022 rules (no 2026 figure found); everything else (nose,
 *    survival cell, halo, sidepods, engine cover, floor) is proportion, not a published number. */

const [STUD, RIM] = [0.135, 0.4572 / 2 / 0.135];
const SOURCE = 'Proportions from the 2026 technical rules as reported. No photograph traced.';
const base = { model: 'f1', scale: STUD, drawn: '2026-11-17', revision: 'A' } as const;

/** A tyre on its rim, at axle x, on the left (z from 0) or right (to 14) of the car. */
const tyre = (x: number, diameter: number, width: number, left: boolean): SketchPart => {
  const [r, w] = [diameter / 2 / STUD, width / STUD];
  return { kind: 'wheel', x, y: r, r, rim: RIM, z0: left ? 0 : 14 - w, z1: left ? w : 14, tone: 'line2' };
};
const WHEELS: SketchPart[] = [tyre(8, 0.705, 0.28, true), tyre(8, 0.705, 0.28, false), tyre(33, 0.71, 0.375, true), tyre(33, 0.71, 0.375, false)]; // prettier-ignore

/** A sidepod either side: [x, bottom, top, half-width], its inlet behind the front wheels. */
const sidepod = (z: number): SketchPart => ({
  kind: 'hull',
  z,
  stations: [[13.6, 0.37, 3.3, 0.85], [15.5, 0.37, 3.65, 1.35], [19, 0.37, 3.6, 1.45], [23, 0.37, 3, 1.1], [26.5, 0.37, 1.9, 0.6]], // prettier-ignore
  tone: 'inkSoft',
  explode: [0, 0, z < 7 ? -2 : 2],
});
/** The halo's hoop, from its rear mounts on the survival cell round the front of the cockpit. */
const HOOP: [number, number, number][] = [[19.2, 4.4, 4.8], [17.6, 5.35, 4.9], [15.4, 5.65, 5.4], [13.9, 5.7, 6.3], [13.6, 5.7, 7], [13.9, 5.7, 7.7], [15.4, 5.65, 8.6], [17.6, 5.35, 9.1], [19.2, 4.4, 9.2]]; // prettier-ignore

export const CAR_SKETCHES: Record<string, Sketch> = {
  f1car: {
    ...base,
    title: 'Formula 1 car, 2026 rules',
    number: 'JS-LEGO-0003',
    doc: 'ga',
    of: [
      { id: 'frontwing', qty: 1 },
      { id: 'nose', qty: 1 },
      { id: 'halo', qty: 1 },
      { id: 'bodywork', qty: 1 },
      { id: 'floor', qty: 1 },
      { id: 'rearwing', qty: 1 },
      { id: 'wheels', qty: 4 },
    ],
    notes: [
      "Wheelbase at most 3400 and width 1900 (FIA, 2026). Drawn at 3375, the LEGO model's.",
      'Length and height measured from the parts. No photograph traced.',
    ],
    parts: [],
  },
  nose: {
    ...base,
    title: 'Nose and survival cell',
    callout: [4, 3.4, 7],
    number: 'JS-LEGO-0004',
    doc: 'detail',
    notes: [SOURCE],
    parts: [
      {
        kind: 'hull',
        z: 7,
        stations: [[1.2, 2.3, 2.95, 0.42], [3, 2.2, 3.25, 0.62], [5.5, 2.05, 3.6, 0.85], [8, 1.85, 3.95, 1.1], [10, 1.4, 4.3, 1.5], [12.5, 0.37, 4.55, 2.15], [15, 0.37, 4.45, 2.45], [19, 0.37, 4.35, 2.55], [21, 0.37, 4.35, 2.45]], // prettier-ignore
        tone: 'inkSoft',
      },
      ...WHEELS.map((w): SketchPart => ({ ...w, context: true })),
    ],
  },
  halo: {
    ...base,
    title: 'Halo',
    number: 'JS-LEGO-0006',
    doc: 'detail',
    notes: [SOURCE],
    parts: [
      { kind: 'tube', points: [[12.9, 4.5, 7], [13.3, 5.3, 7], [13.6, 5.68, 7]], r: 0.2, tone: 'line4' }, // prettier-ignore
      { kind: 'tube', points: HOOP, r: 0.2, tone: 'line4' },
    ],
  },
  bodywork: {
    ...base,
    title: 'Sidepods, engine cover and crash structure',
    number: 'JS-LEGO-0005',
    doc: 'assembly',
    notes: ['Overall height to the 950 limit of the 2022 rules (no 2026 figure found).', SOURCE],
    parts: [
      {
        kind: 'hull',
        z: 7,
        stations: [[19, 4.3, 6.95, 0.6], [20.5, 3.9, 6.9, 1], [22.5, 0.37, 6.2, 2.3], [26, 0.37, 5, 2], [29.5, 1.2, 3.9, 1.4], [32.5, 1.5, 3.2, 0.9], [34.6, 1.6, 2.95, 0.65]], // prettier-ignore
        tone: 'inkSoft',
      },
      { kind: 'plate', outline: [[21.5, 6.3], [23.5, 6.45], [31.5, 4], [31.5, 3.6], [29.5, 3.9], [26, 5], [22.5, 6.2]], z: 7, t: 0.05, tone: 'line4', explode: [0, 1.5, 0] }, // prettier-ignore
      sidepod(3.4),
      sidepod(10.6),
      { kind: 'hull', z: 7, stations: [[34.5, 1.6, 2.9, 0.7], [39.1, 1.75, 2.75, 0.45]], tone: 'line3', explode: [2, 0, 0] }, // prettier-ignore
      { kind: 'post', x0: 39.1, x1: 39.25, y0: 2, y1: 2.5, z0: 6.8, z1: 7.2, tone: 'signal', explode: [2, 0, 0] },
    ],
  },
  floor: {
    ...base,
    title: 'Floor and diffuser',
    number: 'JS-LEGO-0007',
    doc: 'detail',
    notes: ['Floor 150 narrower than the 2025 rules allowed (FIA, 2026).', SOURCE],
    parts: [
      { kind: 'deck', outline: [[10.4, 5], [12.4, 3], [14.5, 1.7], [28.5, 1.7], [30.3, 3.1], [30.3, 10.9], [28.5, 12.3], [14.5, 12.3], [12.4, 11], [10.4, 9]], y: 0.25, t: 0.12, tone: 'line3' }, // prettier-ignore
      { kind: 'plate', outline: [[30.3, 0.25], [34.6, 1.3], [34.6, 1.62], [30.3, 0.37]], z: 7, t: 5, tone: 'line3' }, // prettier-ignore
    ],
  },
  wheels: {
    ...base,
    title: 'Wheels and tyres, front and rear',
    number: 'JS-LEGO-0008',
    doc: 'detail',
    notes: ['18-inch rims. Tyres 280 x 705 front, 375 x 710 rear (Pirelli, 2026, as reported).'],
    parts: WHEELS,
  },
};
