# Motion and performance

Use when an animation stutters, a page or a figure freezes while it loads, or a change adds motion,
a figure or a heavy graphic to a page. The rules are WEB-PERF-1 to 7 in `../RULES.md`.

## Steps

1. **Name the lag.** Write down the page, the action (a click to the lab, a scroll to the work
   cards) and what the reader sees (a stall, an empty box, a late tap). Reproduce it on a built
   site (`npm run build`, `npx astro preview`), never on the dev server.
2. **Measure before changing anything.** Run `checks/perf/lag.mjs` for the long tasks and the
   script behind each, and for an animation `checks/perf/block.mjs` and `smooth.mjs`. Keep the
   numbers: they are the "before" in the pull request.
3. **Find the cause.** An animation that stalls under `block.mjs` is painted on the main thread:
   read which properties it animates (WEB-PERF-1, 2). A long task names its script: profile into it
   to find the function, and ask whether its answer ever changes.
4. **Pick the fix from the ladder, top first.**
   - The animation moves a property other than `transform` or `opacity` → paint it once on a layer
     and move the layer (WEB-PERF-1). A clip at an angle is a layer turned to that angle with
     `overflow: clip`, holding the content turned back by as much.
   - A blurring filter sits on a moving layer → a `box-shadow` painted with the layer (WEB-PERF-2).
   - The work gives the same answer every time → do it at the build and ship the result
     (WEB-PERF-4).
   - Several figures build at once → queue them (WEB-PERF-5).
   - One figure still blocks for long → plot it in as part of its look (WEB-PERF-6), or move its
     build to a worker with `OffscreenCanvas` when the scene allows.
5. **Measure again on the same machine,** old build against new (WEB-PERF-7). Screenshot the
   animation at 25, 50 and 75 % beside the old one, forward and back, scrolled, in the night theme
   and on a phone. Run the figure audit for every figure the change touches.
6. **Hand over** the before and after numbers, the screenshots and what is still slow, in the pull
   request and in the vault.

## If you catch yourself

| Thinking | Do instead |
|---|---|
| "I'll make the figures wait until the animation ends" | move the animation to the compositor; then both can run (WEB-PERF-1) |
| "a drop-shadow on the moving layer is just one line" | paint a `box-shadow` with the layer (WEB-PERF-2) |
| "the counter says it passed" | look at the picture at the same moment (WEB-PERF-7) |
| "60 fps on this headless box, so it is smooth" | compare old and new on the same box; quote no absolute rate (WEB-PERF-7) |
| "it is fast on my laptop" | run `lag.mjs` and read the long tasks (WEB-PERF-3) |
| "the browser can work it out each visit" | if the answer never changes, bake it at the build (WEB-PERF-4) |

## Gotchas met on the page turn

- Astro copies the incoming page's `<html>` attributes over at the swap. A variable or data
  attribute the turn needs after the swap is set on `e.newDocument.documentElement`, not on the
  live root.
- An element captured as its own view-transition layer loses `backdrop-filter`: inside that layer
  the blur cannot see what it blurs. Give it a solid background while it is captured.
- `Page.captureScreenshot` waits for the main thread, so it cannot show whether an animation ran
  during a block. The screencast can, and the probes use it.
