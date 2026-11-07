# Feedback and the vault

**Use when:** a user finds repetition, clutter, a placement fault or an unclear scene,
or when a run finishes and its evidence should support the next iteration.

**Inputs:** public/layout seed, engine version, rule id, user observation and evidence.
**Outputs:** one traceable feedback record, a regression case and a maintained vault mirror.

1. Keep the user's observation separate from the agent's interpretation. Record what
   was seen and the exact seed or reproducible scenario. Do not label a reported
   impression as independently verified.
2. Reproduce it at the owning stage. A colour change does not repair composition;
   moving one prop does not repair a solver. Add the failing case to the relevant
   deterministic check, or keep it as a visual case in `LOOK.md` evidence.
3. Fix the narrowest owning rule or algorithm. Run its old cases and the new negative
   fixture before the full suite. Keep the original observation after the fix.
4. Generate a record with `voxel:agent feedback`. Keep source fingerprints, checks,
   artifacts and actual outcome. An unmeasured field stays unknown.
5. Preserve failing source as well as the plan. `replay-snapshot --snapshot=FILE --support=FILE --expect=VXL-ID` reconstructs the historical kernel with archived support/checks in a temporary directory; verify the original fault and the current passing result. Each snapshot entry and the reconstructed generator must match their hashes.
6. Finish checks and visual inspection before exporting stale evidence. Run `voxel:agent vault --vault=/path/to/experience-vault`. It writes only the
   curated Voxel agent notes, an immutable full source/script snapshot, the canonical pipeline, references, run evidence and a hash/ownership manifest. The site workflow remains the
   source of truth; mirrors carry hashes so drift can be detected.
7. The exporter writes local files; it does not push or bypass the vault's privacy checks.
   Save the run's report and feedback in the private vault. Mark the authored guidance
   unreviewed until the owner reviews it. Do not edit generated `Chats/` or promote
   one session's interpretation into approved personal guidance.

**Reject:** an invented successful review, silent deletion of a contrary case,
rewriting an approved rule from a single observation, or an unversioned screenshot.
**Tools:** `voxel:agent replay`, `feedback`, `vault`; report and frontmatter checks.
