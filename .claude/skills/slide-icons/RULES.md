# Craft rules

The machine policy and thresholds live in `astro/scripts/slides/rules.json`.
Geometry contracts live with each icon. This file holds judgments.

| Rule | Keep it / reject when | Origin and evaluation case |
| --- | --- | --- |
| FIT | Express the slide's intended meaning. Reject a convenient library mark whose extra parts change the story. | User request to reuse only when appropriate; generic bath versus freestanding-no-shower case. |
| VIEW | Choose a coherent view and omit concealed edges. Reject a rear part visible through a front face. | User's misplaced 3D edges; rear-sheet and beam-through-slider fixtures. |
| SIGNAL | Put teal on one meaningful existing feature in full: a straight line runs endpoint to endpoint; a circle or ellipse uses the complete outline. Reject partial spans, floating dashes or extra decoration. | User's full-line/full-circle correction (6 Nov 2026); partial-line and partial-circle regressions. |
| CLARITY | Preserve recognition at the configured proof sizes. Reject detail that merges or an outline that reads as another noun. | User's slide-use request; LOOK questions and unseen-subject trials. |
| COLLECTION | Use a stack when the meaning is a collection; keep visible rear contours coherent. | User's plural instruction; stack/misalignment fixtures. |

## Catch yourself

| Temptation | Follow instead |
| --- | --- |
| “It is not one of the existing icons.” | Search references, then add a source/spec. Subjects and families are open. |
| “The closest icon is good enough.” | Recheck the actual brief; record why it fits or create the missing silhouette. |
| “I need to start the whole drawing again.” | Keep the brief and passing relationships; fix the failing part or constraint. |
| “The new icon needs its own passing script.” | Declare constraints for the shared checker. A new operation needs maintainer review and fixtures. |
| “The checker is in the way.” | Fix the icon. Preserve a concrete unsupported case for the maintainer; do not weaken policy. |
| “Everything is green, so it must look right.” | Inspect the proof and answer LOOK with specific evidence. |

Known-good and rejected examples: [fit decisions](examples/fit-decisions.md),
[geometry cases](examples/geometry.md). New examples should identify the rule and
record both what passes and what fails. Retiring a rule requires evidence that its
original case and the held-out cases still pass without it.
