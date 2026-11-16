/** A component blueprint's spec: the one file an agent reads and writes for a component's
 *  structure. The blueprint sheet is drawn from it and from the component as it renders, and the
 *  check holds the component to it. It names what the drawing needs (parts, how each sizes, which
 *  token sets each size), never colours, motion or content: those stay in the code and tokens. */

/** How a part takes its width: `hug` wraps its content, `fill` takes the room its parent gives,
 *  `fixed` keeps its size whatever the content. */
export type Sizing = 'hug' | 'fill' | 'fixed';

export interface Part {
  /** The name on the drawing, e.g. 'Label slot'. */
  name: string;
  /** CSS selector inside the component's root; '' is the root itself. */
  selector: string;
  sizing: Sizing;
  /** A slot takes content from the page that uses the component. */
  slot?: boolean;
}

/** What a size measures on its part: its left or top padding, the gap between its children, its
 *  minimum height, its border, its corner radius, or the printed edge's offset across or down. */
export type Measure = 'padding-x' | 'padding-y' | 'gap' | 'min-height' | 'border' | 'radius' | 'edge-x' | 'edge-y';

export interface Size {
  measure: Measure;
  /** The part's selector, as in `Part`. */
  part: string;
  /** The design token that must set it. */
  token: string;
}

export interface Blueprint {
  id: string;
  /** The component's name and its source files. */
  title: string;
  source: string[];
  /** A rendered example on /design-system/ to measure. */
  demo: string;
  parts: Part[];
  sizes: Size[];
  /** For the title block (ISO 7200): identification number, revision, date of issue. */
  number: string;
  revision: string;
  drawn: string;
}
