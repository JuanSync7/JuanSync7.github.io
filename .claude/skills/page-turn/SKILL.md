---
name: page-turn
description: Use when changing motion between pages on juansync.dev — the page curl, view-transition names or layers, the theme brush, entrance animations on a page arrived at by a turn, astro:* navigation handlers, or when islands and figures start during navigation. Holds how a turn is built (kernel, glue, CSS), the order of everything in a navigation, and the checks that prove it renders correctly and runs on the compositor.
---

# Page turn

A page swap on the paper system turns the page like a sheet of a notepad: the page you leave
lifts from its bottom-right corner with a slight fold, its paper back (the page's own colour)
folds over it, and the next page is revealed behind the fold. Going back lays the earlier page
down again. Juan asked for this on 17 Nov 2026 in place of a flat rotate; it is his taste, not a
default to change (site-taste, Motion).

Two things make it right, and both are checked:

- **It looks like paper.** The paper back is the page's ground in both themes; nothing on the
  incoming page shows before its turn; nothing floats over the turn.
- **It runs on the compositor.** Every frame only moves layers that were painted once. The
  main thread can be busy (an island hydrating, a figure compiling) and the turn still moves.

## Where it lives

| Part | File | What it owns |
| --- | --- | --- |
| Kernel | `astro/src/components/layout/curl-kernel.ts` | Pure numbers: the fold at progress p, the four transforms, the keyframes, the box sizes, and reference geometry for the checks. No DOM. |
| Glue | `astro/src/components/layout/page-curl.ts` | Astro events, view-transition names, the turn token, sizing, starting and cleaning up the animations, finishing entrances. |
| Hold | `astro/src/components/layout/page-turn.ts` | `afterTurn()`: heavy work on the incoming page (figures) waits on it. |
| Stacking | `astro/src/styles/paper.css` ("Page swaps") | The layers' z-order, overflow clips, start states and the paper back's shading. |
| Tokens | `astro/src/styles/tokens/paper.css` | `--pp-dur-flip`, `--pp-curl-*` (blur, gleam, crease, sheen). |
| Checks | `astro/scripts/page-turn/` | `kernel-check.mjs` (+ `fixtures/`), `browser-check.mjs`. |

## The layers

All four are moved by `transform` (and `opacity` to appear); the clips are overflow boxes, not
`clip-path`, so the browser never repaints them while the page turns.

| Layer | Pseudo-element | Transform |
| --- | --- | --- |
| The turning page | `::view-transition-group(root)`, a box with `overflow: clip` whose edge is the fold | `keepBox` |
| … held still inside it | `::view-transition-image-pair(root)` | `keepPage` = inverse of `keepBox` |
| The page underneath | `::view-transition-group(pp-under)`: that document's `.pp-page`, named for one turn | none |
| The paper back | `::view-transition-group(pp-curl)`, the page rect with `overflow: clip` | `flapFold`: reflect across the fold, foreshorten |
| … its paper | `::view-transition-image-pair(pp-curl)`, a box whose top edge is the fold, static shading | `flapSheet` |
| A shared cover | `::view-transition-group(cover-…)`, only when the cover is on both pages | the browser's own morph |

Forward the root sheet is the old page and `.pp-page` of the new document is `pp-under`; back
the root sheet is the new page and the old `.pp-page` is `pp-under`. The root image without the
sheet is only ground and is hidden.

## The order of a navigation

1. Click. Astro fetches the next page.
2. `astro:before-preparation` loader, once the page is loaded: drop names that are not on both
   pages, name `pp-under`, set `data-astro-pp-turn` (forward/back) and bump the generation.
3. Astro skips any running transition (the earlier turn snaps to its end) and starts the view
   transition. The old page is captured; every name must be final by now.
4. Update callback: `astro:before-swap` (hold the turn, or skip it under reduced motion), the
   swap, `astro:after-swap` (theme re-applied, boxes sized, entrance animations finished).
5. The new page is captured; `ready`. All four animations start in one task.
6. The turn: compositor only. Astro runs page scripts and islands hydrate on the main thread
   meanwhile; anything heavy waits for `afterTurn()`.
7. `finished`: animations cancelled; if this turn is still the latest, the token and the
   `pp-under` name are removed, `pp-turn-finished` is marked and `pp:turned` dispatched.
   Figures load now (`pp-figure-load`), and a theme toggle pressed mid-turn runs now.

Arriving by a turn, **the turn is the entrance**: the incoming page's own entrance animations
(`.pp-rise`, the card deal) are finished at once, because the page is shown live behind the
fold and would otherwise be revealed half-faded. They still play on a first load. Figures start
after the turn and appear a moment after the page lands; a poster frame for them is an open
improvement.

## Workflow

1. Read site-taste (Motion) and `RULES.md` here.
2. Change the kernel first. `npm run turn:selftest`: the kernel holds PT-1..PT-8 on seven window
   sizes and every fixture in `scripts/page-turn/fixtures/` is still caught.
3. Change the glue and the CSS to match. A new layer gets a row in the tables above.
4. `npm run build`, then `npm run turn:browser` (set `CHROME_PATH` to use a local Chrome). It
   writes `figures-out/page-turn/*.png`: **read every sheet**. A pass that nobody looked at is
   not done.
5. A rule that a change makes fail is a finding, not an obstacle: fix the turn. Change a
   tolerance only with the reason in the commit message, and add a fixture for any new rule.

## Measuring speed

`requestAnimationFrame` counts main-thread frames; a compositor turn can be smooth while rAF
reports 5fps. Count presented frames instead (CDP `Page.startScreencast` timestamps), and block
the main thread on purpose to prove the turn does not need it. Headless software raster is a
floor, not the target: on a GPU the same turn runs at the display's rate.
