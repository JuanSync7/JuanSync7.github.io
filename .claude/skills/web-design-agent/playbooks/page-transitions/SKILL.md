# Page transitions

Use when a page-to-page transition is built or changed: the page turn, or a new one (a tear, a
slide). Reached through [motion and performance](../motion.md). The rules are TRN-1 to 9 in
`RULES.md`, on top of WEB-PERF-1 to 7. Each transition is a recipe in `recipes/`, and what every
transition shares is in the steps and rules here.

## Steps

1. **Pick the recipe.** Changing the page turn: read `recipes/page-turn.md`. A new transition: copy
   the page turn's recipe layout (layers, geometry, keyframes, timing, directions, reference code)
   and write the new one before any code.
2. **Measure the current transition** on a served build, so there is a before:
   `../../checks/perf/block.mjs`, `checks/flap-colour.mjs` where the recipe has a paper back, and
   `checks/shots.mjs` forward and back.
3. **Build it from layers that only move** (TRN-1). Name each layer, give it a start state that
   matches its first frame (TRN-2), and keep every other `view-transition-name` off during the swap
   (TRN-7).
4. **Take colour from the page's tokens** (TRN-5) and timing from a duration token (TRN-8).
5. **Check it.** `block.mjs` passes on a light and a heavy page, `flap-colour.mjs` and its
   `--selftest` pass, and `shots.mjs` at 25, 50 and 75 % forward, back, from a scrolled page, in the night
   theme and on a phone, laid beside the reference. Reduced motion swaps the page with no
   transition (TRN-9).
6. **Hand over** the before and after numbers and the screenshots in the pull request.

## Checks

| Check | Answers |
|---|---|
| `../../checks/perf/block.mjs` | Does the transition keep drawing while the main thread is blocked? |
| `checks/flap-colour.mjs` | Does the paper back match the page's ground in both themes, forward and back? `--selftest` paints the flap red and must fail, so the sample is proved to land on the flap. |
| `checks/shots.mjs` | Screenshots at 25, 50 and 75 % to lay beside the reference (`SCROLL`, `DARK`, `VW`, `VH`). |
