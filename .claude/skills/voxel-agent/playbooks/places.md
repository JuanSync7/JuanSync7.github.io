# Places, companions and exploration

**Use when:** a world feels like unrelated props, or details cannot be inspected at the wider scale.
**Inputs:** measured accepted structures, local-biome natural parents, companion catalog, access map.
**Outputs:** bounded places, accounted companion recipes and actual-geometry camera destinations.

1. A parent must be accepted before its companions are planned. Buildings own themed yards: a mill has crops/farm supplies; a workshop has tools/wood; a forge has ore and furnace supplies. Natural habitats have their own discovery groups.
2. Use stable parent/child ids and separate seeded shape/placement streams. Each child retains the parent's coordinates, minimum separation and maximum neighborhood radius. Rounded candidates must still pass the exact radius check.
3. Realize and measure each child's full geometry before testing its site. Reserve routes before canopy and floor decoration. Place companion canopy, ambient canopy, measured shade, companion floor, then ambient floor.
4. Never force a child through terrain, a roof or another prop to complete a vignette. Account for each expected child as placed or omitted. A place can be sparse when valid space is scarce; keep that fact visible in its report.
5. Build destination bounds only from accepted members. Do not invent a camera stop for an omitted master. Include nearby geological landmarks as separate destinations.
6. Offer whole-world reset, actual-place focus, close zoom, pan, drag rotation, touch pinch/two-finger pan and keyboard controls. Orbit pause/resume must retain azimuth. Reduced-motion results remain stable.
7. Check bounds across camera angles/aspects, plus real production controls and the fallback renderer. Inspect the destination screenshots at useful scale.

**Reject:** orphan supplies, unreported missing children, camera labels backed by planned rather than accepted objects, fixed house/boat composition, or zoom with no way to inspect another part of the world.
**Tools:** `places.ts`, `poi-catalog.json`, `interests.ts`, `pose.ts`, `motion.mjs`, `browser.mjs`.
