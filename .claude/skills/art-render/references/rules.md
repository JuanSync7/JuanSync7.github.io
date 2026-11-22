# Rules: art_render

Generated from the decks by `_scripts/playbook_pack.py render`; never edit it. To change a
rule, change its deck row.

## Live or baked

- **R-FIG-33** (home: figure; here: the baked half of the figure system is what this playbook registers) A figure is drawn live or baked, and both are one system. A baked figure is drawn ahead of time by a playbook's kernel for a look too heavy to draw live; its kernel takes every colour from the site's tokens and holds no colour literal, it is registered by the manifest the kernel writes (sources per theme and scale, the tokens and their digest, and its anchors from the constants it is drawn with), a page shows it only by id (`<FigurePlate>`), and the same audit checks it and fails it as stale when a token it names has changed. Live parts laid on it, DOM or a live figure, are placed by its anchors. *Why:* A second art system drifts: its own palette, its own checks and image paths in pages. Made beforehand is not the problem; following other rules is. Reject when: a baked image a page loads by path, a kernel with a colour of its own, or a plate whose manifest the kernel did not write

## Near and far

- **R-BAKE-7** (eval: deck case only (no eval yet)) Bake every heavy effect once into a pyramid (4x, 2x, 1x WebP) within budgets, load it by resolution, and keep the vector for print. The 1x is a Lanczos downsample, so hatching averages to tone from far away. *Why:* Live filters took 22 to 39 seconds to paint at 4x; a pyramid keeps both the detail near and the speed far. Reject when: an effect left live on the page, a level over budget, or a 1x that is point-sampled

## Live parts on a plate

- **R-BAKE-8** (eval: deck case only (no eval yet)) Never bake words: plaques, labels, captions and every interactive part are page text above the plate, placed by its anchors. *Why:* Baked text is blurry when zoomed, cannot be read by a screen reader and cannot change without a re-bake. Reject when: a `<text>` element in a plate, or a label drawn as paths
- **R-BAKE-9** (eval: deck case only (no eval yet)) Move parts over a plate only with transform and opacity: nest one element per axis to make an arc, and read every duration from the stylesheet's tokens. *Why:* Animating position repaints the page; one element per axis gives each its own easing; times read from the tokens cannot drift from the CSS. Reject when: a transition on left, top, width or height, or a timeline with its own millisecond numbers
- **R-BAKE-10** (eval: deck case only (no eval yet)) Mount a live figure only once its box is at full size: after the transform that grows it has ended. *Why:* A canvas figure sizes itself from its box on screen, transforms included, and stays blurry if mounted while small. Reject when: a figure mounted inside a scaled or turning parent
