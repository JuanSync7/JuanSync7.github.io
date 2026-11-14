# JuanSync7.github.io — Project Rules

These rules apply to all code in this repo. They are enforced where possible by the toolchain (`tsconfig`, ESLint) and otherwise by review. **Future LLM contributions must follow them.**

## Architecture

- **Active stack:** Astro + React + TypeScript, in `astro/`. Static output, deployed to GitHub Pages at https://juansync7.github.io.
- **Legacy stack:** Root-level `index.html` + `*.jsx` files using browser-side babel-standalone. Kept temporarily during migration. Do **not** add new features to the legacy files. Port to the Astro app instead.
- **Conflicting Next.js app** in `src/`: deprecated. Do not touch except to delete once the Astro port is complete.

## TypeScript rules

1. **No `as any`. No `: any`. No `// @ts-ignore`, `// @ts-expect-error`, or `// @ts-nocheck`** to silence the type checker. If types don't fit, define a real interface or fix the underlying shape. The only acceptable escape hatch is `unknown` followed by a runtime narrowing check.
2. **No type widening to make code compile.** If `Foo | undefined` is showing up, handle the undefined case — don't change the type to `Foo`.
3. **Strict mode stays on.** `tsconfig.json` extends `astro/tsconfigs/strict`. Do not loosen flags without an explicit decision recorded here.
4. **`unknown` is preferred over `any` at boundaries** (parsing JSON, third-party APIs without types). Narrow with type guards before use.
5. Prefer `interface` for object shapes that may be extended; `type` for unions and computed types.

## Component & file structure

1. **One component per file.** The headline component is the default export.
2. **Max 200 lines per `.tsx` file** (excluding imports/types). Hitting this is a signal to split, not a rule to bend.
3. **Co-locate by section.** Each major section gets its own folder under `src/components/<section>/` containing its `.tsx` files, optional `types.ts`, and component-scoped CSS.
4. **Shared primitives** go in `src/components/ui/` (buttons, cards, glow effects, etc.).
5. **Layout chrome** (Nav, Footer) lives in `src/components/layout/`.
6. **Naming:** PascalCase for components, kebab-case for CSS files, camelCase for hooks (`useFoo`).
7. **Every new shared component (anything in `src/components/ui/`) must also be rendered in `src/pages/design-system.astro`** under section 06 with a caption. The design system is the live reusability ledger — if a component isn't there, treat it as not-yet-shared. Same rule for new design tokens (colors, gradients, spacing, radii, shadows, typography sizes): they must appear in the corresponding section of `design-system.astro`.

## Styling rules

Presentation pages use `PresentationLayout.astro`: a short landing page leads to focused guides.
Follow the page-organization and contrast rules in the site-taste skill, and reuse `PaperAction.astro`
for paper/depth actions. Keep title/body/comment roles distinct through the shared tokens; run
`npm run presentation:check`, `npm run presentation:page` after a build and the CI browser check.
The design-system page contains the live component specimens and starting recipe.

1. **Design tokens are mandatory.** Colors, gradients, spacing, font stacks, radii, shadows must come from CSS variables defined in `astro/src/styles/tokens/`. Hardcoded hex/rgb values, raw `linear-gradient(...)` literals, or magic pixel values in component CSS are not allowed.
2. **Tokens are the single source of truth.** If a value isn't in tokens, add it there first, then reference via `var(--token-name)`.
3. **Component-scoped CSS** lives next to the `.tsx` (e.g. `cockpit/cockpit.css`), imported by the component. Site-global CSS (reset, typography, layout primitives) lives in `astro/src/styles/`.
4. **No Tailwind.** Plain CSS + variables is the chosen idiom. Don't introduce utility-class systems.
5. **Tracker layout = version rail + centered main panel, inside the paper page column.** On tracker pages (`/trackers/**`) the version-history timeline is a navigation rail, not part of the main panel. The pages sit on the paper system (`TrackerLayout` → `NightPage` → `PaperLayout`: the paper nav and footer, then a row linking the three trackers and the field guides); under it `.wrap` takes the page column (`max-width: calc(100cqw - 2 * var(--pp-edge))`), clear of the punched strip and margin line. `.tracker-grid` is `188px` rail + `minmax(0,1fr)`; `.tracker-main` centers itself in the remaining space (`max-width: 980px; margin: 0 auto`). Keep this consistent across all three trackers (engines/models/silicon) and their release/hub pages.

## Figures (drawings, covers, animation)

1. **Every drawing is a figure.** Post covers, heroes, slide figures, illustrations in posts, animated canvases and three.js scenes are each one file in `astro/src/figures/`, made with the `figure` skill (`.claude/skills/figure/SKILL.md`). No canvas drawing, inline SVG illustration or three.js scene lives inside a component; components mount figures with `<FigureCanvas id="…" />`. The explicitly requested exportable hardware SVGs use `<HardwareIcon>`: it only presents paths from `figures/kit/hardware/`, sharing geometry with the `hardware-atlas` figure. The explicitly requested slide SVGs use `<SlideIcon>` to present paths from `figures/kit/slides/`; their simpler static marks and light-slide exports are icon assets, not animated explanatory figures. Keep object geometry in the kit and both renderers in the design-system ledger. Static slide icons also follow `.claude/skills/slide-icons/SKILL.md`: progressively load fit → reuse/create → review → ship; subjects/families/counts are open, while theme policy, declared physical constraints and evidence-bound reviews hold quality. Asset authors do not edit the maintained kernel/checker; the ownership guard holds that boundary.
2. **A figure has a length budget.** At most 200 non-blank lines, or 350 for a three.js scene (`check.mjs` rule `length`). Figures are formatted by Prettier at 120 columns (`npm run format:figures`; `npm run check` fails unformatted ones), so the count is honest. Over budget means split: move a reusable part into `src/figures/kit/`.
3. **Diagrams made of words are not figures.** When the content is labels and connections (the system map), build it as DOM with real text and the night tokens. Its drawing rules: every wire runs at least `MIN_WIRE` map units (the length of Slurm → EDA tools); a wire keeps `WIRE_CLEARANCE` from every box it does not join and meets a box at least `CORNER_INSET` from its corners; a label is never cut by a wire, never sits on a box, and sits next to its wire; crossings stay within `MAX_CROSSINGS`, each drawn as a bridge. A box grows to fit its arrows, never the reverse. A diagram in a `/learn` article follows the same rules: it is data in `src/data/diagrams/` (types in `src/data/diagram.ts`, at most `DIAGRAM_MAX_W` wide, with `steps` that replace it below `DIAGRAM_NARROWEST`), mounted in the article's `.mdx` with `<Diagram id="…" />`. `npm run map:check` measures the map and every learn diagram, and is part of `npm run check`.
4. **Done means the audit passed and someone looked.** `npm run figures:audit` exits 0 and the figure's sheet in `astro/figures-out/<id>.png` was read. The tight loop for one figure is `npm run figure -- <id>`.
5. **Never loosen the audit to pass.** `scripts/figures/thresholds.json` changes only with a reason in the commit message, and after any change to the audit `npm run figures:selftest` must pass (each fixture in `src/figures/fixtures/` must still be caught).
6. **Templates are figures drawn from a seed.** A template in `astro/src/figures/templates/` (`defineTemplate`) turns a seed into choices with its grammar; an instance `<template>~<seed>` works anywhere a figure id does, including `cover:`. Every template appears at `/lab/` automatically. A template is done when its seed sheet (`npm run figure:seeds -- <id> 12 --url=<dev server>`; it needs a running dev server) was read and the look passes for its three audit seeds.
7. **Paper and night systems.** Every public page (home, writing, learn, trackers, vault, anatomy, lab indexes, design system) uses `PaperLayout.astro` (through `NightPage`, `NightNav`, `NightFooter`, which keep their night-era names): cream notepad by day, gunmetal notepad by night (same paper tear, punched strip and orange margin line), `--pp-*` tokens remapped onto the `--nt-*` ones on `<html class="paper">`. The figure bench (`/figures`) keeps `NightLayout.astro`, `styles/night.css` and the `--nt-*` tokens. Figures take colour only through `figures/kit/ink.ts`, which reads the `night` mirror in `palette.ts`.

## Writing posts

1. **The rules live in the experience vault, not here.** Before writing or editing a post in `astro/src/content/blog/`, read from the `JuanSync7/experience-vault` repo: `Notes/Me/SOUL.md`, `Notes/Me/Knowledge/Writing voice.md`, then `Blog writing.md` (a post) or `Article writing.md` (a `/learn` explainer), and the deck `Notes/Decks/Writing posts and articles.md` (rules R-POST-*, R-ART-*). The worked examples are in `Notes/Examples/Writing/`. If the vault isn't reachable, say so before writing.
2. **`npm run posts:check` holds the mechanical rules** for posts dated from `rulesFrom` in `scripts/posts/config.json`: a one-sentence hook as the excerpt, no table above the first heading, a real opening before it, 3 to 5 headings, no links to other posts before the ending, length and read time, ending on a paragraph. It runs inside `npm run check`; `npm run posts:selftest` proves each rule still catches a post that breaks it. Change `config.json` only with a reason in the commit message.
3. **Done means the check passed and a fresh reader compared it.** Before merging a new post, a fresh agent reads it against the previous draft (or a plain alternative) blind, with shuffled labels, and says which reads better and why (R-POST-11).

## Writing lessons

Before generating, backfilling or editing a lesson, read the experience vault's
`Notes/Protocols/Lessons learned.md`, its linked templates and writing references.
The canonical curated note lives in the vault's `Site/Lessons/`; this repository
receives only its `json lesson-public` payload through `npm run lessons:sync`.
Keep source trails and review evidence private. Run the drift check with both
checkouts, then the site checks and build. A local copy is not publication approval.

Read `Notes/Protocols/Lesson categories and tags.md` too. Each lesson has one registered
`category` and one to five distinct registered `tags`; the historical singular `tag`
is preserved separately. `Site/lesson-taxonomy.json` in the vault owns the vocabulary;
sync copies it to `astro/src/config/lesson-taxonomy.json`. Reuse existing meanings.
A meaningful new subject requires an explicit registry change and reviewed rationale,
not a free-text category in one file. `npm run lessons:check` checks the whole collection.

## React rules

1. **No globals.** No `window.Foo = Foo`, no implicit reliance on script-tag load order. Use ESM imports.
2. **Effects must clean up.** Every `addEventListener`, `setInterval`, GSAP tween, etc. has a matching teardown in the `useEffect` return.
3. **No `dangerouslySetInnerHTML`** unless content is from MDX or sanitized markdown — never user input.
4. **Memoization is opt-in, not reflexive.** Don't wrap things in `useMemo`/`useCallback` unless there's a measured reason.

## Commits

- Branch off `develop` for migration work; merge to `main` only when a milestone is shippable.
- Conventional-commit-ish prefixes (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`) keep history scannable.

## Doing the work

- **Design pages to Juan's taste.** Before designing or changing a page, section, component or page motion, read the `site-taste` skill (`.claude/skills/site-taste/SKILL.md`): what he has said, what is built, what he rejected, and what is still open. Drawings use the `figure` skill.
- Don't introduce abstractions for hypothetical futures. Three repetitions is the bar for extraction.
- Don't write comments that restate the code. Comments are for *why*, not *what*.
- Don't add backwards-compat shims to legacy `*.jsx` files — they're being replaced wholesale.


## Seeded tabletop-room work

Changes to `pixel-still`, room controls, materials or lighting also use
`.claude/skills/tabletop-room/SKILL.md` and `astro/docs/tabletop-rooms.md`.
The user's 7 November 2026 request explicitly authorizes a full-colour room mode
alongside monochrome. Its material/light tokens live in `roomTones` and the
`--nt-room-*` family, mirrored in the design-system ledger and accessed through
`figures/kit/ink.ts`. Other figures retain the night palette. Keep the generic
monochrome audit strict and verify full colour with the dedicated room checks;
never broaden the global palette or thresholds to accommodate this exception.
Store new rules, verification scripts and playbook updates with the feature.
For lighting and same-theme seeded variation, also use
`.claude/skills/web-design-agent/SKILL.md`; it routes project work through the
existing room and figure kernels and records the requested vault feedback.

## Seeded zoom-dive work

For `zoom-dive` and its chip, map, architectural and transition kernels, read
`.claude/skills/deepdive-agent/SKILL.md` and `astro/docs/deepdive.md` alongside
the figure skill. The 7 November 2026 request explicitly authorizes updating the
kit, creating domain kernels and maintaining their agent/playbooks/checks.
Generate physical structure before drawing: terminals and nets, streets and
parcels, rooms and circulation, one terrain elevation field. Select a complete
part for the next view. Run `npm run deepdive:selftest`, `deepdive:check`,
`deepdive:browser` and `deepdive:gallery`; read the contact sheets. A generated
sheet is evidence to review, not an automatic visual pass. Do not loosen the
generic figure thresholds. Record failures with their public seed or isolated
plan salt and add a regression before calling them fixed.

## Home stickers, LEGO city and desk scene

The 13 November 2026 requests explicitly authorize the hand-drawn die-cut stickers
(`figures/kit/stickers.ts`, `ui/Sticker.astro`, tokens `--pp-sticker-*`), the `lego-city` scene
(kits `legocity.ts`, `legobuildings.ts`, `legoparts.ts`, `lego.ts`) and the realistic `dev-desk`
scene (kits `desk.ts`, `deskprops.ts`, `keyboard.ts`, `gamingpc.ts`, `chair.ts`, `rack.ts`,
`screens.ts`, `studio.ts`). The LEGO city stays in the night palette and is recoloured by the page
filter; it is designed as a voxel model but only its bricks are ever drawn. `dev-desk` is exempt
from the page filter (`figure-canvas.css`) and takes true material colours from `deskTones` in
`palette.ts` (cool neutrals inside the audit's band), its one accent from `--nt-signal` at run time;
it passes the generic audit unchanged. Stickers are static art in a teenage artist's hand (bold
outline, cel shade, gloss, doodles) with classes `o`, `i`, `t`, `h`, `f`, `g`, `a`, `k`; no brand marks.
The LEGO city draws only bricks: its base (layer 0) is there from the first frame, bricks drop onto
it and come off it, and every brick sits on whole studs inside the plate (`legoCity` throws otherwise).
Every part of a scene sits inside what holds it: use `kit/bounds.ts` (`mustSit`, `allSit`,
`allInside`) for lights, strips, ports and inner parts, so a part that pokes out fails the audit.
