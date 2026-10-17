---
name: figure
description: Use whenever a drawing is needed on juansync.dev — a post cover, a hero, a slide's figure, an illustration inside a post, any animated canvas or 3D piece, or a new seeded template for the /lab catalogue — or when one is changed. Draws one figure (or one template: a grammar that draws a different figure from every seed) in the site's minimal style, with one teal signal, in one of nine techniques (wireframe, low-poly, pixel, perspective, hairline, ink, field, trace or three.js) as one file in astro/src/figures, and loops on the audit until it passes and its sheet has been looked at.
argument-hint: "[what the figure is for]"
---

# Figure

You are making one figure for juansync.dev: a small drawing that shows its subject as a
thing, in one stroke family and one signal colour, that moves only when the motion means
something. It lives in one file, `astro/src/figures/<id>.ts`, and it is done when
`npm run figure -- <id>` exits 0 **and** you have read its sheet.

You write one thing: the figure file. The kit (`src/figures/kit/`), the clock
(`src/hooks/useFigureLoop.ts`), the bench and the audit (`astro/scripts/figures/`) are fixed.
If one of them seems to be in your way, the figure is wrong; change the figure. If the kit
truly lacks something three figures would need, say so and stop: that is a separate change.

## The one idea

**The figure is the subject, drawn as the thing itself.** Not boxes and arrows, not a
label on a shape. Attention is a range of ridges that light one at a time; a chip is a
package whose layers lift apart; a terminal is a grid of cells with a cursor. If the idea
needs words to be understood, it is a diagram, and a diagram is a DOM layout with real
text (like the system map on the home page), not a figure.

## Workflow

Work in this order. Stop where it says stop.

1. **Size it.** *Mark* (a post cover, under ~80 lines), *Figure* (a hero, a slide, 80–200
   lines), or *Scene* (three.js; needs a 2D fallback; at most one per page). Over 200 lines
   is two ideas: cut one.
2. **Read the neighbours.** `npm run figures:check -- --list` prints every figure by group
   and style. Your figure's group (`cover`, `feature`, `hero`, `post`) must not repeat the
   style of a date neighbour, and no style may cover more than a third of a group. Pick from
   the styles the group is short of. `references/styles.md` has the catalogue.
3. **Truth.** Collect the real behaviour of the subject: what moves, in what order, how far.
   The motion must be true to it (a systolic array's wave runs along the diagonal; decode is
   one token at a time).
4. **Concept.** Offer two or three, one line each, and wait if someone can answer:
   > **Name.** The object · what moves and what that means · what the pointer does · the read-out.

   With nobody to ask, take the one with the strongest rest frame and say so.
5. **Build.** Open the nearest existing figure in the same style and write yours in its
   shape: `defineCanvasFigure({ id, title, alt, idea, style, motion, answers, group, seed,
   aspect, setup, draw })` (or `defineThreeFigure` with a `fallback`). Read
   `references/rules.md` first: the rules are not advice. `references/kit.md` lists every kit
   call.
6. **Loop.** Keep a dev server running (`npm run dev`) and run
   `npm run figure -- <id> --url=http://127.0.0.1:4321`. It runs the source check, then the
   look, and writes `figures-out/<id>.png`. **Read the sheet** (Read tool, every time) and
   answer the questions in `references/look.md`. Fix, run again. Cap: six passes. If it is
   still failing after six, stop and report what is left, with the sheet.
7. **Wire it.** A cover goes in the post's frontmatter as `cover: <id>`. Inside a post (MDX):
   `<PostFigure id="<id>" caption="…" aspect={2} />` from `src/components/writing/`.
   Anywhere else: `<FigureCanvas id="<id>" />` inside a box that sets the size
   (`aspect-ratio` or a height), hydrated `client:visible`.
8. **Hand over.** Say in one line each: the object and what moves; the style and why it suits
   this subject; what the pointer does and what the read-out says; the look answers you were
   unsure of. Attach the sheet.

## Templates: one grammar, many figures

A **template** (`astro/src/figures/templates/<id>.ts`, `defineTemplate`) draws a different
figure from every seed. Write one when the idea is a *kind* of picture (a wireframe object,
an exploded machine, a workflow) rather than one subject. Three things make an instance:

- the **seed**, which `grammar(rng)` turns into discrete choices (which object, which view,
  how many parts) — every choice is made there, once;
- seeded **noise**, for smooth variation in space and over time, made in `setup`;
- the **grammar** itself: which choices go together, so every seed is a deliberate picture.

`name(params)` gives the variant in one to three words and `alt(params)` the instance's alt
text; there is no `group` or `seed` (the instance id carries the seed). An instance is
`<template>~<seed>` and works anywhere a figure id does: a cover (`cover: workflow~11`),
`<FigureCanvas id="anatomy~4" />`. Every template is listed at `/lab/` and walkable by seed
at `/lab/<id>/?seed=N`, read from the registry: no list to edit.

The loop for a template: `npm run figure:seeds -- <id> 12 --url=…` writes
`figures-out/<id>.seeds.png`, twelve seeds at rest with their alt text — read it to judge
the grammar's range, then `node scripts/figures/look.mjs --url=… <id>`, which looks at
seeds 7, 42 and 2026 (`templateSeeds`) as full figures and fails if two of them differ by
less than `seedMin` of their ink. Helpers more than one template needs go in the kit
(`kit/shapes.ts` for wire shapes and polylines, `kit/assemblies.ts` for machines as parts).

Done means: `npm run figures:audit` exits 0 for the whole site, and you looked. "The check
passed" without reading the sheet is not done. Never describe a figure you did not look at.

## What goes wrong

| If you catch yourself | Do this instead |
| --- | --- |
| writing a hex code, `rgb()` or `0x…` | take it from `ink`, `tone`, `mix` or `hexOf`; add a token first if the palette truly lacks it |
| reaching for a glow, shadow, gradient or thicker line | move one stroke to the signal, or raise its opacity |
| writing text on the canvas (`fillText`) | return the name from `draw` as the read-out |
| using `Math.random()` in `draw` | sample `noise` at `(x, t)`, or draw from the seeded `rng` once in `setup` |
| adding a timer, listener or `requestAnimationFrame` | read `t`, `dt`, `pointer`, `hover`, `pulses` from the frame |
| making the motion "just look alive" | make it say the idea, or make the figure `still` |
| picking the style you used last time | read `--list`; take a style this group lacks |
| drawing boxes and arrows | find the object whose working is the idea; or build a DOM diagram with real text |
| lighting several things in the signal | one place is bright; everything else is a grey |
| filling the frame edge to edge with ink | leave ground: coverage over 40% warns, over 50% fails |
| tuning a threshold in `thresholds.json` to pass | the figure is wrong; change the figure |
| saying it looks right without reading the sheet | run the loop and read `figures-out/<id>.png` |

## Files

- `references/rules.md`: the thirteen rules, each with how to keep it and what gets a figure rejected.
- `references/styles.md`: the nine styles, when each suits a subject, and the recipe in kit calls.
- `references/look.md`: what the sheet shows and the questions only eyes can answer.
- `references/kit.md`: every kit call, the frame you are given, and the clock's guarantees.
- `astro/scripts/figures/`: the audit. `check.mjs` (source), `look.mjs` (pictures and
  numbers), `figure.mjs` (the loop), `thresholds.json`. `npm run figures:selftest` proves each
  check that has a fixture still catches it (every drawing check: colour, randomness, clock,
  DOM, words, glow, width, parse; and every look check except `reduced`, which guards the
  clock, not the figure). `fixtures/structural-sins.ts` proves imports, length and meta;
  `fixtures/templates/same-every-seed.ts` proves the look's `seed` check; parse, variety,
  covers and template instances are proven inline. Run it after any change to the audit.
