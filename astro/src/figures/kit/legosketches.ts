import type { SketchPart } from './legosketch';
import { CAR_SKETCHES } from './legosketchcar';
import { WING_SKETCHES } from './legosketchwings';

/** Reference sketches, by id: what a part of a model really looks like, in the model's frame, to
 *  plan its LEGO against (`npm run lego:sheet -- <id> sketch | sketch3d | compare`), and the
 *  drawing set made from them (`drawing`; an assembly's parts list is `parts`). */

export interface Sketch {
  /** The LEGO model this is drawn for (its plan is laid over the sketch in `compare`). */
  model: string;
  /** The part's name on its drawing, and the real metres one stud stands for. */
  title: string;
  scale: number;
  /** For its drawing's title block (ISO 7200): the date of issue, the identification number
   *  (at most 16 characters, unique) and the revision letter. */
  drawn: string;
  number: string;
  revision: string;
  /** The document type (ISO 10209): a general arrangement of the whole, an assembly drawing of
   *  parts that come apart, or a detail drawing of one part. */
  doc: 'ga' | 'assembly' | 'detail';
  /** Where section A-A cuts across the span (z, studs), for a part whose shape is its section. */
  cut?: number;
  /** For a general arrangement: the sketches it is made of, in item-number order, with how
   *  many of each the parts list counts (one sketch may draw several, such as four wheels). */
  of?: { id: string; qty: number }[];
  /** Where an assembly's leader to this part ends, when the part's top over its middle is hidden
   *  in side elevation (a nose behind its tyre): a point on the part, model frame. */
  callout?: [number, number, number];
  /** Notes for the sheet, after the units: where the numbers come from (R-DRW-2). */
  notes: string[];
  parts: SketchPart[];
}

export const LEGO_SKETCHES: Record<string, Sketch> = { ...CAR_SKETCHES, ...WING_SKETCHES };

/** The items of an assembly in number order: each sketch it is made of, with its quantity. */
export function itemsOf(s: Sketch): { item: number; id: string; sketch: Sketch; qty: number }[] {
  return (s.of ?? []).flatMap(({ id, qty }, k) => {
    const sketch = LEGO_SKETCHES[id];
    return sketch ? [{ item: k + 1, id, sketch, qty }] : [];
  });
}

/** The parts a drawing shows: its own parts that are not context, and for an assembly every
 *  part of every sketch it is made of (their context parts left out too). */
export function partsOf(s: Sketch): SketchPart[] {
  const own = s.parts.filter((p) => !p.context);
  return [...own, ...itemsOf(s).flatMap(({ sketch }) => partsOf(sketch))];
}
