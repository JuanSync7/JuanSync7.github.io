# Independent checking API

The checker does not call the construction accent selector. Python independently
parses source XML; Node samples actual generated geometry; Chromium independently
measures native primitives. Shared specifications are data, not a shared verdict.
Sampling checks have configured resolution and do not prove physical meaning.

Accent coverage checks both directions against the independently reconstructed
source feature and compares total lengths. An attached partial line or circle
still fails. Straight accents cover their full selected edge; circular/elliptical
accents cover the full outline. No percentage budget truncates these features.

Standard path, line, circle, ellipse, rect, polyline and polygon primitives are supported,
so common outline libraries do not require a new validator for a different source format.

Each icon has arbitrary named `parts` and relevant `constraints`:

| Type | Contract |
| --- | --- |
| `inside` | Every sampled point of `parts` lies within `within`. |
| `attach` | Start/end/either/both endpoints meet the boundary of `to`. |
| `occlude` | Sampled `rear` contours stay outside the interior of `front`. |
| `repeat` | Listed parts retain declared dimensions and a declared `offset`. |
| `align` | Listed parts share declared bounding-box features. |
| `parallel` | Named straight edges share direction, including angled directions. |
| `separate` | Listed part bounds do not overlap in both dimensions. |

Numbers such as repeated offsets describe this asset; they are not universal
positions imposed on every subject. A view declares projection, descriptive name,
visible parts, hidden parts and rationale. The schema verifies that declaration;
LOOK judges whether it is true of the object.

`selftest.mjs` has broken fixtures and an unseen-subject positive/negative pair.
Icon authors cannot alter checks or their policy during an asset task. A new
constraint type is a maintainer change with a real case and independent review.
