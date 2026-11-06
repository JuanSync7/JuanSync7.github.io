# Presentation pages

| | |
|---|---|
| What | The shared template, controls, typography, motion and checks for system presentation pages. |
| Why | Keep introductions concise and detailed guides readable, with repeatable visual and behavioral checks. |
| Who | Site maintainers and agents building or reviewing these pages. |
| When | Creating a system landing page or changing its guides, controls or presentation tokens. |
| Where | `astro/src/layouts/`, shared presentation components, tokens and `astro/scripts/presentation/`. |

Use a presentation page to introduce a system and help a reader choose where to go next. The
landing page states the problem, outcome and main benefits; focused guides carry the architecture,
rules, schema and examples. The vault pages are the first implementation of this pattern.

The user's canonical website preferences live in the private vault's
`Notes/Decks/Designing website pages.md` (R-WEB-1–8). This document describes the public
implementation, not a private-data synchronization mechanism. Review the canonical rules during
website work; no private file enters this site's build or runtime.

## Template and hierarchy

`src/layouts/PresentationLayout.astro` supplies navigation, canonical metadata, the main landmark,
shared typography and scoped motion. Set `kind="landing"` for the introduction and `kind="guide"`
for a detailed page. `VaultGuide.astro` adds a breadcrumb, current-guide navigation and onward links;
the route registry is `src/data/vault-pages.ts`. Give each guide one clear subject and one H1.

Use `pr-title`, `pr-body`, `pr-comment` and `pr-label` for headings, reading copy, secondary notes
and short labels. Their color, weight and size roles live in `styles/tokens/presentation.css`.
Comments remain readable; making text smaller or dimmer is not a substitute for removing it.
All new tokens appear in `/design-system/`, including a live text-hierarchy specimen.

`scripts/presentation/contract.json` owns the current implementation limits. These defaults are
implementation choices, not numbers supplied by the user.
`check.mjs` resolves token aliases and alpha composites and checks both the contrast floor and
separation. Deliberately failing fixtures protect these checks.

| Contract key | Default | What changing it changes |
|---|---|---|
| `schema` | `presentation-contract/1` | Identifies this contract format; coordinate a format change with its reader. |
| `minNormalContrast` | 4.5 | Minimum text-to-background contrast for roles and action faces. |
| `minTitleBodyLuminanceRatio` | 1.35 | Minimum separation between title and body inks. |
| `minBodyCommentLuminanceRatio` | 1.45 | Minimum separation between body and comment inks. |
| `maxLandingWords` | 550 | Maximum words in the landing's main content; detailed guides have their own reading task. |
| `maxHeroHeadlineLines` | 3 | Maximum rendered hero lines at the configured widths; catches a headline that overwhelms the opening. |
| `background` | `--nt-ground` | Token used as the source-check background. Browser checks also inspect actual rendered colors. |
| `roles` | title/body/comment/label → matching `--pr-*` aliases | The color roles resolved and tested; keep the template and live specimen in agreement. |
| `buttonVariants` | paper, signal, outline | Faces covered by source and browser contrast checks. Update the component and specimen together. |
| `guideSlugs` | purpose, architecture, knowledge-graph, search, guardrails | Required guide destinations and browser navigation coverage. Update the route registry and files together. |
| `viewports` | 1360, 768, 390px | Browser layout and screenshot widths. Narrowing this list reduces responsive evidence. |

Role separation uses `(max(L1,L2) + 0.05) / (min(L1,L2) + 0.05)` with WCAG relative luminance.
It is checked independently of contrast against the page background. Change a default with a
rationale, keep the private rule deck's reference table current, and run the failure fixtures.

## Actions and depth

Use `components/ui/PaperAction.astro`, with `paper`, `signal` or `outline` variants. Supply `href`
for navigation or native button props for actions. Its named `icon` slot accepts existing marks;
the default link arrow is replaced when an icon slot is supplied. Native disabled, keyboard focus, press and popover behavior
share the same component. Colors, borders, offsets and timing live in `styles/tokens/buttons.css`.
The live specimen at `/design-system/#paper-actions` shows every variant and state.

Use depth sparingly where it reinforces the content. The vault hero's three real paper links
represent source, connection and recall. Their labels remain real selectable DOM text. Do not
invent independent button styles for each section or animate decorative movement continuously.

## Motion and fallbacks

Mark logical sections with `data-presentation-section` and stable IDs. Place `data-reveal` on
wrappers that do not already own CSS transforms. Optional `data-section-rule` rails draw as a
section enters; chapter links with `data-section-link` reflect the current section.

`components/presentation/motion.ts` dynamically loads GSAP, ScrollTrigger and CustomEase. It reads
motion values from tokens, scopes animations to the current root and cleans up on Astro swaps,
page lifecycle events and hot reload. Content starts visible, remains readable when scripts fail,
and uses a static layout when reduced motion is requested. No global kill-all-trigger operation
can disturb the rest of the site.

## Verification

From `astro/`, run `npm run check`, `npm run build`, `npm run vault:page` and
`npm run presentation:page`. `npm run presentation:selftest` exercises the contrast and word-budget
failure fixtures. Normal GitHub-hosted CI runs `npm run presentation:browser` and uploads the
`vault-presentation` artifact for human visual review.

The browser check covers 1360, 768 and 390px widths; actual computed text/button colors; overflow;
all guide links; Astro cleanup; hover, keyboard, native disabled and popover controls; moved graph
search; reduced motion; and no-JavaScript readability. Inspect the resulting screenshots as well
as the assertions. A green build alone cannot establish a polished visual result.

| Failure question | Answer in this pattern | Held by |
|---|---|---|
| What if scripts fail or motion is disabled? | Content starts visible; reduced motion keeps the static layout. | No-JavaScript and reduced-motion browser cases. |
| What if a reader enters a guide directly? | Every guide has its own title, canonical URL, overview link and sibling navigation. | Built-page route/anchor checks and browser guide visits. |
| What if a route changes while GSAP is loading? | The old owner aborts; stale async initialization cannot attach to the replacement. | Scoped generation/abort guards and browser disposal assertion. |
| What if a color alias changes a month later? | Resolved values and actual computed roles must still meet the configured floor and separation. | Source fixtures plus browser color checks. |
| What if public and private repositories are checked out together? | Public pages import only public copy, diagram data and synthetic records. | Source/built boundary checks and editorial review. |
| What if the landing grows into a manual again? | The landing fails its configured word budget; details belong in focused guides. | Built-page check; guide quality still needs review. |
