import type { Rng } from './kit/rng';

/** The drawing technique a figure uses. One per figure; the catalogue and the recipe
 *  for each is `.claude/skills/figure/references/styles.md`. */
export const FIGURE_STYLES = [
  'wireframe',
  'lowpoly',
  'pixel',
  'perspective',
  'hairline',
  'ink',
  'field',
  'trace',
  'three',
] as const;
export type FigureStyle = (typeof FIGURE_STYLES)[number];

/** ambient: moves on its own. responsive: rests until the pointer comes. still: never moves. */
export const FIGURE_MOTIONS = ['ambient', 'responsive', 'still'] as const;
export type FigureMotion = (typeof FIGURE_MOTIONS)[number];

/** Where a figure is used. The audit checks variety inside a group. */
export const FIGURE_GROUPS = ['hero', 'feature', 'cover', 'post', 'fixture', 'template'] as const;
export type FigureGroup = (typeof FIGURE_GROUPS)[number];

export interface Pointer {
  /** 0..1 across the canvas, or the last place it was. */
  x: number;
  y: number;
  /** True while the pointer is over the canvas. */
  active: boolean;
}

export interface Pulse {
  x: number;
  y: number;
  /** Seconds since the click. */
  age: number;
}

/** What every figure is told each frame. Time is the figure's own clock in seconds. */
export interface FrameInput {
  t: number;
  dt: number;
  /** 0 at rest, 1 under the pointer, eased between. */
  hover: number;
  pointer: Pointer;
  pulses: readonly Pulse[];
  /** True under reduced motion or a frozen capture: draw the composed rest frame. */
  still: boolean;
  /** Whatever the page handed the figure (the lesson calendar's days, say). Unknown on
   *  purpose: a figure narrows it, and draws a sample of its own when it is absent. */
  data?: unknown;
}

/** Facts every figure declares, read by the page, the bench and the audit. */
export interface FigureMeta {
  /** kebab-case, unique, equal to the file name. */
  id: string;
  /** A few words, shown in the bench and as the canvas label. */
  title: string;
  /** What a screen-reader user should know the figure shows. One or two sentences. */
  alt: string;
  /** The object, what moves, and what that motion means. One sentence. */
  idea: string;
  style: FigureStyle;
  motion: FigureMotion;
  /** True when the pointer changes the drawing. The audit checks that it really does. */
  answers: boolean;
  group: FigureGroup;
  /** Seeds the figure's random numbers, so every load draws the same picture. */
  seed: number;
  /** True when the drawing is meant to run off the canvas edges (a field, a lattice). */
  bleed?: boolean;
  /** Width over height of the box the figure is designed for. The bench shows it at this. */
  aspect: number;
}

export interface CanvasEnv {
  w: number;
  h: number;
  rng: Rng;
}

export interface CanvasFrame<S> extends FrameInput {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  state: S;
  rng: Rng;
}

/** A figure drawn on a 2D canvas. `setup` runs once per size; `draw` runs every frame and
 *  may return a short read-out naming what is under the pointer (`rest` at rest). */
export interface CanvasFigureSpec<S> extends FigureMeta {
  setup(env: CanvasEnv): S;
  draw(frame: CanvasFrame<S>): string | void;
}

/** A mounted figure. The canvas component owns the clock and calls these. */
export interface FigureInstance {
  /** Draws one frame; returns the read-out, if the figure has one. */
  frame(input: FrameInput): string | void;
  resize(w: number, h: number, dpr: number): void;
  dispose(): void;
}

export type FigureKind = '2d' | 'three';

/** A figure with its state hidden inside `mount`, so the registry is one plain list. */
export interface Figure extends FigureMeta {
  kind: FigureKind;
  mount(canvas: HTMLCanvasElement): FigureInstance;
}
