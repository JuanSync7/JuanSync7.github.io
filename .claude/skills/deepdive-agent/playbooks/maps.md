# Terrain and city review

Read `astro/docs/deepdive-map-references.md`. Inspect a topographic map and an actual
street plan before modifying their different scale conventions.

1. Generate relief, coast and contours from one elevation field. Interpolate shared
   grid edges consistently; independently perturbed contour loops can intersect.
2. Follow drainage downhill to a modeled outlet. Check contour residuals,
   intersections, interior hanging endpoints and the river's estuary connection.
3. Reserve the transport graph and water corridors before blocks and parcels.
   Streets meet exact junctions; boundary continuations reach the actual boundary.
   A water crossing requires a bridge whose deck reaches both banks.
4. Allocate blocks between kerbs, then setbacks, frontages, buildings and parks.
   Every building entrance meets a real street access path. Park trees stay clear
   of paths. A roof cannot cover the road that supposedly serves it.
5. Keep town and station details coherent at regional scale. Town roads run between
   roof footprints; contours stop beneath settlement symbols. A station platform
   and its approach connect to the settlement without an undeclared track crossing.
6. Select one complete district/block for the next view. Inspect the whole street
   system and its nested detail, not just the highlighted rectangle.

Run `map-check.mjs` and `map-selftest.mjs`; include former failures as explicit
salts. Judge street hierarchy, bridge readability and terrain shape from the
full-size sheets. More polygons do not repair an invalid access or drainage graph.
