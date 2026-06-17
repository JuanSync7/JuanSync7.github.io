/* ── Content art resolution ──────────────────────────────────────────────────
   The SINGLE place per-article hero art is resolved. Two content families with
   different default dimensions:
     · learn  → keyed by `tracker`  (silicon→lattice, engines→flow, else loop)
     · blog   → keyed by `category` (via the category registry), and inherits a
                matching learn article's art by shared slug (the canonical source)
   Resolving here (not inline per page) kills the formerly copy-pasted fallbacks
   and gives the blog↔learn link one debuggable home. ─────────────────────────── */
import type { Motif, Space } from '../components/art/artGeometry';
import { motifForCategory } from '../config/registry';

export interface ArtRef {
  motif: Motif;
  space: Space;
}

const TRACKER_MOTIF: Record<string, Motif> = {
  'inference-silicon': 'lattice',
  'inference-engines': 'flow',
};

/** learn article hero art: explicit frontmatter → tracker default → loop. */
export function learnArt(data: { art?: Motif; bg?: Space; tracker?: string }): ArtRef {
  return {
    motif: data.art ?? TRACKER_MOTIF[data.tracker ?? ''] ?? 'loop',
    space: data.bg ?? 'auto',
  };
}

/** blog post art: own frontmatter → matching learn article (by slug) → category
 *  default. `canon` is the learn entry's data when a learn article shares the slug. */
export function resolveBlogArt(
  data: { art?: Motif; bg?: Space; category: string },
  canon?: { art?: Motif; bg?: Space },
): ArtRef {
  return {
    motif: data.art ?? canon?.art ?? motifForCategory(data.category),
    space: data.bg ?? canon?.bg ?? 'auto',
  };
}
