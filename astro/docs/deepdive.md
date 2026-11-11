# Zoom-dive layout workflow

The zoom dive at `/lab/zoom-dive/` is a seeded sequence of nested plan drawings.
The work is organized around geometry that can be followed at close range:
components and terminal routes, rooms and circulation, streets and parcels, and
terrain contours from a shared field.

The maintained entry is
[deepdive-agent](../../.claude/skills/deepdive-agent/SKILL.md). Its
[rules](../../.claude/skills/deepdive-agent/RULES.md),
[visual review](../../.claude/skills/deepdive-agent/LOOK.md) and
[kernel index](../../.claude/skills/deepdive-agent/kernel/INDEX.md) describe the
contracts, human judgement and executable owners separately.

## Run an iteration

From `astro/`:

```sh
npm run deepdive:agent -- status
npm run deepdive:agent -- check
npm run dev -- --host 0.0.0.0
# In another terminal:
npm run deepdive:agent -- review --url=http://127.0.0.1:4321
```

`check` runs negative fixtures followed by the deterministic seed sweep. `review`
also generates the gallery and browser evidence. A zero exit status is mechanical
proof for those cases; open the images and answer the review questions before
claiming a visual improvement. The existing figure audit, type/lint checks and
production build still apply.

The sweep compares actual emitted geometry independently of model metadata. Each
of the thirty level/era families must produce at least six distinct drawings in
the default sample. Shared architectural choices vary between scenes; nominally
repeated parts within one scene retain their pitch, dimensions and recipe. This
detects frozen generators, while visual review judges whether variation is useful.

For focused work, `npm run deepdive:check -- --seeds=64` selects a **count** of
deterministic plan seeds. The gallery takes a **list of isolated plan salts**:
`npm run deepdive:gallery -- --salts=1,7,42,2026 --chain=city`. Use `--chain=silicon`
to isolate the chip chain. It forces each layout family to expose all levels and
eras, rather than replaying a public figure's grammar. Its labels and metadata use
the `plan-salt` namespace. `deepdive:agent review --salts=...` forwards that list
only to the gallery.

The browser check uses **public figure seeds**. Its stratified default set contains
a city dive and every silicon era; `--seeds=1,7,42,2026` supplies an explicit public
seed list. It can start its own local server on port 4398; `--url=URL` selects an
already running server. An explicit server is useful while iterating. Do not treat
a check count, isolated plan salt and public figure seed as interchangeable.

The gallery's default plan salts include `1,4,7,42,2026` so its modern PCB,
package and die rows expose all three physical recipes at each level. Captions
and `layoutCoverage` name those recipes. A custom short salt list is a focused
inspection; it is not automatically complete variant coverage.

`status` reports current source bytes and artifact availability. It does not rerun
checks or infer that existing screenshots are fresh. The source fingerprint covers
the zoom template, figure kit, figure wrappers, night palette, dedicated checks and
workflow guidance. It is conservative: an unrelated kit change may invalidate a
previous run, which is safer than labeling stale evidence current.

To preserve an observation:

```sh
npm run deepdive:agent -- feedback --seed=42 --level=3 \
  --rule=DD-CONNECT --note='A trace ends before the terminal' \
  --evidence=figures-out/deepdive/close-up.png
```

The feedback record stores exact input context, current source fingerprint and
hashes of the cited local files. It remains `reported`; later checked and visually
inspected outcomes are separate evidence. Public seeds and internal plan salts
are different namespaces; use exactly one per feedback record so its replay inputs are unambiguous.

For an isolated gallery case, omit the public seed and provide its real inputs:
`deepdive:agent feedback --salt=42 --chain=silicon --era=bipolar --level=3 ...`.
This records `seedNamespace: plan-salt`; it does not invent a public figure seed.

## References and limits

The domain reference notes live beside this guide:
[chip layouts](deepdive-chip-references.md),
[architectural plans](deepdive-room-references.md), and
[maps and terrain](deepdive-map-references.md).
They record the actual convention emulated and the limits of that adaptation.

These are explanatory drawings, not electrically verified layouts, construction
documents or surveys. A continuous-looking wire is not an electrical simulation;
a reachable room is not building-code sign-off. Keep those distinctions in review
without adding implementation jargon to the public scene.

## Physical chain and journey restart

PCB detail, modern package construction and die floorplan variants follow the
[packaging playbook](../../.claude/skills/deepdive-agent/playbooks/packaging.md).
Their models retain footprint pads, surface traces, exposed contact fields,
underfill envelopes and repeated tile groups. `chip-surface-check.mjs` compares
those relationships with actual emitted geometry; its corruption suite is part
of `deepdive:selftest`. A surface field is a declared exposed patch, not a claim
that opaque upper layers reveal every hidden bump. The chip reference notes map
the chosen conventions to inspected primary images.

The room and cell are the smallest physical views in each chain. Their selected
part retains real furniture or device detail. The scene then dissolves into a
fresh region or rack while continuing the camera motion. The next journey is
not drawn as a literal city inside a room or a rack inside a transistor.

The camera uses a presentation magnification of four. Architectural repeated
furniture, wall and door details keep a one-to-four physical scale across the
building/floor views. Nested approaches join actual parent openings to projected
child entrances through the reserved frame margins. Their two curbs must remain
outside child rooms and meet both jambs; the teal selection outline opens at
those same entrances. Chip contacts remain explicit schematic interfaces between
the independently composed physical views.
