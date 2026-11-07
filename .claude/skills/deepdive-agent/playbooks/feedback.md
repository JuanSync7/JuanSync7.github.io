# Make the next run better

1. Preserve the observation exactly enough to reproduce: public seed, level/time,
   chain/era when known, source fingerprint and original artifact.
2. Record it with `npm run deepdive:agent -- feedback --seed=42 --level=3
   --rule=DD-CONNECT --note='Observed fault' --evidence=figures-out/deepdive/image.png`.
   The record is `reported`; the command does not certify that the fault is real.
   For an isolated gallery plan, use `--salt=N --chain=silicon --era=ERA` instead
   of a public `--seed`; city plans require `--chain=city` and no silicon era.
3. Add a failing regression or a named visual review case. Fix the narrowest owning
   model/routing rule. Keep the original evidence after the repair.
4. Repeat the check and review on the final source. Record artifact hashes and actual
   exit statuses. A newer source invalidates an old “current pass” claim.
5. Update the relevant contract or playbook when the lesson applies beyond one seed.
   A one-off taste preference stays attributed to its source until confirmed.
6. Hand over changes, commands/results, inspected cases and unresolved faults. Local
   verification is separate from committing, opening a PR or deploying the site.

**Reject:** overwriting an old observation with a success claim, deleting a contrary
case, or changing a threshold solely to turn a report green.
