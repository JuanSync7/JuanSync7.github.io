import type { SlideIconId } from '../../../data/slide-icons';
import attribution from './attribution.json';
import definitions from './definitions.json';
import type { SlideDrawing, SlideNode, SlideTag } from './types';

function isTag(value: unknown): value is SlideTag {
  return (
    value === 'path' ||
    value === 'rect' ||
    value === 'circle' ||
    value === 'ellipse' ||
    value === 'line' ||
    value === 'polyline' ||
    value === 'polygon'
  );
}
function node(value: { tag: string; attrs: object }): SlideNode {
  if (!isTag(value.tag)) throw new Error(`Unsupported slide primitive: ${value.tag}`);
  const attrs: Record<string, string> = {};
  for (const [key, attribute] of Object.entries(value.attrs)) {
    if (typeof attribute !== 'string') throw new Error(`Invalid slide attribute: ${key}`);
    attrs[key] = attribute;
  }
  return { tag: value.tag, attrs };
}
export function slideDrawing(id: SlideIconId, accent = true): SlideDrawing {
  const source = definitions[id];
  return [
    ...source.nodes.map((value) => ({ ...node(value), role: 'line' as const })),
    ...(accent ? [{ ...node(source.accent), role: 'signal' as const }] : []),
  ];
}

export function slideLicense(id: SlideIconId): string {
  return definitions[id].licenses
    .map((ref) => {
      const notice = Object.entries(attribution).find(([key]) => key === ref)?.[1];
      if (!notice) throw new Error(`Unknown slide license: ${ref}`);
      return notice;
    })
    .join('\n');
}
export const slideLicenses = (): string => Object.values(attribution).join('\n');
