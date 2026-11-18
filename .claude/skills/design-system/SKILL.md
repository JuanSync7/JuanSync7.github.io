---
name: design-system
description: Use when a design token on juansync.dev is added, changed or removed (a colour, gradient, spacing step, font stack, radius, shadow or type size), or when a page or component needs a value the tokens do not have yet.
argument-hint: "[the token or value to add or change]"
status: "[adopted] the steps and R-DS-1 to 5 are the site's project rules, carried into the vault on 2026-11-18. R-COL-2 to 5 and R-COL-9 come from the Colour and contrast deck, some of them trials."
---


# Design system

You are changing the design system of juansync.dev: the tokens every page, component and figure takes its look
from. The values stay in the site, in `astro/src/styles/tokens/`. This playbook is how a value gets there, gets
checked and gets shown, so one change reaches every page and the vault's copy stays true.

You write the token and the places that must name it (the steps below list them). You do not edit the checks
(`astro/scripts/site/`) or the vault's Design system note by hand. If a check seems to be in your way, the token is
wrong: change the token.

## The one idea

**A value lives in one place and everything else reads it.** A colour in a component, a number copied into a
figure filter, a hex code typed into the vault note: each is a second source, and a second source drifts.

## Workflow

Work in this order. Stop where it says stop.

1. **Look first.** `references/tokens.md` says which file holds which kind of token. Search it for a token that already
   does the job (`grep -rn -- '--pp-' astro/src/styles/tokens`). Reuse beats a near-copy: two tokens one shade
   apart are a mistake waiting to be made.
2. **Write the token.** Put it in its file. A colour that changes with the theme is one
   `light-dark(day, night)` value in `tokens/paper.css`; never a second value in a night block. Name it by its role
   (`--pp-ink-muted`), not its look (`--pp-grey-2`).
3. **Use it.** Replace the literal in the component with `var(--token)`. `npm run site:tokens` fails a literal in
   components, layouts and blueprint sources, and its counts elsewhere may only go down.
4. **Pair it, if it is read.** A new text or signal colour gets its pair in `src/data/contrast-pairs.ts` (`text`,
   `large` or `decorative`, with a note for the last two). Run `npm run standards:check`: it measures every pair
   in both themes.
5. **Mirror it, if a figure needs it.** Figures are drawn in the night palette and recoloured to paper by a filter
   fitted from the tokens at build. A colour a figure must use is added to the `night` mirror in
   `styles/tokens/palette.ts` and read through `figures/kit/ink.ts`. Run `npm run figures:check`.
6. **Show it.** Add the token to its section of `src/pages/design-system.astro` (a new shared component goes in
   section 06 with a caption). The page is the ledger: a token not shown there is treated as not shared.
7. **Look at it.** Build and open `/design-system/` and one page that uses the token, in both themes. Read
   `references/look.md` and answer its questions. `npm run site:pages` (against a served build) measures contrast and colour
   share on every page.
8. **Run the gate.** `npm run check` must pass.
9. **Export.** Regenerate the vault's note: `npm run site:design-export -- <vault>/Notes/Me/Knowledge/Design\ system.md`.
   Never edit that note by hand.
10. **Hand over.** Say in one line each: the token, its two values, where it is used, its contrast ratio in each
    theme if it is read, and anything `references/look.md` left you unsure of.

## Where this playbook lives

This folder in the experience vault is its one source. The site keeps a synced copy in
`.claude/skills/design-system/` (`npm run design-system:sync -- <vault>`, `--check` compares). Change it here, then
sync. The rules are in `references/rules.md`, rendered from the decks [[Notes/Decks/Design system]] and
[[Notes/Decks/Colour and contrast]]. The checks are listed in `references/checks.md`.
