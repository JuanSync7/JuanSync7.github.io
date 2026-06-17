# Article art — template & system prompt

Reusable spec for the abstract art that sits at the top of each article (and on
its blog card). Inspired by Linear's `/now` series: every piece is a **bespoke
abstract metaphor for one article's idea**, yet the whole set reads as one family
because they all obey the rules below.

## Architecture (where the code lives)

- **`src/components/art/artGeometry.ts`** — the **single source of truth**. A pure
  function `computeArt({ seed, motif, space, variant })` returns the whole scene
  (every coordinate/path/label). Edit geometry **here, once**.
- **`src/components/trackers/ArticleArt.astro`** (SSG) and
  **`src/components/blog/ArticleArt.tsx`** + **`ArtMotifs.tsx`** (React island) are
  **thin renderers** over that scene — they differ only in framework syntax, never
  in geometry. The Astro and React art are therefore identical by construction.
- **Category → motif/accent/image** is resolved by `src/config/registry.ts`; a
  page's hero art is resolved by `src/lib/content.ts` (`learnArt`/`resolveBlogArt`).

**Determinism invariant (non-negotiable):** the art must be a pure function of the
seed. **Never** use `Math.random()` or `Date` in `artGeometry.ts` — derive every
value from the seed hash. This keeps the static build reproducible AND prevents a
server/client SVG mismatch (hydration error) on the `client:load` blog island. The
companion gradient generator (`blog/PostImage.tsx`) follows the same rule and adds a
darkness clamp (`clampL`, max L 0.28) so backgrounds stay legible-for-text by design.

## Non-negotiable template rules

1. **Medium:** SVG, pure **black-and-white line work**. Ink = `var(--art-ink)`
   (= `--txt`, so white on dark / near-black on cream). Faint structure =
   `var(--art-dim)` (= `--line`). Labels = `var(--art-mute)` (= `--muted`).
   No fills except the single accent, no gradients, no glow, no color.
2. **Ground:** transparent. The art floats on the page — never a card/panel/box.
3. **Canvas:** `viewBox 0 0 1200 520`, rendered as a banner with
   `preserveAspectRatio="xMidYMid slice"`. Keep all content within the visible
   band **y ≈ 90–430** (slice crops top/bottom on wide containers).
4. **One focal accent:** exactly one solid-ink element is the focal point. Give
   it a topic-specific micro-detail (flow→attention lens, lattice→die-grid).
5. **Negative space:** the subject occupies ~half the canvas. Calm, not busy.
6. **Two layers, composed per piece:**
   - **Main art** — the subject (a motif).
   - **3D background** — a separate, optional space layer (`space` prop:
     `auto|none|fan|burst|tunnel`), faint rays to a vanishing point + depth frames.
   - **Rule:** an art that *already emulates a 3D object* (`orbit`, `lattice`,
     `stack`) gets **no background** — double-3D fights itself. `auto` enforces
     this; flat motifs (`flow`, `loop`, `wave`) get a seeded background.
7. **Shared "Linear" devices:** detection-style **corner brackets** around the
   focal node; **on-topic words** as `--art-mute` mono labels (focal label inked).
8. **Seeded variation:** composition is seeded by the article slug (counts,
   rotation, jitter, which node is solid) so no two are identical but all are
   on-template. Never use `Math.random()` — derive from the seed hash.
9. **Strokes:** 1.5px ink, 1px structure. Mono labels ~21–22px (viewBox units).
10. **Themability:** colors only via the `--art-*` vars → flips automatically in
   dark/cream. Astro caveat: no block-body arrows (`=> { return … }`) inside the
   template — use concise-body arrows.

## Perspective: one projection per piece

Every piece that implies depth commits to **one** projection system. Mixing two in
a single frame reads as broken — this is the principle underneath the
"3D art ⇒ no background" rule (that rule is just its most common case).

- **One-point** — depth lines converge to a single vanishing point ("looking *into*
  a space"): `fan`, `cube`, `terminal`.
- **Multi-point / divergent** — more than one VP, a more enveloping space:
  `burst` (two vertical VPs), `tunnel` (four corners).
- **Parallel / axonometric** — no convergence; depth from constant-angle parallels
  (flatter, "technical-drawing" feel): `lattice` (isometric), `stack` (oblique),
  `mesh` (orthographic rotation).

Rules of thumb:
1. A **3D main art** (parallel or perspective) brings its own projection → **no
   background**. Two depth grammars in one frame fight.
2. A **flat main art** (`flow`, `loop`, `wave`, `scatter`, `detect`, `pixel`) has no
   depth of its own → it may sit on any background, and the background then owns the
   sole perspective.
3. A background is internally single-projection: don't mix converging rays with
   parallel floor lines in one backdrop.

## Method: one bespoke metaphor per article

Don't reach for a generic shape. Ask: *what is this article actually about?* and
design the abstract metaphor for that idea. The strongest pieces are an abstract
**pipeline/process with a focal "where it happens" node** carrying a micro-detail:
- `flow` — inference path as a **pipeline**: `TOKENIZE → … → STREAM`, focal
  ATTENTION holds a lens. (Use a pipeline only when the topic *is* a process.)
- `lattice` — silicon **crystal lattice**: atoms (nodes) + bonds (edges) in iso 3D,
  focal `Si` atom bracketed. (Edges+nodes geometry, not a pipeline.)

Other built motifs:
- `loop` (cycle), `orbit` (systems, 3D), `stack` (layers/memory, 3D),
  `wave` (throughput/signals).
- `mesh` — wireframe polyhedron, edges+nodes geometry (à la *output-isn't-design*), 3D.
- `terminal` — terminal windows over receding horizontal floor lines + code-dash
  streams ("many writers", à la *self-driving-saas*), 3D.
- `detect` — object-detection boxes + confidence tags (à la *self-driving-saas*).
- `pixel` — dot-matrix glyph / pixel words (à la *zero-bugs-policy*).
- `scatter` — scattered dots resolving left→right into an ordered grid, framed by a
  measurement rule + dimension arrow (signal → structure, à la *building-what-customers-need*).
- `vortex` — log-spiral arms winding into a focal core; particles ride the outer arms
  (convergence / pull / attention). Flat top-down swirl → may take a background.
- `hub` — a central node with lines fanning in/out via rounded orthogonal elbows
  (à la *cx-in-linear*). The `variant` prop expresses the relationship: `mm`
  (many-to-many) · `m1` (many-to-one) · `1m` (one-to-many) · `chain` (hubs in series).
- `blueprint` — dotted construction grid + a central icon in a rounded-square frame,
  annotated with dimension arrows + spec text (à la *how-we-hire-at-linear*). Owns its
  full-canvas field → takes **no** background. Spec text is sample — swap per article's measure.

Backgrounds (`space`): `fan` · `burst` · `tunnel` · `cube` · `lens` (camera-lens
barrel: concentric rings + radial spokes zooming to a centre point).

### Backlog
- `solo` — a single strong abstract form on its own (à la *design-is-more-than-code*).
- a real pixel **font map** so `pixel` can spell words, not just glyphs.

When adding one, follow the rules (ink-only, transparent, one focal accent,
brackets + on-topic words where they help, seeded; mark it in `is3D` if it
emulates a 3D object so `auto` drops the background).

## Adding art to a new article

1. In the article frontmatter set `art:` to a motif (`flow|lattice|loop|orbit|stack|wave`).
   If none fits the topic, author a new motif in `ArticleArt.astro` following the rules above.
2. The same component renders the hero (`/learn/[...slug]`) and the blog card, so the
   identity is shared.

## System prompt (to generate a new motif)

> Design an abstract SVG motif for an article about **<TOPIC>**, to drop into
> `ArticleArt.astro`. Obey the template: `viewBox 0 0 1200 520`; pure ink line-work
> using only `var(--art-ink)` / `var(--art-dim)` / `var(--art-mute)`; transparent
> ground; keep content within y≈90–430; one solid-ink focal element with a
> topic-specific micro-detail; reuse the shared 3D backdrop (`rays`/`depth`) and
> `brackets()` around the focal; add 3–6 on-topic mono labels (`--art-mute`, focal
> inked); seed all variation from the `rand()` hash (no `Math.random`); concise-body
> arrows only. Find the single clearest abstract metaphor for the topic — prefer a
> process/pipeline with a focal "where it happens" node — and render it calm, with
> generous negative space, so it reads as one of the same family as `flow`/`lattice`.
