/** Baked figures: drawings made ahead of time by a playbook's kernel and registered here by the
 *  manifest the kernel writes (`<id>.json` beside this file). A baked figure is a figure like any other: it
 *  takes its colours only from the site's tokens (the manifest names them and their digest), the
 *  audit checks it (scripts/figures/plates.mjs), and a page shows it through `<FigurePlate>`, never
 *  by an image path. Its anchors say where things stand on it, in its own units, so live parts
 *  (DOM, or a live figure laid on top) line up with the drawing. */

export interface PlateSources {
  '1x': string;
  '2x': string;
}

export interface Plate {
  id: string;
  title: string;
  alt: string;
  group: string;
  style: string;
  sources: { light: PlateSources; dark: PlateSources };
  size: [number, number];
  anchors: Record<string, unknown>;
}

const files = import.meta.glob<unknown>('./*.json', { eager: true, import: 'default' });

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isSources(v: unknown): v is PlateSources {
  return isRecord(v) && typeof v['1x'] === 'string' && typeof v['2x'] === 'string';
}

function toPlate(v: unknown): Plate | null {
  if (!isRecord(v) || !isRecord(v.sources) || !isRecord(v.anchors)) return null;
  const { id, title, alt, group, style, sources, anchors } = v;
  const size = anchors.size;
  if (typeof id !== 'string' || typeof title !== 'string' || typeof alt !== 'string') return null;
  if (typeof group !== 'string' || typeof style !== 'string') return null;
  if (!isSources(sources.light) || !isSources(sources.dark)) return null;
  if (!Array.isArray(size) || size.length !== 2 || !size.every((n) => typeof n === 'number')) return null;
  return {
    id,
    title,
    alt,
    group,
    style,
    sources: { light: sources.light, dark: sources.dark },
    size: [size[0], size[1]],
    anchors,
  };
}

const PLATES = new Map<string, Plate>();
for (const raw of Object.values(files)) {
  const p = toPlate(raw);
  if (p) PLATES.set(p.id, p);
}

export function plateIds(): string[] {
  return [...PLATES.keys()].sort();
}

export function plate(id: string): Plate {
  const p = PLATES.get(id);
  if (!p) throw new Error(`no baked figure '${id}' in src/figures/plates/`);
  return p;
}

/** One number anchor of a plate; a missing or mistyped one is an error, never a default. */
export function anchor(p: Plate, key: string): number {
  const v = p.anchors[key];
  if (typeof v !== 'number') throw new Error(`plate '${p.id}' has no number anchor '${key}'`);
  return v;
}

/** A list-of-numbers anchor of a plate. */
export function anchors(p: Plate, key: string): number[] {
  const v = p.anchors[key];
  if (!Array.isArray(v) || !v.every((n): n is number => typeof n === 'number')) {
    throw new Error(`plate '${p.id}' has no number-list anchor '${key}'`);
  }
  return v;
}

/** The CSS for one theme's sources, by resolution. */
export function plateImage(s: PlateSources): string {
  return `image-set(url('${s['1x']}') 1x, url('${s['2x']}') 2x)`;
}
