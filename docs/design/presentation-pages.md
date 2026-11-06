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

This document describes the public implementation. Review the user's applicable website guidance
during website work; private policy records stay in their own system. No private file enters this
site's build or runtime.

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

Use depth where it reinforces the content. The vault hero is a two-drawer hairline filing cabinet.
Its System, Graph and Search folders are real HTML links to architecture, knowledge graph and search.
Hover or keyboard focus raises the selected folder; Enter or a tap follows its guide. Labels remain
selectable DOM text, projected with the same camera and pose as the drawing. Fixed target envelopes
cover each folder's resting and raised positions, so a rising tab cannot escape the pointer.

`components/vault/VaultFileCabinet.tsx` composes `FigureCanvas`, native links and the readout.
`useCabinetPose.ts` owns its GSAP state and preference cleanup. `figures/vault-cabinet.ts` owns the
physical geometry and exports the shared projection and default pose. Its drawer is supported by
rails, its front lip hides folder bottoms, and one teal folder marks the selected destination.
The canvas is decorative to assistive technology; the named native links expose the useful action.
Do not invent independent button styles for each section or add continuous decorative movement.

## Motion and fallbacks

Mark logical sections with `data-presentation-section` and stable IDs. Place `data-reveal` on
wrappers that do not already own CSS transforms. Optional `data-section-rule` rails draw as a
section enters; chapter links with `data-section-link` reflect the current section.

`components/presentation/motion.ts` dynamically loads GSAP, ScrollTrigger and CustomEase. On the
landing it also loads SplitText, after webfonts settle, to reveal heading words through masks. It reads
motion values from tokens, scopes animations to the current root and cleans up on Astro swaps,
page lifecycle events and hot reload. Content starts visible, remains readable when scripts fail,
and uses a static layout when reduced motion is requested. No global kill-all-trigger operation
can disturb the rest of the site.

The vault landing uses `landing-scroll.ts` for reversible ScrollTrigger motion. On wide screens,
the hero copy and cabinet stay in view while native scrolling opens the drawer and introduces its
three folders. A phone uses normal document flow and drives the same story while the cabinet passes
through the viewport. Hover/focus takes priority over that story; leaving returns to its current
chapter. The controls work independently of the scroll engine.

`heading-reveals.ts` moves heading words through masks; guide cards rise, turn and settle. Benefit
articles rise inside clipped wrappers so they cannot overlap the following note. Section dividers
draw as they enter. The chapter bar stays below the site header and its rail shows actual progress.
Anchor links use native smooth scrolling; wheel, touch and keyboard scrolling keep browser control.
Guides retain their quieter reading layout.

Motion and layout values live in `styles/tokens/presentation.css`. The design-system token ledger
displays their current values. Defaults below are implementation choices, adjustable after review.

| Controls | Default and purpose |
|---|---|
| `--vc-stage-aspect`, `--vc-stage-max` | 500/560 and 520px; room for the physical cabinet and a raised tab. |
| `--vc-scene-length`, `--vc-sticky-top` | 160svh and the 64px header plus 48px; wide-screen story space and clearance. |
| `--vc-folder-duration`, `--vc-story-lift` | 700ms and 35%; a full interactive lift and a gentler story cue. |
| `--vc-card-travel`, `--vc-card-sway`, `--vc-card-turn` | 120px, 32px and 2deg maximum entry movement; lateral movement/turn are omitted on narrow screens. |
| `--vc-word-travel`, `--vc-word-stagger` | 110% and 60ms; masked word travel and spacing. |
| `--pr-scroll-scrub`, `--pr-scroll-reference` | Catch-up time and reference width; scale travel down on narrower layouts. |
| `--pr-scroll-*-enter`, `--pr-scroll-*-settle` | Viewport entry/settle positions for sections and cards. |
| `--pr-scroll-clearance`, `--pr-scroll-inset` | Extra anchor clearance and measured combined header heights. |

Reduced motion reverts heading splits and owned tweens, removes the sticky hero's extra length and
keeps an open, static cabinet. Folder selection changes instantly. Re-enabling motion rebuilds the
owned sequence; canvas remounting ensures its frame clock adopts the new preference. No pin spacers,
scroll interception or global trigger cleanup are used. Reading copy stays opaque.

## Cabinet poster and repeatability

`public/vault/vault-cabinet.png` is the default cabinet pose exported from the actual figure renderer.
The server-rendered folder links use that same pose. The poster remains visible until a successful
canvas frame; missing JavaScript or a failed drawing leaves the image and all three links usable.
The canvas replaces the poster once ready. There is no separately maintained illustration.

The independent **Export cabinet poster** workflow and normal hosted presentation CI capture
`cabinet-poster.png` plus `cabinet-poster-source.json` from the fixed-time figure bench at the
landing's aspect ratio and 2× resolution. After a geometry or palette change:

1. Build and push the source to a review branch. The export workflow runs automatically for renderer
   changes; it can also be dispatched against a branch. It runs independently of the stale-poster gate.
2. Download both files from `cabinet-poster-export` (or `vault-presentation`) for that exact revision.
3. Run `npm run cabinet:poster -- /absolute/path/to/cabinet-poster.png` from `astro/`.
4. Commit the PNG and generated manifest; run the source/build checks and review the final fallback.

The manifest binds the image bytes to the figure, camera, drawing, ink, motion helpers, palette, renderer, frame clock, figure wrappers,
registry and capture recipe.
`presentation:check` rejects stale assets. The installer checks the PNG dimensions and verifies the exported source manifest against the local
renderer before accepting the image; the browser cases
check visible image loading and real links with JavaScript disabled. A source hash cannot establish
visual quality: reviewers must still inspect the actual rendered evidence.

## Cabinet visual review

The hosted six-frame cabinet sheet was inspected on 6 November 2026, including rest, later,
responsive answer, live, phone and reduced-motion views. The source/look audit passed. Review of
the page captures also checked projected labels and the raised Graph folder at desktop and phone
widths. These are observations from rendered evidence, separate from the automated assertions.

| Figure review question | Observed result |
|---|---|
| Is the subject recognizable on a phone? | Yes: case, projecting drawer, handles and three tabbed folders. |
| Is the rest state composed? | Yes: one teal Graph folder provides the point of attention. |
| Does motion fit its declared class? | Yes: rest/later stay still; pointer selection raises one folder. |
| Does the answer match the readout? | Yes: the System answer lifts that folder and names it. |
| Are the lines clean? | Yes: fine, stable edges without a noisy texture. |
| Does the depth make physical sense? | Yes: rails meet the case, tray supports the folders, and the front lip masks their bases. |
| Does the style add variety? | Yes: hairline is distinct from the existing low-poly and Three.js heroes. |
| Does everything fit? | Yes: feet, drawer and raised tabs remain inside desktop and phone frames. |
| Is the composition restrained? | Yes: the ground dominates and the details describe working cabinet parts. |
| Does reduced motion preserve the object? | Yes: the static cabinet remains complete and readable. |

## Verification

From `astro/`, run `npm run check`, `npm run build`, `npm run vault:page` and
`npm run presentation:page`. `npm run presentation:selftest` exercises the contrast and word-budget
failure fixtures. Normal GitHub-hosted CI runs `npm run presentation:browser` and uploads the
`vault-presentation` artifact for human visual review.

The browser check covers 1360, 768 and 390px widths; actual computed text/button colors; overflow;
all guide links; Astro cleanup; hover, keyboard, native disabled and popover controls; moved graph
search; reduced motion; and no-JavaScript image/link usability. Inspect the resulting screenshots as well
as the assertions. A green build alone cannot establish a polished visual result.

`scroll-check.mjs` additionally checks native scroll position, forward and reverse drawer movement,
sticky progress, anchor clearance, raised folder focus after reversal and live reduced-motion
teardown. Every cabinet folder is opened with Enter and checked against its guide destination. The artifact includes start, hero-exit and guide-entry viewport captures for desktop and
phone widths, alongside the full-page views.

| Failure question | Answer in this pattern | Held by |
|---|---|---|
| What if scripts fail or motion is disabled? | Content starts visible; reduced motion keeps the static layout. | No-JavaScript and reduced-motion browser cases. |
| What if a reader enters a guide directly? | Every guide has its own title, canonical URL, overview link and sibling navigation. | Built-page route/anchor checks and browser guide visits. |
| What if a route changes while GSAP is loading? | The old owner aborts; stale async initialization cannot attach to the replacement. | Scoped generation/abort guards and browser disposal assertion. |
| What if a color alias changes a month later? | Resolved values and actual computed roles must still meet the configured floor and separation. | Source fixtures plus browser color checks. |
| What if public and private repositories are checked out together? | Public pages import only public copy, diagram data and synthetic records. | Source/built boundary checks and editorial review. |
| What if the landing grows into a manual again? | The landing fails its configured word budget; details belong in focused guides. | Built-page check; guide quality still needs review. |
