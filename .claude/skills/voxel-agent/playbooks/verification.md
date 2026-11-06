# Verification and visual judgment

**Use when:** handing over any generator change, adding a rule or updating a regression.

**Inputs:** candidate source tree, policy, fixed seeds, negative fixtures and user notes.
**Outputs:** measured reports, screenshots and an explicit limit/uncertainty record.

From `astro/`:

```sh
npm run voxel:check
npm run check
npm run build
npm run voxel:browser
npm run figures:look -- --url=http://127.0.0.1:4321 voxel-scene
```

The browser script starts a production preview unless `--url=...` is supplied. The
figure look needs a running server. `CHROMIUM_PATH` selects an already installed
browser in a constrained environment; normal CI uses Playwright's installed browser.

- `check.mjs` samples natural seed distribution and a balanced biome matrix. It checks
  geometry against the terrain maps and tests counts, sites, dimensions and recipes.
- `content.mjs` samples 600 model recipes, ground-connected geometry and local catalog coverage.
- `selftest.mjs` corrupts real generated fixtures. Each must fail its named rule.
- `motion.mjs` checks actual renderer state and projected camera bounds, not a copy of
  the animation formula.
- `browser.mjs` checks real controls, drag retention, keyboard and touch, exact seed
  restoration, phone layout, context lifecycle, lighting and the 2D fallback.
- `workflow.mjs` checks the entry point, playbook/script links and prompt contract.

Do not accept a zero-item check as coverage. Preserve the audit report and its hash.
Inspect the atlas and phone screenshots using `LOOK.md`; measurements cannot establish
recognition or taste. A new visual correction remains a review case until inspected.
