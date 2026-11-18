# Rules: design_system

Generated from the decks by `_scripts/playbook_pack.py render`; never edit it. To change a
rule, change its deck row.

## Where a value lives

- **R-DS-1** (eval: deck case only (no eval yet); also held by site:tokens) Put every value that sets the look (a colour, gradient, spacing, font stack, radius, shadow or type size) in `astro/src/styles/tokens/` first, then use it through `var(--token)`. Tokens are the one source; the published tokens at `/tokens/` are read from the CSS, never the other way. *Why:* One source means a change happens once and every page, component and figure follows it. Reject when: a hex code, raw gradient or magic pixel value written into a component
- **R-COL-3** (eval: deck case only (no eval yet); also held by site:tokens) Define the palette once: every colour that changes with the theme is one `light-dark(day, night)` token in `tokens/paper.css`; the night blocks hold only non-colours. *Why:* Three copies of the palette drifted; one switch is the "easy switch control" I asked for. Reject when: A colour value written twice.
- **R-COL-4** (eval: deck case only (no eval yet); also held by site:tokens) Write no literal colour or pixel value in component CSS; add a token first. The ratchet only goes down. *Why:* A literal is a palette switch that misses one place. Reject when: A new hex, rgb() or ≥ 10px literal in reached code.

## Colour that can be read

- **R-DS-2** (eval: the site's standards:selftest, a planted failing pair; also held by standards:check) Give every new text or signal colour its pair in `src/data/contrast-pairs.ts`, and pass `npm run standards:check` in both themes. *Why:* A colour that can't be read in one theme fails readers there, and only a registered pair gets measured. Reject when: a new text or signal colour with no contrast pair
- **R-COL-5** (eval: deck case only (no eval yet); also held by site:pages) Keep small text readable: body text at least 4.5:1 against the ground it sits on, large text (24px, or 18.7px bold) at least 3:1, in both themes. Small orange text uses the text orange (`--pp-signal-text`), not the fill orange. *Why:* The fill orange on cream is 3.1:1: fine for a heading or a fill, unreadable as a 12px label. Reject when: Any flagged element; a logotype is the only exemption.
- **R-COL-2** (eval: deck case only (no eval yet)) Use the exact signal orange (`--pp-signal`: #f04a0e by day, #ff5a1f by night) for every orange fill, rule, logo letter and large heading; never a muted, tinted or approximate orange. *Why:* A second orange reads as a mistake, and he notices it at a glance. Reject when: An orange that is not one of the two signal values, in either theme.

## Figures

- **R-DS-4** (eval: the site's figures:selftest, a planted fault per check; also held by figures:check palette) Give figures a new colour only through a night mirror in `palette.ts`, read through `figures/kit/ink.ts`. *Why:* Figures are drawn in the night palette and recoloured to paper by a filter fitted from the tokens, so a colour the palette doesn't know can't be mapped. Reject when: a colour in a figure that is not in the night palette
- **R-COL-9** (eval: deck case only (no eval yet)) Recolour drawings to the page with the matrix fitted from the tokens at build (`styles/theme/figure-filters.ts`); never copy filter numbers by hand. *Why:* A hand-copied matrix gave olive greys and a muted orange, and would not follow a palette change. Reject when: A literal `feColorMatrix` value in a layout.

## Where it shows

- **R-DS-3** (eval: deck case only (no eval yet); also held by blueprint:index:check (components only)) Show every new token in its section of `src/pages/design-system.astro`, and every new shared component in section 06 with a caption. *Why:* The design-system page is the live ledger: a token or component not shown there is treated as not shared. Reject when: a token or shared component that appears nowhere on the design-system page
- **R-DS-5** (eval: deck case only (no eval yet)) Never edit the vault's Design system note by hand: regenerate it from the site with `npm run site:design-export -- <vault path>` after a token change. *Why:* The note is how agents outside the site read the values, and a hand edit makes it disagree with the site. Reject when: a hand edit in the Design system note, or a token change with no fresh export
