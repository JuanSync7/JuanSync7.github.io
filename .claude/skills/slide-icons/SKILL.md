---
name: slide-icons
description: Use when adding or changing the static SVG slide/web icon library, its accents, geometry, exports, or review system. Follow the pinned sources, fixed views, per-icon geometry checks and visual reviews.
---

# Static slide icons

Read `docs/design/slide-icons.md` and `astro/scripts/slides/rules.json` first. These
are the user's explicitly requested static assets, presented by `SlideIcon`, under
CLAUDE.md's icon exception. They are separate from animated explanatory figures.

1. Name the object and choose its view. Prefer an existing Lucide flat source.
   Preserve source coordinates and primitives; pin the version, source bytes,
   SHA-256 and license in `astro/vendor/slide-icons/`. Do not improvise isometric
   boxes or hand-position separate faces. An original source must use a front view
   unless an explicit projection and visibility contract is supplied.
2. Plural collections use a stack. Declare its front and rear contours or vertical
   units. Rear strokes must stop outside the front silhouette. Repeated units share
   size, alignment and pitch. Avoid duplicating full outlines through front faces.
3. Choose one meaningful existing feature for teal. Derive its segment or arc from
   the source node using the selector, never an unrelated coordinate. Limit the
   accent to 18% of base stroke length. Use existing night/paper tokens only.
4. Add physical contracts for original geometry: containment, connections,
   alignment and occlusion. Preserve the canonical geometry in every renderer.
   Run `npm run slides:import` after changing sources or selectors.
5. Run `npm run slides:proof`. Inspect **every changed icon** at 32px and 64px, in
   night/paper and accent/mono. Check recognition, joins, part alignment, hidden
   edges, small-size clarity, and accent meaning/attachment. Fix the icon when a
   rule fails. Never relax a rule to make an icon pass.
6. Only after looking, record the current fingerprint from the proof report,
   date, sizes, treatments and a specific judgment in `reviews.json`. There is no
   automatic accept-all command. A changed fingerprint invalidates the review.
7. Run `npm run slides:export`, `npm run slides:check`, `npm run check`, build,
   and the CI browser checks. Inspect desktop, phone and small-size screenshots.
   New audit rules need a deliberately broken fixture caught by that exact rule.
8. Keep `/lab/slide-icons/`, the design-system component ledger, licenses,
   documentation and downloadable pack consistent. Do not call the work reviewed
   without actually inspecting its proofs and browser screenshots.
