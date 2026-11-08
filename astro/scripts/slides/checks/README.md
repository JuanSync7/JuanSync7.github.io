# Independent checking API

The checker does not call the construction accent selector. Python independently
parses source XML; Node samples actual generated geometry; Chromium independently
measures native primitives. Shared specifications are data, not a shared verdict.
Sampling checks have configured resolution and do not prove physical meaning.

Accent checks compare the exact multiset of highlighted primitives with the source
primitives of the named semantic unit. They reject missing members, partial paths,
extra parts and any color under `none`. `whole` requires the complete glyph.
Frozen user corrections additionally reject the wrong fin, grid line, square edge
or folder tab even when it is geometrically attached and complete. New subjects
remain open. The checker cannot infer anatomy from a name: LOOK must judge and
record the meaning of a new choice before its proof can be approved.

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
