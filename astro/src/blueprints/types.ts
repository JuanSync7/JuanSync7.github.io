/** A blueprint's spec: the one file an agent reads and writes for the structure of a shared
 *  component or a page template. The drawing is derived from it and from the thing as it renders,
 *  the check holds the code to it, and the index turns a plain request ("part 3's gap, smaller")
 *  into one token in one file. It names structure only (parts, how each sizes, which token sets
 *  each size), never colours, motion or content: those stay in the code and tokens. */

/** How a part takes its width: `hug` wraps its content, `fill` takes the room its parent gives,
 *  `fixed` keeps its size whatever the content and the page width. */
export type Sizing = 'hug' | 'fill' | 'fixed';

/** A component is measured where it is shown on /design-system/; a template on a real page. */
export type Kind = 'component' | 'template';

export type ViewName = 'desktop' | 'phone';

/** Where and at what window size the thing is measured. */
export interface View {
  name: ViewName;
  /** A page of the site, e.g. '/design-system/' or a real post. */
  route: string;
  /** CSS selector for the root, the first match on that page. */
  root: string;
  width: number;
  height: number;
}

export interface Part {
  /** Stable number, also the balloon on the drawing. The root is 1. */
  id: number;
  /** The plain name a person uses, e.g. 'Contents column'. */
  name: string;
  /** CSS selector inside the root; '' is the root itself. */
  selector: string;
  /** A part drawn by CSS as a pseudo-element of the selected element (a margin line). */
  pseudo?: '::before' | '::after';
  sizing: Sizing;
  /** How it sizes on a phone, where that differs (a row of buttons that wraps to the width). */
  phone?: Sizing;
  /** A slot takes content from the page that uses the component. */
  slot?: boolean;
  /** Other names people use for it, for the index. */
  aliases?: string[];
  /** The views it is shown in (default all); e.g. a side pane hidden on a phone. */
  views?: ViewName[];
}

/** What a size measures on its part. Lengths are dimensioned on the drawing; border, radius, the
 *  printed edge and font size are leader notes. An inset is the distance from the root's left or
 *  right edge to the part's. */
export type Measure =
  | 'width'
  | 'max-width'
  | 'height'
  | 'min-height'
  | 'inset-left'
  | 'inset-right'
  | 'padding-x'
  | 'padding-y'
  | 'gap'
  | 'border'
  | 'radius'
  | 'edge-x'
  | 'edge-y'
  | 'font-size';

export interface Size {
  measure: Measure;
  /** The part's id. */
  part: number;
  /** The design token that must set it. */
  token: string;
  /** For a gap: the two parts it separates (default the part's first two children). */
  between?: [number, number];
  /** The views it holds in (default all). */
  views?: ViewName[];
}

export interface Blueprint {
  id: string;
  kind: Kind;
  title: string;
  /** One sentence: what it is. */
  summary: string;
  /** Its source files, from astro/. */
  source: string[];
  views: View[];
  parts: Part[];
  sizes: Size[];
  /** For the title block (ISO 7200): identification number, revision, date of issue. */
  number: string;
  revision: string;
  drawn: string;
}

/** Where a component is shown on /design-system/: measured at the desktop width only. */
export function onDesignSystem(root: string): View[] {
  return [{ name: 'desktop', route: '/design-system/', root, width: 1280, height: 900 }];
}

/** A page template, measured on a real page at the desktop and phone widths the page check uses. */
export function onPage(route: string, root: string): View[] {
  return [
    { name: 'desktop', route, root, width: 1280, height: 900 },
    { name: 'phone', route, root, width: 390, height: 820 },
  ];
}

export const shownIn = (x: { views?: ViewName[] }, v: ViewName): boolean => !x.views || x.views.includes(v);
