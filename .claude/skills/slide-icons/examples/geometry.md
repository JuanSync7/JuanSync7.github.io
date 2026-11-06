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
