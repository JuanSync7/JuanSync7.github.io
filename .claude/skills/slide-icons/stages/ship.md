# Integrate and hand over

For unchanged reuse, hand over the `slides:use` asset and receipt. Do not rerun a
whole-site build or rewrite an approved icon just to use it on another slide.
The steps below apply when source/catalog assets changed.

1. Run `npm run slides:guard -- --base=origin/main` for an asset task. Generated
   catalog and family files may change; the protected kernel/checks may not.
2. Run `npm run slides:export`, `npm run slides:check` and `npm run check`.
   Verify generation freshness and archive contents. Counts come from the catalog.
3. Build and run the CI browser harness. Inspect the new icon at the intended size
   and the picker at the configured narrow widths. Run affected tests during fixes;
   the complete site regression runs on the final candidate before landing.
4. Report source/fit decision, subject/view, checks, proof/reviewer evidence and
   unresolved uncertainty. Keep measured results separate from judgments.

Follow existing publication authorization. An asset review does not approve a
new brand preference or modify the vault's adopted guidance.
