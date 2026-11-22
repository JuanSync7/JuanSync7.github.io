# Rules: pen_and_wash

Generated from the decks by `_scripts/playbook_pack.py render`; never edit it. To change a
rule, change its deck row.

## Live or baked

- **R-FIG-33** (home: figure; here: its kernel takes every colour from the tokens) A figure is drawn live or baked, and both are one system. A baked figure is drawn ahead of time by a playbook's kernel for a look too heavy to draw live; its kernel takes every colour from the site's tokens and holds no colour literal, it is registered by the manifest the kernel writes (sources per theme and scale, the tokens and their digest, and its anchors from the constants it is drawn with), a page shows it only by id (`<FigurePlate>`), and the same audit checks it and fails it as stale when a token it names has changed. Live parts laid on it, DOM or a live figure, are placed by its anchors. *Why:* A second art system drifts: its own palette, its own checks and image paths in pages. Made beforehand is not the problem; following other rules is. Reject when: a baked image a page loads by path, a kernel with a colour of its own, or a plate whose manifest the kernel did not write

## Line and shade

- **R-BAKE-1** (eval: deck case only (no eval yet)) Draw the room in monoline pen and wash: crisp ink outlines in three weight tiers (hairline, line, accent), and every shade as a soft wash with clean hatching drawn over it, never hatching alone. *Why:* Hatching alone looks awkward up close; the wash under it gives the tone and the hatching gives the drawn texture. Reject when: a stroke outside the tiers, or a hatched area with no wash under it
- **R-BAKE-2** (eval: deck case only (no eval yet)) Keep hatching inside its own shadow and behind the objects in front of it: mask each hatched shape by its shape, and draw a cast shadow before the shape that casts it. *Why:* Lines that leave their shadow or cross in front of an object read as scribbles over the drawing. Reject when: a hatch line that runs past its shadow's edge, or a shadow drawn over the shape that casts it
- **R-BAKE-11** (eval: deck case only (no eval yet)) Light every drawing from the upper left: lit faces up and left, shadow faces and cast shadows down and right, the same in every object of a scene. *Why:* One light makes the separate objects one room; a stray light direction reads as a pasted-in part. Reject when: an object whose shadow falls up or left

## Colour

- **R-BAKE-12** (eval: deck case only (no eval yet)) Spend the signal colour only on what glows or marks: a flame, the J of the logo, a lamp's rim, the newest label. Everything else is ink and wash. *Why:* One saturated mark per area keeps the 60/30/10 split and keeps the eye where it is meant to go. Reject when: the signal on a surface, a frame or a shadow
- **R-BAKE-13** (eval: deck case only (no eval yet)) In the dark theme draw the same pen-and-wash drawing as chalk on a dark board: the light ink lines roughened by the `chalk` filter (`wrap(..., chalk=True)`), the wash kept soft under them, no glow. The light theme stays clean ink on cream. *Why:* The chalk texture is what makes the dark theme its own drawing rather than an inverted copy of the light one. Reject when: a dark drawing with smooth vector lines, or chalk lines with a glow

## The view

- **R-BAKE-3** (eval: deck case only (no eval yet)) Keep the centre the focus: on a carousel of tiled units, a side unit shows less than half of itself, and tiles join with no seam. *Why:* The eye goes to the whole thing it can see; half a shelf at each side reads as the wall going on, not as another choice. Reject when: a side unit shown by half or more at the page's widest view, or a visible seam between tiles
- **R-BAKE-4** (eval: deck case only (no eval yet)) Draw both themes as the same room: no glow in either, and the dark plate structurally the same drawing as the light one. *Why:* A glow reads as a different style laid on top, and two different rooms are two drawings to keep. Reject when: a halo or glow layer, or a dark plate with parts the light one lacks
