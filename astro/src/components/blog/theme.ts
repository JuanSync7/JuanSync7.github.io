/**
 * Blog palette — now DERIVED from the single category registry (src/config/registry.ts)
 * and the colour palette (src/styles/tokens/palette.ts) rather than re-declaring hex.
 * Series accents registered at runtime override the registry per id.
 */
import { CATEGORY_REGISTRY, CATEGORY_KEYS, accentForCategory } from '../../config/registry';
import { palette } from '../../styles/tokens/palette';

export const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_REGISTRY).map(([key, def]) => [key, def.accent]),
);

export const BLOG_CATEGORIES = ['all', ...CATEGORY_KEYS] as const;

export const FALLBACK = palette.teal;

/** runtime accent overrides (e.g. a series registering its own colour) */
const overrides: Record<string, string> = {};

export function catColor(category: string): string {
  return overrides[category] ?? accentForCategory(category);
}

export function registerSeriesColor(id: string, accent: string): void {
  overrides[id] = accent;
  CATEGORY_COLORS[id] = accent;
}
