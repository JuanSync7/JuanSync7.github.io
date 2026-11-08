# Geometry examples

**Accept:** two angled supports attached to a new vessel. Their names and the
camera description are new; the generic attach/parallel constraints pass.
**Reject:** shift one support so it no longer meets the body. The same contract
fails JUNCTION without an icon-id branch. Reproducible fixture:
`astro/scripts/slides/checks/selftest.mjs`.

**Accept:** front sheet plus partial rear outlines outside its silhouette.
**Reject:** extend a rear line through the front face. The occlusion fixture fails
OCCLUSION even though source consistency also fails. This calibrates VIEW and
COLLECTION rather than imposing one arrangement on every new subject.

**Accept:** the complete verification tick, rocket flame, inner processor core,
wafer die, layer outline, terminal-dot set or network node.
**Reject:** a full tick arm, fin, core edge, grid divider, circuit trace or uplink
that substitutes a different geometric feature for the intended semantic unit.

**Accept:** folder/cloud with no accent, or explicitly chosen complete-glyph color.
**Reject:** a decorative folder tab or cloud edge. `none` emits no colored strokes.

The frozen cases in `checks/fixtures/semantic-accents.json` retain both the corrected
source contract and the formerly passing wrong accent. They protect known choices;
they do not establish that a future noun has been understood.
