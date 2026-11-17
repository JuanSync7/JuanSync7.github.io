// One source: the experience vault's Playbooks/drawing/kernel. A project's copy is synced from it, never edited.
import type { SketchPart } from './parts';
import { SKETCHES } from './host';

/** A sketch: a real object or part drawn as it is (not as it will be built), in the frame and units
 *  its project works in, with what its drawing's title block needs. The drawing kernel draws it
 *  (kit `plan`, `scene`, `sheet`); the project keeps its sketches by id (`host.ts`, `SKETCHES`). */

export interface Sketch {
  /** The model a project plans against this sketch (on juansync.dev, the LEGO model whose plan
   *  is laid over it in `compare`). */
  model?: string;
  /** The part's name on its drawing, and the real metres one model unit stands for. */
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
  /** Where section A-A cuts across the span (z, model units), for a part whose shape is its section. */
  cut?: number;
  /** For a general arrangement: the sketches it is made of, in item-number order, with how
   *  many of each the parts list counts; `mirror` adds each part's reflection across that z
   *  (a tyre sketched on the left makes the pair). */
  of?: { id: string; qty: number; mirror?: number }[];
  /** Where an assembly's leader to this part ends, when the part's top over its middle is hidden
   *  in side elevation (a nose behind its tyre): a point on the part, model frame. */
  callout?: [number, number, number];
  /** Notes for the sheet, after the units: where the numbers come from (R-DRW-2). */
  notes: string[];
  parts: SketchPart[];
}

/** The items of an assembly in number order: each sketch it is made of, its quantity, and the
 *  parts it draws in the assembly (its context left out, its mirror copies added). */
export function itemsOf(s: Sketch): { item: number; id: string; sketch: Sketch; qty: number; parts: SketchPart[] }[] {
  return (s.of ?? []).flatMap(({ id, qty, mirror }, k) => {
    const sketch = SKETCHES[id];
    if (!sketch) return [];
    const own = partsOf(sketch);
    const parts = mirror === undefined ? own : [...own, ...own.map((p): SketchPart => ({ ...p, mirror }))];
    return [{ item: k + 1, id, sketch, qty, parts }];
  });
}

/** The parts a drawing shows: its own parts that are not context, and for an assembly every
 *  part of every item. */
export function partsOf(s: Sketch): SketchPart[] {
  return [...s.parts.filter((p) => !p.context), ...itemsOf(s).flatMap((i) => i.parts)];
}
