/**
 * A diagram of boxes and lines in a /learn article, kept as data so `npm run map:check` can
 * measure it against the drawing rules (the vault's Drawing diagrams deck) the same way it
 * measures the system map. Units are pixels at the diagram's full width, `w`; the diagram never
 * grows past it and gives way to its steps below `DIAGRAM_NARROWEST`.
 */

/** Below this container width a diagram shows its steps instead (R-DIAG-17, R-DIAG-19). */
export const DIAGRAM_NARROWEST = 640;

/** The widest a learn diagram may be drawn, so it shrinks at most to 640 / 760 at the narrowest. */
export const DIAGRAM_MAX_W = 760;

/** `lit` is the one box the diagram is about; `frame` holds steps drawn inside it (R-DIAG-12). */
export type DiagramKind = 'box' | 'lit' | 'frame';

export interface DiagramNode {
  id: string;
  title: string;
  sub?: string;
  kind: DiagramKind;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DiagramEdge {
  pts: readonly (readonly [number, number])[];
  /** Data moves both ways: a head at each end. */
  both?: boolean;
}

export interface DiagramLabel {
  text: string;
  x: number;
  y: number;
  w: number;
  align: 'left' | 'center' | 'right';
}

export interface DiagramStep {
  label: string;
  text: string;
  /** The step that holds the lit box. */
  core?: boolean;
}

export interface Diagram {
  id: string;
  w: number;
  h: number;
  /** The legend: what an arrow means and what the lit box is (R-DIAG-18). */
  key: string;
  caption: string;
  nodes: readonly DiagramNode[];
  edges: readonly DiagramEdge[];
  labels: readonly DiagramLabel[];
  /** The same story as text, for narrow screens and screen readers (R-DIAG-19). */
  steps: readonly DiagramStep[];
  /** Crossings allowed, each drawn as a bridge (R-DIAG-8). */
  maxCrossings?: number;
}
