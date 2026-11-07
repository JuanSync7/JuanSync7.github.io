Independent maintenance review: deep-dive CI integration

Reviewer: independent_audit
Author of the candidate: root
Base revision: 41d24892d3743e1030baf240aec48f8ef6fdeca9 (origin/main)
Protected candidate digest: 7d62e99fafdb216daa76ff3ca7ffd7d14c2a8a755bdc65fd8f754dc2291567a7
Verdict: pass

I independently read the complete candidate workflow, its diff against the exact base revision, the current and base slide ownership policies, and the ownership guard contract. The only changed protected file is .github/workflows/checks.yml. Its diff adds ten lines and removes none. The slide policy and guard are unchanged. The package.json changes add five deepdive commands; the existing slides commands and prebuild command are unchanged.

The three added workflow steps are appropriate for the requested deep-dive maintenance:

- The deterministic step runs deepdive:selftest and deepdive:check after dependencies and the existing source checks. Both npm targets resolve to local Node scripts. The first command checks negative fixtures before the layout checks run, and a failure fails the shared checks job.
- The browser and gallery step follows the existing build and Chromium installation. Its npm targets resolve to the reviewed local browser and gallery scripts. Their browser environment owns an Astro development server, uses its actual bound port, and stops the server and browser on completion. The workflow invokes these tools without an external URL override.
- The evidence step uses actions/upload-artifact@v4 with if: always(), the distinct artifact name deepdive-review, and path astro/figures-out/deepdive. This path is relative to the action workspace; defaults.run.working-directory applies to shell commands and does not change the upload action's path resolution. Available diagnostic artifacts can therefore be uploaded after a preceding failure.

The additions preserve workflow triggers, permissions, runner and Node versions, checkout behavior, the separate icon-ownership job, and all existing slide verification commands. They add no deployment or publication action. The new checks use the workflow's existing fail-fast semantics; they do not bypass the maintained slide engine or its ownership gate.

The guard contract correctly requires an independent maintainer record because this shared workflow is protected. This review is an actual separate-agent inspection: independent_audit reviewed root's candidate and did not edit the protected workflow. The accompanying record binds this decision to the exact base, candidate bytes, and SHA-256 of this evidence file. The maintainer guard is run after the record is written. This review does not claim that GitHub Actions has executed remotely.
