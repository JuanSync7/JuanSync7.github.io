# Figure: this site's scoped exceptions

The site's own file beside the synced figure playbook, never synced. Read it when the figure is one it names.

## Explicit room-colour exception

For `pixel-still` room work, also read
[`tabletop-room`](../tabletop-room/SKILL.md). The user requested themed full colour
and a monochrome switch on 7 November 2026. Only this scene's colour mode uses the
separate room material/light palette and its dedicated checks. The night palette,
other figures and their global thresholds retain the rules above.

## Requested voxel atmosphere

For `voxel-scene` and `voxcel-island`, the user explicitly requested source glow, fog,
cast shadows, evening/night light and matched visible weather on 9 November 2026.
Use the [web design atmosphere playbook](../web-design-agent/playbooks/voxel-atmosphere.md)
for this scoped treatment. Keep emission attached to actual scene sources, the existing
night palette, and the unchanged generic audit limits. The generic no-glow restraint
continues to govern other figures; this is not a site-wide bloom or palette exception.

## Small hidden-line scenes that repeat on a page

The home page's six experience cards (`experience-icon`) are hidden-line scenes (R-FIG-28), drawn
with the kernel's `Sketch` and `monodraw`, but the figure is a 2D canvas figure with `style: 'three'`.
Six cards each with a WebGL context would sit beside the page's three scenes, so all six share one
hidden renderer, `kit/hiddenshared.ts` (`Small`, `paintSmall`), which copies each picture onto the
card's canvas, marks `data-renderer`, and draws the earlier hairline icons when there is no WebGL.
On software WebGL it drops MSAA and redraws at 4 fps, as heavy scenes do. A new small scene is a
`Small` in its own kit file (`kit/exp*.ts`): floor and frame from `kit/expbase.ts`, `clashes()` at
build (thrown by the renderer), and a visible change between 0.8 s and 2.6 s (R-FIG-30).

## Wires and cables

The rule is R-FIG-32 (`references/rules.md`) and the code is the drawing kernel's `cable.ts`, both
synced from the vault. The site's side: `PX` in `kit/expbase.ts` is the cards' pixels per metre on
a phone, `hiddenshared.ts` throws on `cableIssues()` beside `clashes()`, and
`npm run figures:cable:selftest` (in `npm run check`) is the rule's eval.
