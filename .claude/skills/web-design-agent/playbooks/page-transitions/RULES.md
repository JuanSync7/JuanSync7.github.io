# Page transition rules

What every page-to-page transition holds, whatever its recipe. Case: the page turn on juansync.dev,
rebuilt on the compositor on 22 November 2026 (site PR #130).

| ID | Requirement / rationale | Failure case | Implementation / proof |
|---|---|---|---|
| TRN-1 | Move layers with `transform` and `opacity` only (WEB-PERF-1). A cut at an angle is a layer turned to the angle with `overflow: clip`, holding the page turned back by as much, both on the same keyframes so they cancel exactly. | The first page turn animated `clip-path` polygons and stalled whenever the landing page built figures. | `../../checks/perf/block.mjs` |
| TRN-2 | Give every layer a start state that matches its first frame, and let the first frame set what changes. | Without it, going back shows the arriving page whole for a frame, and the flap covers the page unmoved. | `recipes/page-turn.md` (start opacities in `page-turn.css`) |
| TRN-3 | The page underneath is its own layer and is never cut. Only the top page is. Its shading is a dark layer whose opacity fades, never a filter. | Cutting the page that stays shows the paper behind both. | The page turn's `pp-under` and `pp-shade` layers |
| TRN-4 | State the transition needs after the swap (sizes, the direction) is set on the incoming document's root. | Astro copies the incoming root's attributes over at the swap: variables set on the live root vanished and every cut layer had zero size. | `e.newDocument.documentElement` in `page-curl.ts` |
| TRN-5 | Paper colours come from the page's tokens (`--pp-ground` for a paper back, `--pp-ink-shadow` for shade), never a literal, so they follow the theme. | Juan saw the back of the flap not follow the page's colour when the turn was first built. | `checks/flap-colour.mjs`, in both themes, forward and back |
| TRN-6 | An element captured as its own layer loses `backdrop-filter`: give it a solid background while it is captured. | Text scrolled under the nav showed through it during a turn back from a scrolled page. | `page-turn.css`, the `.pp-under .pp-nav` rule, and `checks/shots.mjs` with `SCROLL` |
| TRN-7 | During a swap only the transition's own layers keep a `view-transition-name`. | A post card's cover slid across on top while the page turned under it. | `page-turn.css` and the site's `site:turn` build check |
| TRN-8 | Timing comes from a duration token (`--pp-dur-flip` for the turn), and the easing is the recipe's. Back plays the same transition in reverse with the pages swapped. | | `recipes/page-turn.md` |
| TRN-9 | Under reduced motion no layer is named and the page swaps at once. | | The `prefers-reduced-motion` block in `page-turn.css` |

A recipe says which directions it supports. A new direction (a turn from the top, a slide up) is
the same geometry turned by a quarter, a half or three quarters: write it into the recipe, then
check it with `shots.mjs`.
