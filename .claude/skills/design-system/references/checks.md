# The design-system checks

The checks are the project's, because they read its CSS, its pages and its build. On juansync.dev they are in
`astro/scripts/site/`:

| Command | What it does | Holds |
|---|---|---|
| `npm run site:tokens` | fails a literal colour, gradient or pixel value in components, layouts and blueprint sources, a colour in a night block, and any count that went up against `tokens-baseline.json` | R-DS-1, R-COL-3, R-COL-4 |
| `npm run standards:check` | measures every pair in `src/data/contrast-pairs.ts` against WCAG 2.2 in both themes | R-DS-2 |
| `npm run standards:selftest` | proves `standards:check` still catches a planted failing pair | R-DS-2 |
| `npm run site:pages` | on a served build: contrast of every visible text element, ground and signal share of the first screen | R-COL-1, R-COL-5, R-COL-6 |
| `npm run figures:check` | the figure audit's palette rule: a figure takes colour only from the night palette | R-DS-4 |
| `npm run blueprint:index:check` | every shared component is named on the design-system page | half of R-DS-3 |
| `npm run design-system:sync -- <vault> --check` | the site's copy of this playbook matches the vault | the playbook itself |
| `npm run tokens:sync -- <frontend-kit> --check` | the site's copy of the token code matches `@juansync7/design-tokens` | the kernel's code |

`standards:check` runs the package's own checks (`checkTokens`) with the site's pairs and export names. The
package's selftest (`npm run check` in `frontend-kit/design-tokens`) proves each check still catches a
breakage, on fixtures of its own.

The agent may not edit them. `tokens-baseline.json` changes only downwards, with the reason in the commit message.

## Planned

- **Stroke contrast in figures.** The 2026-11-18 experiment showed thin figure strokes nearly vanishing on the night
  page. No check measures a figure's stroke against the page ground yet; until one does, `LOOK.md` question 5 is how
  it is caught.
- **Tokens shown on the ledger.** R-DS-3 is checked for components, not for tokens.
