Independent maintenance review: the library page check in CI, against the moved main

Reviewer: codex (a different model family from the author; run read-only, it edited nothing)
Author of the candidate: claude
Base revision: ee821abfa02c7c58294db20493dc11a667d7fdba (origin/main)
Reviewed head: 4ac059cb7894bf0cae5de62c143622ce92135ee7
Protected candidate digest: 33c9ce46fb4112a746c8e3e7203d6b1c20b379580ca14f750ccd432eef1d5865
Verdict: pass

Main moved after the earlier review (library-pages-maintenance-review.md, bound to the older base), so the guard
asked for a review bound to the new base. The protected candidate is unchanged: the same digest, the same one line.
The reviewer ran twice. The first run reviewed the candidate and passed it, but returned request_changes because the
committed record still named the older base. The second run was asked for a verdict on the protected candidate alone,
knowing that record would be replaced by this one. Both reports follow as returned; the author transcribed them and
did not change their content.

First run

Verdict: request_changes

Summary: FAIL: the committed maintenance record names the older base, so icon-ownership rejects this head against the requested base. The protected change itself passes review: it does not weaken or bypass slide protections. Selected changed paths: only .github/workflows/checks.yml. ownership.json is unchanged; all slides:* and prebuild scripts are unchanged. The rest of checks.yml is byte-for-byte identical to the base after accounting for the expected command append. No files were edited; final git status --porcelain is empty.

Findings: 
- docs/design/slide-icons/maintenance-review.json:4 (medium) The maintenance record references the older base, causing the icon-ownership CI job to fail against ee821abfa02c7c58294db20493dc11a667d7fdba. Evidence: Line 4 records dd07a95b692a1a25e9ae4988f8fa7251d5fa26d6. Executing the base guard in memory with Python 3.11, --base ee821abfa02c7c58294db20493dc11a667d7fdba --mode maintainer, exited 1: 'AssertionError: Review must name the exact base revision' at guard.py:42. The protected candidate digest matches the recorded 33c9ce46fb4112a746c8e3e7203d6b1c20b379580ca14f750ccd432eef1d5865; the base mismatch is the blocker.

Checked:

- Confirmed HEAD is 4ac059cb7894bf0cae5de62c143622ce92135ee7 and its merge-base with the specified base is ee821abfa02c7c58294db20493dc11a667d7fdba.
- Ran the requested git diff --name-only between those revisions: 71 changed paths. Applied the complete BASE ownership.json protectedFiles/protectedPrefixes rules minus assetFiles/assetPrefixes, plus the policy-file and package-script conditions. The complete selected list is [.github/workflows/checks.yml].
- Read the full checks.yml diff and workflow. Line 61 only appends '&& npm run library:pages'. A byte comparison confirmed that applying this single replacement to the base reproduces the entire head workflow, including the unchanged icon-ownership job.
- Read the full astro/package.json diff and compared every slides:* and prebuild script between revisions; none differs. library:pages resolves at package.json:29 to 'node scripts/library/check.mjs --dist'.
- Read astro/scripts/library/check.mjs in full. The --dist path at lines 181–185 only reads local content, legacy-map and built-site files. It performs no writes, publishing, subprocess execution or network requests. Problems exit 1 at lines 104–107; the added shell command preserves failure propagation through &&.
- Also traced library:selftest, library:sync:selftest and library:check added to the existing CI npm run check command. Read library/sync.mjs and its lessons/taxonomy.mjs dependency in full. The selftests write and remove temporary fixtures, including a temporary symlink; they do not modify repository files, publish or contact the network. Failures propagate. The source check is read-only.
- Inspected the .github/workflows/astro.yml diff; its only change adds the same library:pages command.
- Read the base guard.py and maintenance-record diff; verified guard.py and ownership.json are unchanged. Ran the base guard selftest successfully. Ran the library source check successfully: 28 pieces, 31 legacy forwards. Node syntax checks for both library scripts and taxonomy.mjs passed; git diff --check passed.
- Did not rely on or read the older review report. Did not verify its evidence hash, run GitHub Actions, install dependencies, build the site, execute the --dist check or writing selftests, or rerun slide rendering/browser/export suites. Unrelated application changes were outside this maintenance review.
- Final git status --porcelain produced no output.

Second run

Verdict: approve

Summary: PASS for the protected candidate between base ee821abfa02c7c58294db20493dc11a667d7fdba and head 4ac059cb7894bf0cae5de62c143622ce92135ee7. The candidate contains only .github/workflows/checks.yml. It adds a local validation command without weakening the slide engine, checker, ownership gate or icon-ownership job, suppressing failures, or adding publishing or network access. Full CI/build execution and the replacement review record were not verified. The known-stale record was excluded from findings. No files were edited; final git status --porcelain was empty.

Findings: none.

Checked:

- Computed the candidate from git diff --name-only --no-renames BASE HEAD using BASE astro/scripts/slides/ownership.json. Asset exclusions applied; policy unchanged; slides:* and prebuild scripts identical, so astro/package.json is outside the candidate.
- Reviewed the complete .github/workflows/checks.yml diff and full head file. Line 59 only appends && npm run library:pages; failures propagate. The icon-ownership job at lines 13–29 and existing slide checks remain unchanged.
- Traced astro/package.json:29: library:pages runs node scripts/library/check.mjs --dist; no matching npm lifecycle hooks are defined.
- Read astro/scripts/library/check.mjs in full. Lines 62–101 validate local built files; lines 104–108 exit 1 on problems; lines 178–190 select the --dist branch. Imports are Node built-ins; this branch performs no writes, subprocess execution, publishing or network requests.
- node --check astro/scripts/library/check.mjs passed.
- Final git status --porcelain exited 0 with empty output.

Not verified by the reviewer: that GitHub Actions ran remotely, a fresh build, and acceptance of this record by the guard. The author ran the guard after writing the record.
