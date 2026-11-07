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

**Accept:** teal covers a straight rim from endpoint to endpoint, or the entire lens circle.
**Reject:** teal covers only a centered dash on that rim or one quadrant of the circle.
Being attached is insufficient: coverage and length must match the full selected feature.
A large circle is not shortened to meet a percentage budget.
