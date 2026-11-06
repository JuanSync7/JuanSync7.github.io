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

Requires Node 22 (matches CI; the data checks use native TypeScript loading).

## Vault system overview

`/vault/` explains the private experience vault without publishing or connecting its records.
It includes purpose and architecture, three downloadable diagrams, a synthetic local search
example, metadata, rules, checks and development status. The [maintainer guide](docs/design/vault-overview.md)
owns its public boundary, content and diagram workflow, checks and verification limits.

## Deployment

GitHub Actions (`.github/workflows/astro.yml`) builds `astro/` on every push to `main` and publishes `astro/dist` to GitHub Pages. No manual deploy step.

## CV and Experience

The CV and the home page's role line, title and Experience section come from a private career
repository, which pushes two generated files here whenever the CV changes:

- `astro/public/Kok_Shew_Juan_CV_2026.pdf`, the public CV (email only, no phone);
- `astro/src/data/profile.json`, read through `astro/src/data/profile.ts`, which checks its shape
  at build time so a malformed file fails the deploy.

Don't edit either here: the next publish overwrites them. Change the wording in the career repo.

## Contributing rules

See `CLAUDE.md` for the enforced rules. The headlines:

- **TypeScript:** strict mode; no `any`, no `@ts-ignore`/`@ts-expect-error`/`@ts-nocheck`, no widening to silence the checker. Use `unknown` + narrowing at boundaries.
- **Components:** one per file, ≤200 lines, co-located by section under `src/components/<section>/`. Shared primitives go in `ui/` and **must** be added to `design-system.astro`.
- **Styles:** plain CSS + design tokens only — no Tailwind, no hardcoded hex/rgb/gradient/spacing literals. New tokens go in `astro/src/styles/tokens/` first, then get referenced via `var(--…)`.
- **React:** no globals, every effect cleans up its listeners/intervals/tweens, memoize only with a measured reason.
- **Branching:** feature work off `develop`, merge to `main` only when shippable; conventional-commit prefixes.

## Lesson log

The vault's `Site/Lessons/<date>-<slug>.md` files own the public lesson text. Read its
`Notes/Protocols/Lessons learned.md` before drafting. Each note contains one fenced
`json lesson-public` block; only that block is copied to this repo. Evidence, source
paths and review notes stay in the vault.

From `astro/`, with both repositories checked out:

```bash
npm run lessons:sync -- --vault /path/to/experience-vault
npm run lessons:sync -- --vault /path/to/experience-vault --write
npm run lessons:sync -- --vault /path/to/experience-vault
npm run check
npm run build
```

The first command checks lesson and taxonomy drift without writing. The vault’s
`Site/lesson-taxonomy.json` owns the vocabulary, copied to
`astro/src/config/lesson-taxonomy.json` by the same sync. `--write` stages the named payloads
as JSON-formatted YAML (valid YAML), preserving older lesson files. It does not commit,
push or approve publication. Review both diffs and the vault's publication requirements
before merging. A missing or empty source, malformed block, unknown field or date/id
mismatch fails. Each lesson must have one registered category and one to five distinct
registered tags. Vocabulary additions follow the vault’s `Notes/Protocols/Lesson categories and tags.md`. Deletions are deliberate: removing a vault note does not delete a public
lesson. Keep a tombstone note or remove the public file in a reviewed change.

The existing date, tag, title and why fields still feed the writing page cards. Optional
problem, cause, steps, solution, verification and limitations fields expand in the lesson
log under “How it works”; plain text is escaped by Astro. `npm run lessons:selftest`
checks failed inputs, drift, repeat writes and legacy preservation and runs in the main
check gate. Cross-repository drift needs the private vault checkout and is run locally.

The full lessons page opens in category groups, with an alternative month view. Category
and multiple tag filters work together: every selected tag must match. Tags are grouped
into topics, tools and languages, and practices. The selection is kept in the URL and
restored by browser navigation. Without JavaScript all lessons remain readable by category.
`npm run lessons:check` validates every public file against the registry during `npm run check`.

Repository documentation starts at [docs/README.md](docs/README.md); user-visible change
history lives in [docs/internals/CHANGELOG.md](docs/internals/CHANGELOG.md).

## License

See `LICENSE`.


## Hardware atlas

`/lab/icon-kit/` has twelve assemblies in isometric and wireframe, with camera presets,
part selection, exploded views, engineering detail, isolated-part inspection and SVG downloads. `/lab/hardware-atlas/` is the seeded
figure template; `HardwareIcon` is demonstrated in `/design-system/`.

From `astro/`:

```bash
npm run hardware:check   # geometry, frame bounds, seeded choices and SVG/canvas consistency
npm run hardware:export  # 24 SVGs, a symbol sprite and numbered sheets in hardware-out/
npm run build
npm run hardware:browser # interaction/export checks; requires the existing Playwright Chromium setup
```

See the [reference card and implementation notes](docs/design/hardware-atlas.md).

## Slide icons

`/lab/slide-icons/` has 24 simpler marks for presentations. Dark/light ink and
teal-accent/monochrome treatments provide 96 transparent SVG variants, four sprites
and overview sheets. `SlideIcon` appears in the design-system ledger.

From `astro/`, `npm run slides:export` regenerates the downloads; the build runs
this automatically. `npm run slides:check` checks vectors and ZIP integrity, and
`npm run slides:browser` checks the collection and exports in the existing browser
harness. See [implementation notes](docs/design/slide-icons.md).
