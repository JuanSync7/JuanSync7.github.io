# Prove the failure is caught

Run from `astro/`. Use `npm run deepdive:agent -- check` for the deterministic
sequence, or the individual commands while repairing a narrow failure.

1. Add the reported seed or minimal geometry to the owning check. Establish that it
   fails for the intended reason before fixing the generator.
2. Add an adversarial fixture: disconnected endpoint, interior crossing, inaccessible
   room, off-boundary component, crossing contour or discontinuous handoff.
3. Run `deepdive:selftest` and `deepdive:check`. The sweep must include every scale,
   both chains and all silicon eras. Zero cases and missing families are failures.
   In `deepdive:check`, `--seeds=N` is a count. In `deepdive:gallery`,
   `--salts=1,7,42,2026` is an isolated plan-salt list, optionally filtered with
   `--chain=city` or `--chain=silicon`. The browser's `--seeds` is a public-seed list.
4. Keep geometric predicates independent from placement code. A validator must not
   merely return the generator's declared status or recalculate the same shortcut.
5. Run the existing figure source/look checks. Do not relax global thresholds to
   accommodate a new failure. Type, lint and build checks remain required.
6. Re-run after the last source edit; attach outputs to that source fingerprint.
   Browser artifacts from an earlier fingerprint are historical evidence only.

**Reject:** a fixture that passes before the fix, a gate over zero plans, swallowed
errors, omitted difficult seeds or a new check that mirrors the bug.
