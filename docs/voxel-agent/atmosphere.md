# Voxel lighting and weather

Both scenes now share one deterministic atmosphere controller. **Voxel Island** is
the corrected display name; `/lab/voxcel-island/` and existing seed links stay valid.
Voxel Worlds remains at `/lab/voxel-scene/`. Terrain, population and placement are
unchanged by light/weather controls.

Coloured light is mapped back into the muted voxel material gamut while retaining
light/shadow value. Matte ground and foliage retain their own chroma instead of
turning into broad teal highlights; strong colour remains on actual emitting sources.
The generic palette audit and its limits are unchanged.

The prior renderer had strong ambient light, no cast shadows or fog, and tiny or absent
ambient particles. A light-colour-only check could pass while those visual defects
remained. The new web design agent workflow preserves that renderer at
`ab70b7ead5b7755500dc0577c0093037aa5e866d` as a reproducible contrary example.

The controller uses a directional key and hemisphere fill, one cached static shadow
map, weather-specific fog, emissive window/fire/lava cells, bounded source halos and
local lights. Rain/snow fall above the topmost solid field, including canopy and cave
roofs. Low mist is depth-tested; dust and ash drift. Weather off retains practical
light and local smoke/fire. Night is a cool readable key with warm practical sources.
Current kernel fingerprints include the shared atmosphere, generation/colour helpers
and night material tokens. Earlier non-atmosphere archives retain their original
fingerprint format; both formats are reconstructed in verification.

The public controls offer biome light/weather, dawn, noon, evening, night and explicit
weather families. The shared figure clock freezes effects under reduced motion.

Island snowfall uses `islandSnowSize: 0.14`, giving a maximum edge of 0.112 terrain
voxels at the compact island scale, about 71% smaller than the previous flakes.
This addresses the 2026-11-11 size correction; particle density, fall motion and
the wider world's snow size stay unchanged. Check actual instance dimensions and
inspect overview, close zoom and phone views rather than testing visibility alone.

`astro/src/figures/kit/voxel-atmosphere/pipeline.json` owns the update order;
`policy.json` owns light presets and resource limits. `scene.ts` emits an actual trace.
The web design agent routes visual work through this playbook and geometry work
through the existing voxel workflow, as one operating agent.

| Requirement / status | Rationale and hard question | Implementation / evidence |
|---|---|---|
| Key, shadows and night / built | Can a property say shadows work while no shadow is drawn? | Actual GPU shadow ablation, day/night images and caster fixture. |
| Visible coupled weather / built | Can rain look like sunny clear weather, or hide at world scale? | One resolved profile drives light/fog/particles; independent particle ablation. |
| Geometric stability / built | Can lighting silently reroll or clip the world? | Fourteen pinned geometry hashes, static buffer checks and existing camera/placement audits. |
| Replay and accessibility / built | Do time repeats, reduced motion and non-WebGL still work? | Matrix and GPU replay; production phone/reduced-motion/fallback cases. |
| Budget / measured per run | Does the larger world multiply shadow passes or local lights? | One cached key map, bounded practicals/particles, existing unchanged performance audits. |
| Evidence ownership / built | Can an archive omit a new dependency or overwrite an owner edit? | Complete source snapshot, reconstruction, ownership and no-partial-write fixtures. |

From `astro/`, run the existing scene checks plus:

```sh
npm run voxel:atmosphere-check
npm run voxel:atmosphere-browser
```

The browser check serves a separate evidence harness for actual GPU ablations and
pinned old-source images, then tests the production UI and a forced 2D fallback. It
requires the baseline Git commit to be available; CI checks out full history. It
never adds a mutable scene inspection API to production pages. Read the comparison
sheet and both template seed sheets before export. Exact commands/results and hashes
belong to the run report, not a claim that future source is automatically validated.

Limits: this is a matte voxel diorama, not volumetric/path-traced lighting. Only static
solids cast the cached key shadow; moving boats/particles and practical point lights
do not add shadow passes. Halos have bounded radius. Fog density is a depth cue, not a
physical atmospheric simulator. The 2D fallback has directional face tones, fog colour,
weather and glow but no GPU mapped shadow. Intentional close zoom can crop the world.

The post-placement controller can resolve seeded night from the layout seed alongside
the legacy daylight hint. Explicit light/weather controls take priority; reports retain
the actual resolved atmosphere separately from the generation plan.
