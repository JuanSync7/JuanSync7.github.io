# Check and look

1. Run `npm run slides:import` to validate source/spec data and its constraints.
2. Run `npm run slides:proof -- --id=ICON_ID`. Inspect that icon in every configured
   treatment and review size. Load [LOOK](../LOOK.md) for judgment questions.
3. Fix the source/spec for a failed check or visual judgment. Regenerate the
   affected proof; retain prior evidence and the reason for the revision.
4. Only after looking, record the exact fingerprint, engine revision, proof hash,
   reviewer identity, `accentIntent` copied from the reviewed specification and specific semantic judgments. These records are attestations, not
   proof that a person or model actually looked. Independent review must name its
   separate reviewer and artifact; never infer it from a green geometry check.
   Record `judgments.semanticFit` for why this is the right component and
   `judgments.accent` for complete visible coverage; neither verdict is inferred
   from a geometry pass.
5. Run `npm run slides:export`, then `npm run slides:check`. Strict export checks
   the recorded review before producing a publishable ZIP; the final check then
   verifies the fresh exports. `--proof` is a preview path and cannot produce that ZIP.

Exit to [ship](ship.md) when checks pass and the review has no unresolved concern.
