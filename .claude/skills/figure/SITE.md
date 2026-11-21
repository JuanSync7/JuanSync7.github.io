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

Proposed for the vault's Making figures deck; held here until it is synced as a rule.

Draw a wire or cable in a hidden-line scene as a real run, with `cable()` (`kit/cable.ts`), never
as a free `line`. Both ends land on a part: a plug body at a port, or a tie or gland where it has
none. Between them it rests on the surfaces it would lie on (floor, desk top, shelf, a face) or
hangs straight down from one, never crosses open air on a diagonal, never passes through a solid,
and bends with a radius, not a kink. Leads that run together keep their own lanes and do not cross.
It is one line while it is under 3 px across at the smallest width the scene is shown (`THICK_PX`,
with the scene's pixels per metre), and a tube with its own silhouette from there up.
`cableIssues()` fails the build for an end in the air, a run floating more than 6 cm, or a run
through a solid; `npm run figures:cable:selftest` proves it. A thread that travels with a moving
part names it in `tied`.

Why: a cable is the first thing the eye follows from one object to another, and one that ends in
the air or cuts the corner through space reads as a drawing mistake, not a connection.
Reject when: a cable end with no part under it, a diagonal through air, a run through a solid, or
a thick cable drawn as a single line.
