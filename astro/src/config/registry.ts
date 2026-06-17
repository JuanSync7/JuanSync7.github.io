/* ── Category registry ───────────────────────────────────────────────────────
   ONE source of truth for everything that is keyed by content category. Replaces
   the three formerly-disjoint maps:
     · blog/ArticleArt.tsx  motifForCategory   (category → art motif)
     · blog/theme.ts        CATEGORY_COLORS    (category → accent hex)
     · blog/PostImage.tsx   STYLES key + KIND  (category → gradient recipe key)
   Add a new category HERE and the motif, accent, and image-kind all come along.
   ──────────────────────────────────────────────────────────────────────────── */
import { palette } from '../styles/tokens/palette';
import type { Motif } from '../components/art/artGeometry';

export interface CategoryDef {
  /** generative line-art motif (ArticleArt) */
  motif: Motif;
  /** statement accent colour, from the palette */
  accent: string;
  /** PostImage gradient-recipe key */
  imageKind: string;
}

export const CATEGORY_REGISTRY: Record<string, CategoryDef> = {
  silicon: { motif: 'lattice', accent: palette.cyan, imageKind: 'silicon' },
  software: { motif: 'flow', accent: palette.lime, imageKind: 'software' },
  tutorials: { motif: 'blueprint', accent: palette.magenta, imageKind: 'tutorials' },
  thoughts: { motif: 'vortex', accent: palette.violet, imageKind: 'thoughts' },
  projects: { motif: 'hub', accent: palette.mint, imageKind: 'projects' },
};

export const FALLBACK_CATEGORY: CategoryDef = { motif: 'loop', accent: palette.teal, imageKind: 'thoughts' };

/** ordered category keys (e.g. for filter bars) */
export const CATEGORY_KEYS = Object.keys(CATEGORY_REGISTRY);

export function categoryDef(category: string): CategoryDef {
  return CATEGORY_REGISTRY[category] ?? FALLBACK_CATEGORY;
}
export function motifForCategory(category: string): Motif { return categoryDef(category).motif; }
export function accentForCategory(category: string): string { return categoryDef(category).accent; }
export function imageKindForCategory(category: string): string { return categoryDef(category).imageKind; }
