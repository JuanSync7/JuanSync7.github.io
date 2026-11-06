# Public vault overview

| | |
|---|---|
| What | A public landing page and five guides explaining the private experience vault. |
| Why | Let visitors understand the system without exposing or connecting its records. |
| Who | Readers exploring the system; maintainers updating its public description. |
| When | Browsing `/vault/` or changing the public copy, synthetic example or diagrams. |
| Where | `astro/src/pages/vault/`, public data modules and `astro/scripts/vault/`. |

The `/vault/` landing page gives the promise, three benefits and routes into the system. Detailed
explanations live at `/vault/purpose/`, `/vault/architecture/`, `/vault/knowledge-graph/`,
`/vault/search/` and `/vault/guardrails/`. Shared navigation, the footer and the home system map link
to the landing page; guides link to one another and back. The existing blog post remains the origin story.

## Public boundary

The page is curated public copy. It has no build-time import, runtime request, credential, private
file mount or deployment link to the vault. Its content lives in `src/pages/vault/`,
`src/data/vault-pages.ts` and `src/data/vault-overview.ts`. No private page, index, entity register, component inventory, scan state
or historical source is published. Counts of private records and private project names are omitted.

The search guide's browser example uses only the ten synthetic records and declared edges in
`src/data/vault-demo.ts`. Its aliases, ranking, one-hop traversal and source/trust labels illustrate
the approach. They are not an endpoint for the actual vault, a language model or an embedding store.
The initial example is server rendered; controls enable when the React island hydrates.

## Diagrams and presentation

Three abstract diagrams live in `src/data/diagrams/vault.ts`: `vault-architecture`,
`vault-knowledge-graph` and `vault-search`. Existing `Diagram.astro` renders real DOM text over wires;
the same story becomes an ordered list below the established narrow-container threshold. The page
uses the existing night palette and spacing tokens. The existing diagrams are unchanged. The
landing page adds functional paper links arranged with CSS depth, rather than a second illustration
source. Reversible GSAP scroll motion coordinates those links, headings, feature cards and dividers;
a sticky chapter bar shows reading progress. These effects follow the shared
[presentation-page pattern](presentation-pages.md), including reduced-motion and static fallbacks.

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
npm run presentation:selftest
npm run presentation:page
```

`vault:check` checks the synthetic search behavior, exports and diagram contracts. The existing
`map:check` measures the new geometry against the same wire, clearance, label and crossing rules.
`vault:page` checks the built landing page and guides, anchors, downloads, initial example and data
boundary. Presentation checks enforce the landing word budget, guide routes, readable text roles
and paper actions. Normal hosted CI runs `presentation:browser` for responsive layouts, motion
lifecycle, keyboard/button interaction, graph navigation, reduced motion and no-JavaScript content.
It uploads the `vault-presentation` screenshots for human review. The deploy build checks the pages
before upload.

When changing descriptions, distinguish implementation from host runtime and development work from
adopted behavior. The newer connected-wiki work is under review. Cached model-written theme
summaries and cross-project agreement/conflict suggestions remain further work. Reconfirm status
deliberately; do not create an automatic private-to-public synchronization path to keep this page current.

## Verification boundary

Source checks and a successful build do not establish visual quality. Inspect the hosted browser
screenshots at desktop and phone widths before publication. The browser script refuses unsupported
local execution in a managed Sites runtime; the project's normal GitHub-hosted CI supplies the
browser evidence. Record the actual result, and do not infer a visual review from a passing build.
