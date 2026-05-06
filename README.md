# JuanSync7.github.io

Personal portfolio site for **Kok Shew Juan** — ASIC / EDA / AI engineer. Live at <https://juansync7.github.io>.

The site is an Astro + React + TypeScript single-page experience styled around a hardware/EDA aesthetic: a CRT terminal, an animated FSM of a daily routine, a multi-page "cockpit" instrument panel, a project shelf, and a lo-fi pixel-art room. The repo also carries a small Python tool that renders a print-ready CV from a structured YAML.

## Repo layout

```
.
├── astro/                       # The actual site (Astro 4 + React 18 + TS, static output)
│   ├── astro.config.mjs
│   ├── src/
│   │   ├── pages/               # index.astro, design-system.astro
│   │   ├── layouts/Layout.astro
│   │   ├── components/
│   │   │   ├── hero/            # Hero, PacmanText, RoutineSequencer
│   │   │   ├── terminal/        # CRT terminal with auto-typing
│   │   │   ├── fsm/             # Finite-state-machine routine diagram
│   │   │   ├── cockpit/         # Multi-page instrument panel (Overview/ASIC/EDA/AI/Scripting)
│   │   │   ├── projects/        # Project cards + modal
│   │   │   ├── lofi/            # Pixel-art room/city scene
│   │   │   ├── effects/         # GlobalStarfield
│   │   │   ├── layout/          # Nav, Footer
│   │   │   └── ui/              # Shared primitives (NeonText, NotGateDivider, transitions, …)
│   │   ├── styles/
│   │   │   └── tokens/          # CSS variable source-of-truth (colors, gradients, spacing, typography)
│   │   ├── data/site.ts
│   │   └── hooks/
│   └── public/
├── .github/workflows/astro.yml  # GitHub Pages deploy on push to main
├── KokShewJuan_CV_Data.yaml     # Structured CV source
├── generate_cv_from_yaml.py     # Renders Markdown CV from the YAML (filters by `selected: true`)
├── Kok_Shew_Juan_CV_2025.pdf    # Current CV artifact
├── CLAUDE.md                    # Project rules enforced on contributions
└── README.md
```

The repo previously hosted a "zero-build" `index.html` + browser-Babel prototype and a stray Next.js scaffold under `src/`. Both are gone or being deleted; **`astro/` is the only stack to touch**.

## Sections on the page

Rendered in order from `astro/src/pages/index.astro`:

1. **Nav** — sticky top navigation.
2. **Hero** — name, tagline, animated routine sequencer, Pac-Man text effect.
3. **Terminal** — CRT-styled terminal that auto-types an introduction.
4. **FSM** — animated finite-state-machine visualizing the daily engineering loop.
5. **Cockpit** — instrument-panel UI with sub-pages for Overview, ASIC, EDA, AI, and Scripting; includes scope canvas, knobs, meters, heatmap, and syslog ticker.
6. **Projects** — cards backed by `projects-data.ts`, expandable modal.
7. **PurpleSkyTransition** → **LofiRoom** → **LofiFooterFade** — transition into a pixel-art lo-fi scene.
8. **Footer**.

A separate `/design-system` page renders every shared `ui/` primitive and every design token as a live ledger.

## Local development

Everything runs from the `astro/` directory.

```bash
cd astro
npm install
npm run dev          # http://localhost:4321
npm run build        # static output to astro/dist
npm run preview      # serve the built site
npm run check        # astro check + eslint
npm run lint
```

Requires Node 20 (matches CI).

## Deployment

GitHub Actions (`.github/workflows/astro.yml`) builds `astro/` on every push to `main` and publishes `astro/dist` to GitHub Pages. No manual deploy step.

## CV generator

```bash
python generate_cv_from_yaml.py KokShewJuan_CV_Data.yaml > cv.md
```

`generate_cv_from_yaml.py` reads `KokShewJuan_CV_Data.yaml` and emits a Markdown CV containing only entries marked `selected: true`. This lets the YAML hold a long master record while each render produces a focused CV for a specific role.

## Contributing rules

See `CLAUDE.md` for the enforced rules. The headlines:

- **TypeScript:** strict mode; no `any`, no `@ts-ignore`/`@ts-expect-error`/`@ts-nocheck`, no widening to silence the checker. Use `unknown` + narrowing at boundaries.
- **Components:** one per file, ≤200 lines, co-located by section under `src/components/<section>/`. Shared primitives go in `ui/` and **must** be added to `design-system.astro`.
- **Styles:** plain CSS + design tokens only — no Tailwind, no hardcoded hex/rgb/gradient/spacing literals. New tokens go in `astro/src/styles/tokens/` first, then get referenced via `var(--…)`.
- **React:** no globals, every effect cleans up its listeners/intervals/tweens, memoize only with a measured reason.
- **Branching:** feature work off `develop`, merge to `main` only when shippable; conventional-commit prefixes.

## License

See `LICENSE`.
