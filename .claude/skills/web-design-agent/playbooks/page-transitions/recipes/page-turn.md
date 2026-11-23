# Recipe: the page turn

The page you leave lifts from its bottom-right corner like a sheet of a notepad. A fold line crosses
the page from right to left. Past the fold the next page shows through, and the lifted part lies
folded back over the page as its paper back, foreshortened because it stands up off the pad. Going
back plays the turn in reverse with the pages swapped, so the earlier page lays itself back down.

## Reference code (juansync.dev)

- `astro/src/components/layout/page-curl.ts`: the geometry, the keyframes and the layer naming.
- `astro/src/styles/page-turn.css`: the layers' start states and stacking.
- `astro/src/components/layout/PageTurn.astro`: the two empty layers (`.pp-shade`, `.pp-curl`).
- Tokens: `--pp-dur-flip` (1100 ms), `--pp-curl-crease`, `--pp-curl-sheen`, `--pp-curl-blur`,
  `--pp-ground`, `--pp-ink-shadow`.

When a second recipe needs the same layer code, move the shared part into this playbook's
`kernel/` and sync it into the site (R-AGT-6, 18).

## Layers, bottom to top

| Layer | What it holds | Moves |
|---|---|---|
| `pp-under` | The page being uncovered: the incoming `.pp-page` going forward, the outgoing one going back | nothing |
| `pp-shade` | A dark sheet over it | opacity, 0.1 to 0 as the page is uncovered |
| `root` | The turning page, inside the cut | the cut turns and moves, and the page inside turns back by as much |
| `pp-curl` | The paper back: the page's shape mirrored over the fold inside the same cut | as the cut, while the shape reflects and foreshortens and its crease and sheen stay square to the fold |

## Geometry at progress p (0 flat, 1 gone) on a w by h window

- The fold meets the bottom edge at `b = w - p(1.2w + 0.15h)` and the top edge at
  `a = b + h(0.55 - 0.4p)`: it starts at the corner leaning well over and stands nearly upright as
  it leaves the page.
- Its angle is `phi = atan2(-h, a - b)`. The lifted part is foreshortened by `k = 0.85 - 0.3p`.
- 72 keyframes, eased by `0.5 - cos(pi t) / 2`, so the corner eases off the pad and the page eases
  out as it clears.
- The cut is a square of side `4(w + h)` whose bottom edge lies on the fold, centred where the fold
  meets the bottom of the page.

## Directions

Forward (a link) and back (history). A turn from another corner is the same geometry turned by a
quarter, a half or three quarters (the note under the rules in `../RULES.md`). None is built yet.

## Evidence it holds

On 22 November 2026, against the clip-path turn it replaced: `block.mjs` showed 4 to 7 new pictures
during a 700 ms block (the old turn 1). `flap-colour.mjs` matched the page's ground exactly in both
themes, forward and back. Screenshots at 25, 50 and 75 % matched the old turn forward, back, from a
scrolled page, in the night theme and on a phone.
