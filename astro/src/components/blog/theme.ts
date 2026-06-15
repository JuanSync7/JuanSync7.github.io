/**
 * Centralized blog palette. Hex values mirror the CSS custom properties in
 * src/styles/tokens/ (see colors.css). Kept as hex strings — not var(--…) —
 * because the cyberpunk card styling composes per-category alpha shades by
 * string concatenation (e.g. `${catColor}44`), which only works on hex.
 */
export const CATEGORY_COLORS: Record<string, string> = {
  silicon: '#05d9e8',
  software: '#c8d837',
  tutorials: '#ff2a6d',
  thoughts: '#d300c5',
  projects: '#6dbf8b',
};

export const BLOG_CATEGORIES = [
  'all', 'silicon', 'software', 'tutorials', 'thoughts', 'projects',
] as const;

export const FALLBACK = '#1ba0a0';

export function catColor(category: string): string {
  return CATEGORY_COLORS[category] ?? FALLBACK;
}

export function registerSeriesColor(id: string, accent: string): void {
  CATEGORY_COLORS[id] = accent;
}
