# Find and judge fit

1. Keep the slide brief: intended meaning, literal/metaphorical subject, audience,
   requested view, singular/collection and useful display size. Infer routine
   choices from the slide and established taste; record consequential assumptions.
2. Run `npm run slides:find -- --query="subject"` from `astro/`. It searches the
   themed catalog and a pinned Lucide reference index. Try a broader noun or
   synonym if needed. The result is a candidate list, not a quality verdict.
3. Inspect the candidate SVG and its source/license. Use other working libraries
   such as Tabler when useful. Record exact source/version and attribution; the
   cached index is not a claim that every current library has been searched.
4. Judge silhouette, semantics, visible parts, detail at the intended size and
   compatibility with the site's ink/paper/teal theme. Existing geometry is useful
   evidence, not authority to override the slide's intent.
5. If an already-themed icon fits, record a task-specific use decision and use its
   verified SVG; do not alter the canonical fit record or re-stage its id. Keep
   slide/project-specific context in the ignored use receipt. Public source records
   describe reusable object requirements. For a newly imported or created source,
   record `fit.brief`, `fit.decision`, rationale, references and rejected alternatives.
   A close-looking object with the wrong meaning is a reason to create, not force-fit.

Exit to [reuse](reuse.md) when a source fits; otherwise [create](create.md).
Examples: [fit decisions](../examples/fit-decisions.md).
