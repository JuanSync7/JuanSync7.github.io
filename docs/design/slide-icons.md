# Open icon authoring workflow

The slide/web icon library is extensible. Source subjects, names, families and
view descriptions have no catalog-size limit or subject whitelist. Grid, stroke,
palette, safe margins, accent budget and proof sizes remain explicit theme policy
in `astro/scripts/slides/rules.json`; these bound visual consistency.

## Find → judge → reuse or create

The [slide-icons skill](../../.claude/skills/slide-icons/SKILL.md) is the entry point.
It routes to one stage at a time instead of loading the entire rulebook globally:

1. Search the themed catalog and pinned library references with `slides:find`.
2. Judge the closest candidate against the slide's meaning, view and useful size.
3. Use an already-themed fitting icon through `slides:use`; retain its source and
   review unchanged and record the slide-specific fit in an ignored receipt.
   Reuse a fitting external source with its exact version, bytes and full license notices.
4. Create the missing silhouette when candidates do not fit. Keep the brief and
   iterate its failing part rather than restarting the design.
5. Validate declared relationships, inspect size proofs, record the exact review,
   then export and run integration checks.

A generic bathtub reuses Lucide's bath, including its permitted shower fixture.
A freestanding-no-shower brief uses an original rim, vessel and supports. Both
follow the same pipeline; neither requires a validator branch or a count update.
See the [fit examples](../../.claude/skills/slide-icons/examples/fit-decisions.md).

## Per-icon specification

`astro/vendor/slide-icons/sources.json` contains `slide-icon/2` records: identity,
family, source hash, license references, fit decision/evidence, accent selector,
view, arbitrary named parts and applicable physical constraints. The schema is
`astro/scripts/slides/checks/icon.schema.json`. It validates data, not taste.

Flat and parallel projections are the current 2D/2.5D style boundary. Each icon's
view description, visible parts, hidden parts and rationale are open text/part
identities. The checker verifies that the declaration is structurally consistent;
visual review judges whether that view is physically convincing.

Supported relationships are inside, attach, occlude, repeat, align, parallel and
separate. Numbers such as support spacing belong to the icon's own geometry.
The checker applies declared relationships to every subject with the same code.
Original geometry needs an explicit physical constraint. New mathematical
operations require a maintained checker extension, fixtures and independent
review; a new noun or family does not.

## Commands

From `astro/`:

```sh
npm run slides:brief -- --stage=fit --task="A bathtub for a facilities slide"
npm run slides:find -- --query="bathtub"
npm run slides:use -- --id=bathtub --task="Facilities slide" --why="A shower fixture fits"
npm run slides:add -- --spec=PATH --svg=PATH
# For another source library, also supply --license-file=PATH --license-id=NAME.
npm run slides:import
npm run slides:proof -- --id=ICON_ID
# Inspect the rendered proof and record the actual review of this exact revision.
npm run slides:guard -- --base=origin/main
npm run slides:export
npm run slides:check
npm run slides:extension
npm run slides:reuse-check
npm run check
npm run build
npm run slides:browser
```

`slides:add` preflights schema and geometry before publishing the source/registry
change; duplicate ids, unsafe paths and failed constraints leave existing data
unchanged. `slides:import` derives geometry, typed catalogs, family lists, policy
mirrors and counts from the registry. `--check` reports stale outputs without
rewriting them. The generated TypeScript retains inferred literal identity types.
Stage packets preserve exact context hashes and load only the routed sources;
assembly is not recorded as actual reading or successful use.
Source-library folders and license references are open; every notice is pinned.

Proofs are previews under `slides-out/review/`; they cannot create a publishable
ZIP. Strict export requires current per-icon reviews. Every standalone SVG embeds
its applicable license notices. Aggregate sheets and sprites live under each treatment’s `collections/`;
individual and family proofs use `proofs/icons/` and `proofs/families/`. This keeps
subjects named “overview”, “sprite” or “family-…” valid without file collisions.
Family sheets, sprites, inventories, archive
entries and all public counts grow from actual catalog data.

## Evaluation and evidence

The construction kernel and judging code are separate. Python independently
parses raw source XML and hashes; Node measures generated geometry without calling
the construction accent selector; Chromium independently measures native SVGs.
Geometry is sampled at configured resolution. Passing samples do not prove that
an object is recognizable or that every possible projection is correct.

Negative fixtures cover floating accents, broken joins, containment/occlusion,
repetition, view/spec omissions and invalid geometry. A passing/failing unknown
subject pair checks that new nouns, families, views and angled supports work.
The unchanged-reuse test verifies exact copies, deterministic receipts, stale-export
rejection and preservation of canonical data; it makes no semantic-fit judgment.
The isolated extensibility test adds a new subject/family/library/license, tests
bad-candidate rollback, duplicate rejection and preview-only handling, then
contracts the catalog to one entry without changing the maintained engine.

Visual reviews name the reviewer, actual size proof and its hash, engine revision,
configured sizes/treatments and specific recognition/view/alignment/accent/size
judgments. They are attestations, not authenticated identities or proof that a
model looked. Geometry/engine/export changes invalidate their exact fingerprints.
An independent review claim requires a distinct reviewer and preserved evidence.

[Behavioral evaluation](slide-icons/evaluation/README.md) evaluates the playbook
with fresh paired sessions and independent judging. Its status is separate from
deterministic checks and must remain pending until real runs are evidenced.

## Ownership

Asset authors own their source/spec/fit/review data. Generated files are checked
for freshness. The kernel, checker, policy and playbook are protected from asset
task changes by `slides:guard`. CI uses the guard from the trusted base revision
when one exists; the first installation uses the candidate and therefore needs
its independent bootstrap review. Controlled npm entry points, the CI definition
and the evaluation summary are maintained changes too. A maintainer change needs a revision-bound review
record and independent evidence. This is a diff/record control, not an authenticated
security sandbox. Keep private vault content and approval boundaries separate;
this local workflow is not automatically adopted into the vault's rule package.
