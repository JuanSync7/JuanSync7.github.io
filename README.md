# JuanSync7.github.io

The source of **Juan Kok's** personal site, live at <https://juansync.dev>. Juan is a senior design and AI engineer: an ASIC designer who now builds the AI platform, agents and governance for a chip-design company.

The site is a static Astro + React + TypeScript build styled as a chip datasheet on paper: a cream notepad by day and a gunmetal one by night, with page-turn transitions between pages. GitHub Pages serves it, with `juansync.dev` as the custom domain.

## Repo layout

```
.
├── astro/                       # The site (Astro + React + TS, static output)
│   ├── astro.config.mjs         # `site` is https://juansync.dev: sitemap, RSS and canonical links use it
│   ├── src/
│   │   ├── pages/               # Every route (see below)
│   │   ├── layouts/             # PaperLayout (every public page), NightPage, PresentationLayout, TrackerLayout, NightLayout (figure bench)
│   │   ├── components/          # One folder per section (home, about, library, vault, trackers, lab, …); shared primitives in ui/, chrome in layout/
│   │   ├── figures/             # Every drawing, cover and animated scene, plus its kit
│   │   ├── blueprints/          # Component and page blueprints
│   │   ├── content/             # Blog posts, learn articles, lessons, releases
│   │   ├── data/                # Site data (home.ts, profile.json, playbooks.json, trackers, …)
│   │   └── styles/              # Global CSS and design tokens (styles/tokens/)
│   ├── scripts/                 # The checks, syncs and exporters behind `npm run …`
│   └── public/
├── .github/workflows/           # astro.yml deploys to Pages; checks.yml and the others run the browser and figure checks
├── docs/                        # Design and internals notes
├── CLAUDE.md                    # Project rules enforced on contributions
└── README.md
```

`astro/` is the only stack. The earlier browser-Babel prototype and the Next.js scaffold have been removed.

## Pages

- **Home** (`/`): hero, the system map (0x00), the vault (0x01), the work tiles (0x02), how I think (0x03), hobbies and contact. The tiles and copy are in `astro/src/data/home.ts`.
- **About** (`/about/`), **Blog** (`/blog/`) and **Library** (`/library/`, every post and article at `/library/<slug>`), with an RSS feed at `/rss.xml`.
- **Playbooks** (`/playbooks/`) and **Formats** (`/formats/`): registers synced from the experience vault.
- **Lab** (`/lab/`): figure templates, blueprints and other experiments.
- **Vault** (`/vault/`): a public explanation of the private experience vault (see below).
- **Trackers** (`/trackers/`), **Anatomy** (`/anatomy/chip-package/`), **Design system** (`/design-system/`) and **Tokens** (`/tokens/`).

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
The short landing page links to five guides: purpose, architecture, knowledge graph, search and
guardrails. These hold three downloadable diagrams, a synthetic local search example, metadata,
rules, checks and development status. The [maintainer guide](docs/design/vault-overview.md) owns its
public boundary and diagram workflow. The [presentation pattern](docs/design/presentation-pages.md)
covers shared typography, paper actions, the interactive hairline cabinet, GSAP scroll motion,
the generated static poster and source/build/browser checks. The design-system ledger demonstrates the reusable components.

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
- **Branching:** feature branches off `main`, merged through a pull request when shippable; conventional-commit prefixes.

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

`/lab/slide-icons/` is an open collection of themed flat/2.5D marks for presentations
and web pages. The playbook searches existing sources, judges fit, then reuses or
creates the missing mark. Subjects and families are open; theme policy and declared
physical relationships bound consistency. Inventories and export counts are generated.

From `astro/`, use `slides:find`, `slides:add`, `slides:import`, `slides:proof`, then
`slides:export` and `slides:check`. The isolated `slides:extension` test verifies
new subjects/families/licenses without engine edits. The [playbook and evaluation
notes](docs/design/slide-icons.md) separate deterministic checks, visual attestations
and independent behavioral trials.
