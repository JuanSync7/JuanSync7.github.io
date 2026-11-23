# Page design

An umbrella: open it for any change to a page, a section, a component, a token, the type or the
layout. It routes to the playbook that owns the work. Links are paths in the site's
`.claude/skills/`, where this agent runs.

## Route

| The work | Open |
|---|---|
| Any page, section, component or page motion: first, always | [site-taste](../../site-taste/SKILL.md): what Juan has said, built, rejected and left open |
| A colour, gradient, spacing step, font stack, radius, shadow or type size | [design-system](../../design-system/SKILL.md) |
| A component's or a page's parts, their sizing and tokens, or a change asked for by a part's name | [blueprint](../../blueprint/SKILL.md) |

The rule decks behind them are the vault's `Notes/Decks/Designing and judging pages.md`, `Colour and
contrast.md` and `Page layout.md`.

## Checks every page change runs

On a served build, before and after the change:

- `npm run site:pages`: sideways overflow at desktop and phone, console errors, 60/30/10 on the
  first screen and the contrast of every text, in both themes.
- `npm run site:read`: body text at least 16 px, line height at least 1.4, running paragraphs at 45
  to 75 characters per line at desktop (`scripts/site/readability.json` holds the limits and why).
- `npm run blueprint:check` for every blueprint the change touches.
