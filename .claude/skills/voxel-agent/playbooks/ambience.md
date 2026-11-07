# Camera, light and motion

**Use when:** adding drag controls, changing framing or lighting, or repairing motion,
WebGL performance, reduced-motion behaviour or fallback rendering.

**Inputs:** final world bounds, daylight/sun streams, user controls and figure time.
**Outputs:** a fitted camera, readable directional light and bounded physical motion.

1. Fit the actual world bounds, including tall trees, cave roofs and sails. Project
   all bounds corners at the supported yaw, pitch and aspect ratios. Default zoom
   keeps the world in frame; deliberate zoom may crop cut edges for detail. For a focused place, score nine rays over its subject region against foreground outside its bounds; a clear center alone is insufficient. Lift only as needed, refining the angle to avoid coarse orbit jumps and preferring fewer blocked rays when no complete opening exists. Preserve yaw. Retain the requested angle if a cave roof hides every elevated option; keep the eye outside solids in all cases. Visit every crossed voxel with exact grid traversal; fixed-distance samples can miss grazing corners. Test an independent mesh ray against the frozen seed-42 obstruction, beyond bounds-only projection checks.
2. Accumulate drag input into yaw and pitch. Keep the result after release. Capture
   and cancel pointers cleanly; retain keyboard rotation and zoom. Clamp pitch and
   zoom. Reset returns to the seed's rest view.
3. Seed daylight and sun direction. Let dawn, noon and sunset change the light, not
   the geometry. Reuse lights and skip unchanged camera fits.
4. Sample swell from coordinates and figure time. Water, foam and boats use the same
   field. Keep bob and roll inside the envelope checked during placement.
5. Build static exposed faces once. Render continuous GPU liquid surfaces and instance foam/weather; freeze small
   previews and skip work for unseen simulation steps. Avoid per-frame regeneration.
6. Under reduced motion, the clock stays at rest time. Manual camera input still
   redraws. The fallback projects the same geometry without requiring WebGL.

**Reject:** an input jump, a clipped default view, an eye inside a voxel, a blocked frozen focus, moving terrain, unbounded boat
motion, a random draw call or different geometry when lighting changes.
**Check:** `motion.mjs`, browser drag/keyboard/touch tests, framing and reduced motion.
**Tools:** `frameWorld`, `frameTerrain`, `viewOf`, `sunlight`, `buildWater`, `buildEffects`.

The default camera orbits slowly; dragging or keyboard navigation pauses it and retains the
chosen pose. The orbit toggle resumes motion. Reduced motion freezes the figure clock.

Water detail review: shoreline tests exclude submerged terrain columns, not merely missing height cells. Otherwise every pond bed suppresses its waves and receives shore foam. Foam uses seeded irregular samples on open water only; ice and lava do not receive white foam. The real GPU probe includes submerged beds, fixed ice, a cascade join and a true bank.
