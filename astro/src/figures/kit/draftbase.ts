import { Box3, Euler, Matrix4, type BufferGeometry } from 'three';
import { dimLines, type P2 } from './draftlines';
import type { Sketch } from './legosketches';

/** What every drawing layout shares (kit/draftplan lays out a part's drawing, kit/draftga a
 *  general arrangement): the sheet, the views and how each turns the model, and dimensions as
 *  ISO 129-1 sets them. Units are studs, y down, the drawing area's top left at the origin. */

export type DraftView = 'side' | 'end' | 'plan' | 'exploded';
/** A word on the drawing, at a point given in fractions of the drawing area; `at` is the side of
 *  the point the word sits on (`centre`: on it), and `angle` (degrees, clockwise on the page)
 *  turns it to run along its dimension line. Pages set these as DOM, the review sheet on its
 *  canvas. `ring`: an item reference (ISO 6433), set in its circle. */
export interface Label {
  text: string;
  x: number;
  y: number;
  at: 'above' | 'below' | 'left' | 'right' | 'centre';
  angle?: number;
  ring?: boolean;
}
export interface Layout {
  sketch: Sketch;
  /** The drawing area's size in studs (its shape is AREA's), and the scale it prints at on A3. */
  w: number;
  h: number;
  scale: number;
  labels: Label[];
}
export interface Plan {
  layout: Layout;
  /** Per view: the turned model's box (exploded for that view), where its centre goes, and the
   *  view's own scale against the drawing's (`k` < 1: drawn smaller, and labelled so). */
  at: Record<DraftView, { box: Box3; x: number; y: number; k: number }>;
  /** Line work as segment end points in pairs: thin (dimensions, centre and cutting lines,
   *  hatching, leaders, symbol) and thick (a section's outline), as ISO 128 weighs them. */
  thin: P2[];
  thick: P2[];
}

/** An A3 sheet, landscape, in mm (ISO 5457): a 20 mm filing margin on the left, 10 mm elsewhere,
 *  and the title block's strip along the bottom. The drawing area is what is left above it. */
export const A3 = { w: 420, h: 297, left: 20, edge: 10, block: 40 };
export const AREA = { w: A3.w - A3.left - A3.edge, h: A3.h - 2 * A3.edge - A3.block };
/** The document types a sketch's drawing can be (ISO 10209). */
export const DOC = { ga: 'General arrangement', assembly: 'Assembly drawing', detail: 'Detail drawing' } as const;

/** ISO 5455's scales, smallest reduction first. */
export const SCALES = [1, 2, 5, 10, 20, 50, 100, 200];
export const VIEWS: DraftView[] = ['side', 'end', 'plan', 'exploded'];
/** Each view turns the model so that view faces a camera looking down -z, y up. */
export const TURN: Record<DraftView, Matrix4> = {
  side: new Matrix4(),
  plan: new Matrix4().makeRotationX(Math.PI / 2),
  end: new Matrix4().makeRotationY(Math.PI / 2),
  exploded: new Matrix4().makeRotationFromEuler(new Euler(Math.atan(Math.SQRT1_2), Math.PI / 4, 0, 'XYZ')),
};

export function boxOf(geos: BufferGeometry[], t: Matrix4): Box3 {
  return geos.reduce((b, g) => {
    const turned = g.clone().applyMatrix4(t);
    turned.computeBoundingBox();
    if (turned.boundingBox) b.union(turned.boundingBox);
    turned.dispose();
    return b;
  }, new Box3());
}

/** A dimension as ISO 129-1 draws it: the line from a to b (already set `away` from the feature
 *  along n), extension lines back to the feature, arrowheads, and the value in mm above the line
 *  and along it, read from the bottom or the right. `pmm` is a paper millimetre in studs. */
export function dimmer(sketch: Sketch, w: number, h: number, pmm: number, thin: P2[], labels: Label[]) {
  return (a: P2, b: P2, n: P2, away: number, studs: number): void => {
    thin.push(...dimLines(a, b, n, away, 3 * pmm, pmm, 2 * pmm));
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let [ux, uy] = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    if (ux < -1e-6 || (Math.abs(ux) <= 1e-6 && uy > 0)) [ux, uy] = [-ux, -uy];
    const [tx, ty] = [uy * 2.75 * pmm, -ux * 2.75 * pmm];
    const [mx, my] = [(a[0] + b[0]) / 2 + tx, (a[1] + b[1]) / 2 + ty];
    const text = String(Math.round(studs * sketch.scale * 1000));
    labels.push({ text, x: mx / w, y: my / h, at: 'centre', angle: (Math.atan2(uy, ux) * 180) / Math.PI });
  };
}
