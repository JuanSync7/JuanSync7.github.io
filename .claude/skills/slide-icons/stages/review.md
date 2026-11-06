# Check and look

1. Run `npm run slides:import` to validate source/spec data and its constraints.
2. Run `npm run slides:proof -- --id=ICON_ID`. Inspect that icon in every configured
   treatment and review size. Load [LOOK](../LOOK.md) for judgment questions.
3. Fix the source/spec for a failed check or visual judgment. Regenerate the
   affected proof; retain prior evidence and the reason for the revision.
4. Only after looking, record the exact fingerprint, engine revision, proof hash,
   reviewer identity and specific judgments. These records are attestations, not
   proof that a person or model actually looked. Independent review must name its
   separate reviewer and artifact; never infer it from a green geometry check.
5. Run `npm run slides:check`. A missing or stale review blocks publishable export.
   `--proof` is a preview path and cannot create a publishable ZIP.

Exit to [ship](ship.md) when checks pass and the review has no unresolved concern.
