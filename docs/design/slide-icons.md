# Slide icons

`/lab/slide-icons/` is the simple companion to Hardware Atlas: 24 original marks
for compute, systems, data and research. A 64-unit grid, 1.25-unit strokes, rounded
joins and one teal feature keep them consistent at presentation sizes. Visible
isometric edges describe hardware; front views keep documents and tools legible.
These are static icon assets, not animated explanatory figures.

Geometry lives in `astro/src/figures/kit/slides/`. `SlideIcon` presents those paths;
the SVG serializer exports the same data. Dark-slide ink comes from the existing
night palette. Light-slide ink mirrors the existing paper tokens. Monochrome uses
one colour for every path. No new colour tokens or runtime dependencies are added.
The component appears in the design-system ledger.

`npm run slides:export` writes 96 standalone SVGs, four 24-symbol sprites, four
numbered overview sheets, a manifest and a deterministic ZIP. The build's
`prebuild` hook regenerates the ignored `public/downloads/slide-icons/` directory,
so the website's individual links and complete ZIP match the current source.
Every icon has a transparent background and contains no type, bitmap, stylesheet,
script, filter or external reference. Overview-sheet labels are separate from the icons.

`npm run slides:check` verifies every variant, one highlight per mark, the complete
sprites and archive contents/checksums using Python's independent ZIP decoder.
`npm run slides:browser` measures actual SVG bounds and checks dark/light ink,
monochrome, SVG/XML downloads, clipboard, filters, search, saved views, phone/tablet
overflow and useful downloads without JavaScript. Its screenshots are reviewed
alongside the overview sheets and small-size proofs.
