# The look

The check reads text and the look measures pixels. Neither can tell whether the figure is
good. Only eyes can, so the sheet exists for you to look at.

## The sheet

`npm run figure -- <id>` writes `figures-out/<id>.png`: six pictures and the result lines.

| Picture | What it is |
| --- | --- |
| rest | frozen at 0.8 s, nobody touching it |
| later | frozen at 2.6 s: compared with rest to prove ambient motion (or its absence) |
| answer | 2.6 s with the pointer held at 62% across, 45% down |
| live | running for 2.6 s: frame time and console are read here |
| phone | rest at 358 px wide |
| reduced motion | live under `prefers-reduced-motion`: must be still |

Lines in red failed and must be fixed; amber are warnings to weigh. The numbers behind them
are in `figures-out/report.json`. A three.js figure's subtitle names the renderer that ran:
`three · webgl` means the scene itself was captured; `three · 2d-fallback` (also a warning)
means only its fallback was, so the scene was not looked at.

The look ignores console lines that come from the harness, not the figure: the dev server's
HMR client, React's devtools hint, and headless Chromium's software-WebGL notices. Any other
error or warning fails the `console` check. A file that does not parse never reaches the look:
the check's `parse` code stops it first.

## What to see

Answer each with yes or no, from the sheet. A no is fixed before hand-over. Zoom with the Read
tool on the sheet if a line is too small to judge.

1. **The phone picture reads.** At 358 px you can still say what the object is. Point at the
   two or three features that make it that object; if they've vanished, simplify.
2. **Rest is composed.** Not a flat grid, not empty, not symmetric by default. One bright mark
   says where to look.
3. **The motion says the idea.** Compare rest and later and say in one line what changed. Is
   that the motion your `idea` field promised?
4. **The answer is local.** In the answer picture the change sits near the pointer and falls
   off; the whole figure didn't jump. The read-out names what's under the pointer.
5. **No noise.** Nothing reads as static, shimmer or moiré. Dense areas still have structure.
6. **Depth reads.** Near is brighter than far; no far line crosses a near face.
7. **It is different from its neighbours.** Run `npm run figures:check -- --list` and picture the
   figures beside it. Same technique with a new shape is not different.
8. **The frame holds.** Nothing important is cut off at the edge (unless the figure bleeds on
   purpose, `bleed: true`).
9. **It is quiet.** Ink is under ~40% of the frame. Removing one more element would make it
   worse, not better. (If removing it would make it better, remove it.)

Say at hand-over which of these you were unsure of. Do not say the look is done if you did not
read the sheet.

## When the look can't run

The look needs Chromium (Playwright) and a dev server. If it can't run, say so plainly at
hand-over, answer the nine questions from the code (point at the line that makes each true),
and say the figure was **not looked at in a browser**.
