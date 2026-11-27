# Library art

The library archive's two baked figures, `library-wall` and `library-desk`: the wall of binder
shelves and the desk, in both themes, drawn as a pen-and-wash elevation (ruled) with pen-and-ink
pictures (free hand) in its frames; the dark theme is the same drawing in chalk.
They are figures like the live ones (CLAUDE.md, Figures rule 7): every colour comes from the
`--pp-art-*` and paper tokens (`kernel/tokens.py` reads `src/styles/tokens/paper.css`), each is
registered by the manifest `kernel/plate.py` writes into `src/figures/plates/`, pages show them
with `<FigurePlate>`, and `npm run figures:audit` checks them. This folder holds the synced kernel and checks of three playbooks,
whose one source is the experience vault (`Playbooks/pen_and_wash`, `graphite_pencil`, `art_render`;
`npm run library-art:sync -- <vault>`, `--check` compares); their skills are synced into
`.claude/skills/`. `kernel/scenes.py`, `kernel/plate.py`, `build.sh` and `sync.mjs` are the site's own.

| Playbook | Covers | Check |
|---|---|---|
| `.claude/skills/pen-and-wash/` | the room (pen and wash, ruled) and the framed pictures on the desk wall (pen and ink, free hand) | `checks/check_penwash.py` (and `--selftest`) |
| `.claude/skills/graphite-pencil/` | a graphite drawing, framed or a whole plate; none in the library now | `checks/check_graphite.py` |
| `.claude/skills/art-render/` | what the page loads, level of detail, budgets | `checks/check_render.py` |

`npm run library-art` draws both plates, runs every check, writes the 1x and 2x WebP into
`public/library/` and the manifests into `src/figures/plates/`. It needs Python 3.10+, numpy, Pillow and `rsvg-convert`; CI never runs it,
because the plates are committed. The output is deterministic: an unchanged kernel writes the
same bytes.

Where things stand on a plate (the shelf boards, a shelf's standing room, the plaque, the desk
top, the binder spot, each candle flame) is written into the manifest's `anchors` from the same
constants the scene is drawn with (`kernel/scenes.py`, `anchors()`); the archive reads them from
there. When a token a plate names changes, the audit fails it as stale: run `npm run library-art`.
