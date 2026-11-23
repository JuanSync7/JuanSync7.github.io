/** Shapes the library page hands to its archive island: plain, serialisable data. */

export interface ArchivePiece {
  slug: string;
  href: string;
  title: string;
  excerpt: string;
  date: string;
  read: string;
  /** The piece's cover figure, played on the left of the opened paper. */
  cover: string | null;
  /** Two-digit place on its shelf, newest first. */
  num: string;
  /** The newest piece in the whole library: its spine label is the signal. */
  latest: boolean;
}

export interface ArchiveShelf {
  id: string;
  label: string;
  pieces: ArchivePiece[];
}

/** Where a binder stands on its shelf, in the plate's design units (one unit is one CSS px at
 *  full size), measured from the wall unit's top-left corner. */
export interface BinderBox {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Which of the three spine fills it takes. */
  fill: 'a' | 'b' | 'c';
}

/** The opening, step by step. Idle is the shelf; show is the paper open on the desk. Return
 *  stands the binder up on the desk again; back carries it to its place on the shelf. */
export type Phase =
  | 'idle'
  | 'lift'
  | 'fly'
  | 'land'
  | 'open'
  | 'pull'
  | 'rise'
  | 'show'
  | 'unshow'
  | 'sink'
  | 'shut'
  | 'return'
  | 'back';

export const IN_AIR: readonly Phase[] = ['lift', 'fly', 'return', 'back'];
export const ON_DESK: readonly Phase[] = ['land', 'open', 'pull', 'rise', 'show', 'unshow', 'sink', 'shut'];
export const COVER_OPEN: readonly Phase[] = ['open', 'pull', 'rise', 'show', 'unshow', 'sink'];
export const SHEET_OUT: readonly Phase[] = ['pull', 'rise', 'show', 'unshow', 'sink'];

export interface Picked {
  shelf: number;
  index: number;
}
