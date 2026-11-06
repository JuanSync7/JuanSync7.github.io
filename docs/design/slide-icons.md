# Slide icon rules and review

`/lab/slide-icons/` contains 48 static icons across compute, systems, data,
research, workflow and communication. It uses a 24-unit grid, one-unit round
strokes, transparent backgrounds, and the site's existing night/paper palette.
Forty-four marks retain Lucide 1.70.0 geometry; wafer, network switch, calipers and
slide deck are original. Small filled Lucide circuit endpoints become outline
circles; their coordinates and radii stay unchanged. Full Lucide/Feather and
original MIT notices are included in the repository and download pack. Every
individual SVG embeds the notices as non-rendering metadata.

The earlier hand-built perspective boxes were removed. Flat views are the default.
The storage mark retains its source's parallel front/top view. The layer stack
uses parallel rhombi with partial rear contours. Files, folders and slide deck
show partial rear sheets behind a front item. Server units share a vertical pitch.
The `chiplets` URL remains compatible; its honest display name is now Layer stack.
These are icon assets under CLAUDE.md's static-icon exception.

## Rules

| Rule | What is enforced |
| --- | --- |
| SOURCE | Pinned source hash, XML primitives, whitelist and license. Generated/live/exported coordinates must agree. |
| VIEW | Each icon declares a fixed front view or one of the reviewed parallel views. No arbitrary perspective assembly. |
| FRAME | All sampled curves, including half the stroke width, stay inside the 1–23 safe frame. The browser independently measures native SVG bounds. |
| ACCENT | One source feature with a written physical meaning. Its sampled accent must stay within 0.035 units of that exact feature. |
| BUDGET | Accent length is at most 18% of base drawing length. Monochrome removes the overlay entirely. |
| CONTAINMENT | Wafer grid inside wafer, ports/lights inside switch, caliper display inside slider. |
| JUNCTION | CPU pins meet the package; switch ports share size/pitch; caliper jaws remain parallel and attached. |
| OCCLUSION | Rear stack contours stay outside front silhouettes. Caliper beam is interrupted beneath the slider. |
| STACK | Plural collections declare a stack. Server alignment and slide-sheet offsets are checked explicitly. |
| REVIEW | A dated per-icon judgment at 32/64px in four treatments matches the current source/rules/export fingerprint. |

The numeric contract lives in `astro/scripts/slides/rules.json`. Checks cannot judge
recognition or physical meaning by themselves: every icon also has a specific
visual review in `astro/vendor/slide-icons/reviews.json`. A library source is a
starting point, not a substitute for looking. Original physical parts require
additional containment, junction and occlusion contracts.

## Workflow

Use [the slide-icons skill](../../.claude/skills/slide-icons/SKILL.md). Run commands
from `astro/`:

```sh
npm run slides:import  # deterministic normalization and source-derived accents
npm run slides:proof   # permits unapproved proofs, never a publishable ZIP
# Inspect each changed icon in slides-out/revision-flat/proofs/ at 32 and 64px.
# Record a specific review and the proof report's fingerprint only after looking.
npm run slides:export # refuses a missing/stale review
npm run slides:check  # independent XML, geometry, fixtures, reviews, SVG and ZIP
npm run check
npm run build
npm run slides:browser # native Chromium, run by the CI preview harness
```

The audit selftest deliberately breaks twelve icons: a floating accent, detached
CPU pin, escaping wafer grid, beam through a slider, rear line through a front
sheet, misaligned server, absent plural stack, unknown camera, source drift,
out-of-frame line, excessive teal and a tilted caliper jaw. Each must fail its own geometry rule;
rejecting only the source hash would be insufficient. A changed export must also
invalidate the review fingerprint.

Geometry is vendored under `astro/vendor/slide-icons/` and generated into
`astro/src/figures/kit/slides/definitions.json`. `SlideIcon` and the SVG serializer
present the same native primitives. No runtime icon-library dependency is needed.
The component is demonstrated in the design-system ledger with copyable usage.

The build regenerates 192 individual SVGs, four sprites, four 64/32px overview
sheets, 48 individual proofs, six family proofs, licenses, a source manifest,
per-icon quality report and deterministic ZIP: 259 entries. Python independently
parses every SVG and decodes the ZIP/checksums. Browser checks compare every live
primitive against the canonical data in all four treatments, independently measure
accent attachment/budget, and exercise search, six families, saved views, copy,
downloads, mobile overflow and useful no-JavaScript rendering. Desktop, phone and
32px contact sheets are inspected before shipping.
