# Reuse a fitting source

For an already-themed icon, inspect its preview, then run
`npm run slides:use -- --id=ID --task="slide meaning" --why="why it fits"`.
This verifies its current review/source/export and copies an SVG with a private,
ignored use receipt. It does not change the canonical source, fit record or review.
Hand over that asset; no new import or site build is needed for unchanged reuse.

For a fitting external source that is not yet in the themed library:

1. Use the routed bath source/spec as a structural example, then pin the source bytes, upstream URL/version and full license. Normalize its grid
   deliberately if required; never quietly distort its proportions.
2. Name visible parts in `parts`. Declare the view's projection, description,
   visible/hidden parts and rationale. A view name is descriptive, not an enum of
   allowed objects. Flat and parallel projections are the current taste boundary.
3. Select one meaningful existing source feature for the teal treatment. Use a
   kernel selector; use monochrome when placing an icon without signal colour.
4. Add applicable constraints. Preserve intentional gaps; a detached endpoint is
   a defect only when a physical connection was declared. Collections declare a
   stack and applicable occlusion/repetition constraints.
5. Stage with `npm run slides:add -- --spec=PATH --svg=PATH`, then
   `npm run slides:import`. Both commands report failures; no review is fabricated.

Exit to [review](review.md). To edit an existing icon, change that source/spec and
its pin deliberately, regenerate and review the changed revision.
