---
name: site-taste
description: Use before designing or changing any page, section, component, layout or motion on juansync.dev (anything that is not a figure; figures use the figure skill). Holds Juan's frontend design taste as he stated it, the system the site already uses, what he has rejected, and the questions still open, so new work matches him instead of a generic default.
---

# Juan's taste, for the pages of juansync.dev

The figure skill decides how a **drawing** looks. This skill decides how everything around it
looks: pages, sections, cards, navigation, motion between pages. Read it before you design;
check your work against "Before you ship" at the end.

Three kinds of evidence sit here, and they are not equal:

1. **Stated**: Juan said it. Quoted, with the date. These bind.
2. **Built**: the system the site uses now (tokens, layouts, rules). Follow it; it is how the
   stated taste was turned into code, and changing it is a decision for Juan.
3. **Open**: questions the evidence does not settle. Do not decide them; ask, or leave the
   choice visible in what you hand over.

Research recommendations (the creative-web survey of 17 Oct 2026) are none of these: they are
options, not taste.

## Stated

**The reference.** "My site, juansync.dev, is the reference for my taste." (3 Oct 2026)
"Frontend design needs taste, which AI lacks. I set the direction and the templates; AI
implements." The direction is his; propose, don't impose.

**Where each style goes** (3 Oct 2026)
- "Document-style pages should be minimalistic."
- "Casual pages and summaries should be a little cyberpunk, with a space theme."
- "'Minimal' means my article page. Same dark palette and fonts, fewer colours, almost no
  motion. It is the theme turned down, not turned off."
- "A proper learning article with words gets the paper-and-ink style of my /learn articles,
  with just a highlight colour."
- "If there is code, it goes in a macOS-style terminal window."

**Lines you can see** (3 Oct 2026)
- "I like to be able to see the lines and characters, or a low-poly drawing, so that it
  emulates a real diagram." Admired: shan-shui-inf; a low-poly line shader of city skylines
  and 3D objects shaded with lines.
- Generated images: "not super sharp detail, but a watered-down oil painting or watercolour
  style."

**The city style** (17 Oct 2026, about the home hero)
- "for the low polygon shapes, make them wireframe instead of grey polygon."
- "we can have white and teal accent", vias that are "teal colour and have an animations of
  some thing travelling thru them", "teal animation of streaks or windows lighting".
- "envision the layers like PCB where there are some round cylinders as well", "proper city
  design to the layers like blocks, apartment, parks".
- "currently this is the correct style of design that i want." (after the archipelago)
- Things should work as a system, not stand side by side: production lines "look
  disconnected and not as one"; power lines "dangling" need "a proper power station and then
  power distribution"; "when there is airplane there need to be an airport."

**Motion he went looking for** (17 Oct 2026): scenes that change without scrolling down, a
rocket taken apart step by step, zoom transitions, page transitions, "good striking layout,
clean minimalistic layout, cool layout diagrams", low-poly and voxel art done properly.

**Flow charts and graphs** (18 Oct 2026): "every arrow must be at least the length of Slurm
to EDA tools" (60 map units on the home system map), "part of the flow chart or graph rule that
we need to have". A box that holds arrows grows to fit them; arrows never shrink to fit the box.
(19 Oct 2026) A line must not run too close to a box ("move right a little to not cut to close
to a box"), and a label must never be cut by a line. Boxes with no input sit on the outside,
busy boxes on the inside; flow runs left to right or top to bottom where it can; few crossings.

**Light** (3 Oct 2026): "Not dark only: there is light too." For light, "not pure white, but
a more cream-coloured paper."

## Built

- **Night system** (`astro/src/styles/tokens/`, `night.css`, `NightLayout`, `NightPage`):
  near-black ground, cool grey lines and inks, one teal signal (`--nt-signal`). Every colour,
  size, gap, radius and duration is a token; a value that is not one gets added as one first
  (CLAUDE.md, styling rules).
- **Type**: Geist for text, Space Grotesk for display, JetBrains Mono for labels and meta.
  Large display sizes, 16px body at 1.6, a 640px reading measure. Labels are mono; the
  code-comment voice (`// 0x01 · how I think`) carries over from the old site.
- **Lines**: 1px hairlines in the line tokens; a card or panel is a hairline rectangle on the
  ground, not a filled slab with a shadow. Focus is a 2px teal ring.
- **Motion**: a figure moves only when the motion means something (figure skill). Page swaps
  crossfade, the nav holds still, a post card's cover travels into the post
  (`--nt-dur-morph`, `--nt-ease-out`). Scroll position is read, never hijacked: the reading
  progress hairline is CSS-only. Under `prefers-reduced-motion` nothing animates.
- **Drawings** are figures, made with the figure skill; text never goes inside a canvas.

## Rejected

- "i dont like the top layer. dont look like anything." A layer, a section or a building must
  read as something specific, not as filler.
- Grey solid polygons where wireframe was wanted.
- Pure white for a light theme.
- Read-outs and controls that are only there for the bench ("rest", "pan") on public pages,
  and scroll boxes inside a page where the content should simply flow (the lesson log).
- Parts that sit next to each other without a reason to: a line that ends nowhere, a cable
  that hangs, a plane with no airport.

## Open

Leave these visible, don't settle them yourself:

- **Lime or teal as his brand.** On 3 Oct he said "The lime palette is my personal brand";
  the October redesign, the monogram and everything since are teal. The site is teal; whether
  lime is retired was not answered.
- **How much teal.** The figure skill wants one bright mark; the home hero runs teal and white
  as the city's energy, at his request. Whether that is a showpiece exception or a site-wide
  licence is unsettled.
- **Signature pieces from the old site.** On 3 Oct he named "the lime accent on near-black,
  the code-comment labels, the typewriter headline, and the space and lofi scenes" as his
  signature. Only the labels survive in the night system.
- **A cream light theme.** Wanted in principle; not designed.
- **Typography.** Nothing stated; the current type came with the redesign mock-up.

## Before you ship

- Does every element read as a specific thing (no "doesn't look like anything")?
- Is it connected: does each line, flow or part go somewhere and come from somewhere?
- Flow chart or graph: arrows at least the minimum length, lines clear of boxes, no label cut
  by a line, few crossings? On the system map, `npm run map:check` measures all of it.
- Reading page: dark palette, fewer colours, almost no motion. Showpiece or summary: the
  space and city look may come forward.
- Tokens only; no hex, no magic pixel value; new tokens shown in `/design-system`.
- Hairlines and wireframe over filled slabs and grey solids.
- Motion that carries meaning, off under reduced motion; no scroll hijacking.
- Code in a terminal window.
- You looked at it, at desktop and phone width, before calling it done.
