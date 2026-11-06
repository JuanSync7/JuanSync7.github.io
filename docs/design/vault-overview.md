# Public vault overview

The `/vault/` landing page explains the experience vault's purpose, areas, architecture, knowledge
graph, retrieval and safeguards. It is linked from the shared navigation/footer and the home system
map. The existing blog post remains the origin story; this page is the system overview.

## Public boundary

The page is curated public copy. It has no build-time import, runtime request, credential, private
file mount or deployment link to the vault. Its content lives in `src/pages/vault/index.astro` and
`src/data/vault-overview.ts`. No private page, index, entity register, component inventory, scan state
or historical source is published. Counts of private records and private project names are omitted.

The browser search example uses only the ten synthetic records and declared edges in
`src/data/vault-demo.ts`. Its aliases, ranking, one-hop traversal and source/trust labels illustrate
the approach. They are not an endpoint for the actual vault, a language model or an embedding store.
The initial example is server rendered; controls enable when the React island hydrates.

## Diagrams and presentation

Three abstract diagrams live in `src/data/diagrams/vault.ts`: `vault-architecture`,
`vault-knowledge-graph` and `vault-search`. Existing `Diagram.astro` renders real DOM text over wires;
the same story becomes an ordered list below the established narrow-container threshold. The page
uses the existing night palette and spacing tokens, with quiet wires and no added motion.

`scripts/vault/export.mjs` generates the downloadable SVGs from those same diagrams and the site's
night palette. It escapes text and includes accessible titles and descriptions. Edit the diagram
data and regenerate; do not edit the SVGs independently.

## Maintenance

From `astro/`:

```bash
npm run vault:diagrams:build
npm run vault:check
npm run check
npm run build
npm run vault:page
```

`vault:check` checks the synthetic search behavior, exports and diagram contracts. The existing
`map:check` measures the new geometry against the same wire, clearance, label and crossing rules.
`vault:page` checks the built public page's anchors, downloads, initial example and data boundary.
CI runs these with the normal checks and build; the deploy build checks the page before upload.

When changing descriptions, distinguish implementation from host runtime and development work from
adopted behavior. The newer connected-wiki work is under review. Cached model-written theme
summaries and cross-project agreement/conflict suggestions remain further work. Reconfirm status
deliberately; do not create an automatic private-to-public synchronization path to keep this page current.

## Verification boundary

The managed execution environment has no supported browser-control tool. Local verification uses
source/type checks, static builds, synthetic retrieval assertions, diagram geometry and inspected SVG
exports. Browser visual review at desktop and phone widths remains a separate check; it must not be
reported as completed from a successful build alone.
