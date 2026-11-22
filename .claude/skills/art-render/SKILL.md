---
name: art_render
description: Use when a baked figure for juansync.dev is rendered for the page (its pyramid, budgets and level of detail near and far), registered by its manifest, or when parts move over it on the page.
---

# Rendering baked art, near and far

You turn a pen-and-wash or graphite SVG into what the page loads, and register it as a figure (R-FIG-33). The
rules are in `references/rules.md` (generated from [[Notes/Decks/Baked art]]), the questions in `references/look.md`, the API in
`references/kernel.md`. You change neither `kernel/` nor `checks/` to pass, and never edit a manifest by hand.

## Steps

1. **Bake the pictures** at `PICTURE_SCALE` (4x) and strip every live effect from the vector, which stays for
   print only (R-BAKE-7).
2. **Export the pyramid:** `python3 -m kernel.render SRC OUT NAME --tile-width W --background HEX`, 4x, then
   Lanczos down to 2x and 1x, WebP at the kernel's quality (R-BAKE-7).
3. **Check:** `python3 checks/check_render.py SRC OUT NAME --tile-width W --background HEX`, every line PASS.
4. **Register:** the project's manifest writer (on the site, `kernel/plate.py`) writes `src/figures/plates/<id>.json`
   with the sources, byte counts, the tokens and their digest, and the anchors. Then the site's
   `npm run figures:audit`; read the sheet it writes (R-FIG-33).
5. **Show it by id** with `<FigurePlate id>`; the page loads 1x and 2x by resolution and never names an image
   path (R-FIG-33).
6. **Live parts on top** are page text and DOM placed by the anchors (R-BAKE-8). They move only by transform and
   opacity, one element per axis for an arc, with durations read from the tokens (R-BAKE-9). A live figure is
   mounted only once its box is at full size (R-BAKE-10).
7. **Re-bake** with the project's command whenever a token the plate names changes; the audit fails it as stale
   until then.
8. **Hand over**, then answer `references/look.md`.

## When to ask
When a level is over budget and cutting quality would change the look: say which level and by how much.

## Hand-over
The check output, the audit line and the sheet read, the bytes per level against budget, and the anchors used.

## Layout
`references/rules.md`, `references/look.md`, `kernel/` (`INDEX.md` first), `checks/` (with `common.py`, shared by the other two
playbooks' checks), `examples/`.
