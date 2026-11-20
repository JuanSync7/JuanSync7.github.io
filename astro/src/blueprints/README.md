# Blueprints

A blueprint names every part of a shared component, piece of page chrome or page template, how
each part sizes, and the one token behind each size. It is drawn as an engineering sheet from the
thing as it renders, and it is the translator between someone who reads the drawing and the code:
"on the blog post page, part 5's width, narrower" is one row of `INDEX.md`, so one token in one
file. The rules and the kernel's one source are the experience vault's playbook
`Playbooks/blueprint`; this folder holds the synced kernel and the site's own parts.

| File | What it is |
|---|---|
| `types.ts`, `dom.ts`, `measure.ts`, `sizing.ts`, `drawing.ts`, `catalogue.ts`, `overlay.ts` | The kernel, synced from the vault (`npm run blueprint:sync -- <vault>`); never edited here. |
| `harness.ts` | Measures every blueprint on its real page in hidden frames, for `/lab/blueprints/check/` and the scripts. Synced from the vault's `checks/`, with its runner `scripts/blueprints/run.mjs`; never edited here. |
| `<id>.ts` | One spec per blueprint: parts (number, plain name, other names, sizing), sizes (measure, part, token), views, title-block fields. Structure only: never colours, motion or content. |
| `index.ts` | Every spec, in order: components, page chrome, templates. |
| `INDEX.md` | The translator's index, generated (`npm run blueprint:index`); match a request to one row. |
| `sheet.ts` | The A3 sheet, on the site's sheet frame (`figures/kit/drawing/frame.ts`, synced from the vault's drawing kernel) in the ISO 3098 lettering. |
| `view.ts` | The live views (`<BlueprintView>`): a component's specimen enlarged, a template's page in a frame, with the drawing over it and the table filled from what rendered. |
| `catalogue-data.ts` | The index's data for the lab pages, read when the site builds. |

A component is measured where `/design-system/` shows it; a template on a real page at 1280 and
390 px, and again 160 px wider to tell a part that fills from one that is fixed. Every size is
checked against its token and then the token is set 8 px larger in the browser: a size that does
not follow is set by a literal, and fails.

| Command | What it does |
|---|---|
| `npm run blueprint:check` | Every blueprint at every view against its page. Needs the dev server (or `astro preview`). |
| `npm run blueprint:selftest` | Breaks specs and code six ways; each must be caught. |
| `npm run blueprint -- <id\|all> [--store]` | The A3 sheets; `--store` keeps them in `public/blueprints/`. |
| `npm run blueprint:index[:check]` | Writes or checks `INDEX.md`, coverage of the shared components and that no renderer names a component's selector. The check is in `npm run check`. |

To add a blueprint: read the code and its tokens, give any size set by a literal or a sum its own
token, write `<id>.ts` (see `paper-action.ts` for a component, `blog-post.ts` for a template), list
it in `index.ts`, run the check until it matches, store the sheets, run `blueprint:index`, and for
a component add `<BlueprintView>` under its example on `/design-system/` and its specimen in
`components/blueprints/Specimen.astro`. Then read the sheets and the lab page at desktop and phone.
