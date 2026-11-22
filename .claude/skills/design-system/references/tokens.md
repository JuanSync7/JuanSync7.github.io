# The token files

Where each kind of value lives on juansync.dev. Read this index, then open only the file you need. All paths are
under `astro/src/`.

| File | Holds | Prefix |
|---|---|---|
| `styles/tokens/paper.css` | the paper system every public page uses: ground, inks, hairlines, the two oranges, terminal colours, sticker colours. Each colour is one `light-dark(day, night)` value | `--pp-*` |
| `styles/tokens/colors.css` | the night system's colours (the figure bench and the older pages), which `paper.css` maps onto | `--nt-*` and older |
| `styles/tokens/typography.css` | the self-hosted fonts, font stacks, sizes and weights | |
| `styles/tokens/spacing.css` | the 4px spacing scale, radii and shadows | `--hf-space-*` |
| `styles/tokens/gradients.css` | named gradients | |
| `styles/tokens/motion.css` | page-level durations and easing (figures keep their own clock). Every animation time a page or component sets is one of these: `site:tokens` fails a time literal (`1.4s`, `250ms`) in a component as it fails a colour | `--nt-dur-*`, `--nt-ease-*` |
| `styles/tokens/buttons.css` | paper actions: face, ink, printed edge, step | `--pa-*` |
| `styles/tokens/presentation.css` | reading roles and measures for guides and slides | `--pr-*` |
| `styles/tokens/blueprint.css` | the drafting look of the component blueprints | `--bp-*` |
| `styles/tokens/index.css` | the entry point; the import order matters | |
| `styles/tokens/palette.ts` | the colour values JavaScript needs, and the `night` mirror figures draw with | |
| `data/contrast-pairs.ts` | every colour pair that must be read, with its need (`text`, `large`, `decorative`) | |
| `lib/design-tokens.ts` | publishes the tokens at `/tokens/` (W3C Design Tokens), read from the CSS | |
| `styles/theme/figure-filters.ts` | fits the matrix that recolours night figures to the paper page, at build | |
| `pages/design-system.astro` | the ledger: every token and shared component, shown live | |

A new kind of value that fits none of these files is a separate change: say so and stop.
