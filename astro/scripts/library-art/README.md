# Library art

The library archive's plates (`public/library/`): the wall of binder shelves and the desk, in
both themes, drawn as a pen-and-wash elevation with graphite pictures. This folder is the
kernel and the checks of three playbooks, kept with the feature (their `SKILL.md` files are in
`playbooks/` here until they are filed in the experience vault and synced as skills):

| Playbook | Covers | Check |
|---|---|---|
| `playbooks/pen-and-wash/` | the room: shelves, wall bays, desk, panels, crest | `checks/check_penwash.py` |
| `playbooks/graphite-pencil/` | the framed pictures on the desk wall | `checks/check_graphite.py` |
| `playbooks/art-render/` | what the page loads, level of detail, budgets | `checks/check_render.py` |

`npm run library-art` draws both plates, runs every check and writes the 1x and 2x WebP into
`public/library/`. It needs Python 3.10+, numpy, Pillow and `rsvg-convert`; CI never runs it,
because the plates are committed. The output is deterministic: an unchanged kernel writes the
same bytes.

Where things stand on a plate (the shelf rows, the desk top, the spot a binder lands on) is
mirrored in `PLATE` in `src/components/library/archive/geometry.ts`. Change the two together.
