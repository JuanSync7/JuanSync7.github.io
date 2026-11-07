# Voxcel Island

`/lab/voxcel-island/` restores the compact cottage-and-harbour scene from
[d78373a](https://github.com/JuanSync7/JuanSync7.github.io/commit/d78373a), before the
larger biome-world generator. The requested display name is **Voxcel Island**.
`/lab/voxel-scene/` continues to serve Voxel Worlds.

The island has the original six themes (woodland, mushroom, snow, volcanic, oasis
and village), radii of 17–20 cells, terraced land, a cottage clearing, supporting
vegetation, a pier and up to two sailing boats. This is an intentionally compact
composition. It does not inherit the large world's fourteen-biome population grammar.

The historical generator, terrain, models, harbour, materials and cube meshing are
isolated in `astro/src/figures/kit/voxcel-island/`. Shared camera math keeps drag,
tilt, pan, pinch, zoom and orbit pause/resume consistent. Camera bounds include water
and sails; the eye stays outside solid geometry. The 2D fallback uses the same camera
projection and geometry. The original brighter lighting and small-object silhouettes
remain part of this design.

The restoration reference is the pinned source itself: its cottage/eaves/porch,
measured spacing envelopes, six terrain functions and small harbour. The broader
[reference study](references.md) still informs the large-world variant. No external
assets or engine dependency are added for this restoration.

The island sequence is separate from the larger world's `pipeline.json`:

1. The public template seed selects the theme, compact dimensions, density, anchor,
   initial turn and layout seed. Geometry never reads the clock or camera state.
2. Terrain builds height, liquid, seabed and landmark maps. Separate salted layout
   streams drive large props and small ground details.
3. Place the main cottage, reserve its access path, then try additional village
   cottages. Place canopy before signature props and small vegetation.
4. Every proposed model supplies its measured envelope. Require dry ground, a
   supported base, actual voxel clearance and a gap between reserved envelopes.
   Reject a candidate that fails; do not force it into an occupied location.
5. Build terrain/seabed solids, then add the pier and boats only where the harbour
   water and whole-boat clearance checks permit them.
6. Mesh once. Animate waves, foam, boat bobbing and theme particles; camera motion
   changes the view of that fixed geometry. Fit actual scene bounds at default zoom.
7. Run island checks, browser checks, the fixed figure audit and numbered atlas;
   inspect the images, record limitations, and export both source and evidence.

From `astro/`:

```sh
npm run voxel:island-check
npm run check
npm run build
npm run voxel:island-browser
npm run figure -- voxcel-island
npm run figure:seeds -- voxcel-island 12 --url=http://127.0.0.1:4399
npm run figures:audit
```

The island check covers 256 public seeds plus 96 forced theme contexts, deterministic
replay, cottage presence, actual support, spacing, unique solid cells, boat motion
clearance, 216 framing poses and 648 eye-clearance poses. Deliberately overlapping,
floating, land-bound boat and duplicate-boat fixtures must fail. Browser checks cover the separate route, six theme selectors, retained drag,
pan, tilt, zoom/reset, seed links, phones, fallback and the existing world controls.
Read the numbered sheet and phone captures; mechanical validity does not establish taste.
The restored design deliberately keeps its finite water tile and repeated small
harbour composition. It is not a new population grammar. Use Voxel Worlds for
zero-house/zero-boat scenes, larger terrain and additional biomes.

An island fingerprint includes its own modules, barrel, template grammar and shared camera math. The
larger world keeps its separate kernel fingerprint. Vault snapshots include both
variants and the shared UI dependencies; prior snapshots remain immutable.
`voxel:vault-check` compiles the island from archived bytes, generates its pinned
public seed and reconstructs the world kernel. The exporter records each variant's
fingerprint and keeps island evidence under `Reports/Island/`.
`.github/workflows/voxel-island.yml` runs the island generation, browser and snapshot
checks separately from the maintained shared Checks workflow.
