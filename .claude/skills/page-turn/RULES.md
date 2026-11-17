# Page turn rules

Each rule has a check. A rule without a failing fixture or a browser assertion is a wish, not
a rule. `npm run turn:selftest` holds PT-1..PT-8 on the kernel; `npm run turn:browser` holds
PT-9..PT-14 on the built site.

| Rule | Holds | Check |
| --- | --- | --- |
| PT-1 props | Keyframes animate only `transform` and `opacity`: what a compositor moves without painting. No `clip-path`, no `background`, no `filter` on a page-sized layer. | kernel, fixture `pt1-clip-path` |
| PT-2 functions | A layer's transform has the same functions in the same order at every keyframe, and never `matrix()`, so the browser interpolates each parameter. | kernel, fixture `pt2-matrix` |
| PT-3 inverse | `keepBox` then `keepPage` is the identity at every keyframe and halfway between: the turning page never moves inside its clip. | kernel, fixture `pt3-not-inverse` |
| PT-4 flap | `flapFold` puts every lifted point where the reference fold (`folded`) puts it, within 1px: the paper back is the lifted page, reflected and foreshortened. | kernel, fixture `pt4-no-reflection` |
| PT-5 smooth | Between two keyframes the interpolated flap stays within 1.5px of the true fold, on every window size. Too few keyframes fails this. | kernel, fixture `pt5-few-frames` |
| PT-6 cover | The boxes reach every page corner at every p; nothing is lifted at 0; at 1 the page is all lifted and the flap is off screen. | kernel, fixture `pt6-small-boxes` |
| PT-7 reverse | Going back is the forward turn played backwards, frame for frame. | kernel, fixture `pt7-not-reversed` |
| PT-8 range | The fold angle stays in (−π, 0), k in (0, 1], and the fold only moves left: no wrap, no spin, no flip. | kernel, fixture `pt8-wrapped-angle` |
| PT-9 layers | During a turn only `root`, `pp-under`, `pp-curl` and names on both pages exist, and the four layers are animated with PT-1 properties only. | browser, live turns |
| PT-10 pixels | Mid-turn the kept part shows the page that turns, the revealed part the page underneath, and the paper back beyond its sheen the page's ground, light and dark, forward and back. | browser, frozen steps |
| PT-11 order | No figure mounts or starts loading before the turn finishes; the token and `pp-under` are gone after; no site script over 50ms runs once the turn has started. | browser, live turns |
| PT-12 compositor | A 400ms block of the main thread mid-turn does not stop the curl: the screen keeps changing. | browser, screencast |
| PT-13 cases | A second click mid-turn gets a full turn of its own; reduced motion turns nothing; a theme toggle mid-turn waits for the turn and keeps its brush. | browser, cases |
| PT-14 tall | A long article read halfway down turns exactly as it was on screen. | browser, `tall-post` |

## Catch the wrong fix

- Lowering the frame count, the sample share or a tolerance until a rule passes hides the
  failure; fix the geometry or the order instead.
- Animating `clip-path` "just for one layer" puts every frame back on the main thread.
- Delaying the incoming page's entrance animations until after the turn reveals an empty page;
  finish them, don't delay them.
- Removing a cover's name everywhere loses the card-to-post morph; drop only names that are
  not on both pages.
- Cleaning up in `finished` without the generation check strips a later turn's token.
