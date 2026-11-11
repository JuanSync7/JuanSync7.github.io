# Room tonal separation — 11 November 2026

The user reported that monochrome gradients and colour depth still failed to
separate details. The previous scene-wide contrast test passed while cabinetry,
chair frames and wall trim collapsed toward black. Improve the value hierarchy
before adding more effects. Operate under the existing web design agent; the
lighting playbook, rules, kernel index, brief template and focused checks hold this
correction. This is an unreviewed visual candidate, not global guidance adoption.

## Treatment

Use existing night tokens for differentiated plaster, timber, cabinet fronts,
fabric, metal, tops and paper. Reserve near-black for recesses and feet. Keep ACES
exposure 1 and the existing source/shadow plan. Monochrome uses key 4.2, sky 0.9,
bounce 0.5 and a neutral ground-side hemisphere response. This retains lower-face
information without replacing directional form with ambient light.

Compose a world-space height ramp (0.72–1.12), floor-depth ramp (0.86–1.08), and
bounded analytic wall-foot/floor-edge/corner attenuation with existing procedural
grain and material-local PCSS. Contact attenuation affects indirect light only;
minimum gain is 0.45. This is a stylized room-plane approximation, not geometry AO,
SSAO, ray tracing or global illumination. No extra shadow passes, render targets,
textures, dependency or postprocessing composer are required. Colour uses 45% of
the tonal adjustment while retaining its curated seed palette and light mood.
Computer/bar shadow detail also benefits from neutral bounce and a coloured
ground response, retaining their cool/amber key and practical sources.

Canvas uses projected world-axis gradients and clipped grain in both appearances.
It retains signed diffuse face shading and BSP occlusion, but does not reproduce
GPU contact attenuation, mapped shadows, reflections or glow. Camera paths,
geometry, collision bounds, seed choices and placement stay unchanged. The hover
fill increases from 0.12 to 0.20 in both renderers to remain visible against the
new midtones; global interaction and palette thresholds stay unchanged.

## Failed-first evidence

Baseline source: `b7b217048da50d30c7a3e2eb8a3c620003c5baba`. Capture is actual native
640×356, isometric 135°, zoom 1, public seeds. `room-tone-before.json` records the
measurements and original image hashes. An unlit entity-ID render identifies the
same visible geometry; one-pixel mask erosion excludes antialiasing boundaries.
Bright props cannot compensate for unreadable furniture in this check.

For dining seed 38, measured monochrome median values on the 0–255 luminance scale
change from wall 33 / furniture 8 / table 25 to approximately 76 / 73 / 135.
The complete nine-theme baseline must fail the new per-role checks. Intentional
dark tiles/brick can remain darker than plaster: the scoped minimum wall median
is 45, furniture 45 and table 55. Require q90–q10 spreads of 0.08 / 0.10 / 0.06
respectively. These are readability floors for this overview, not photographic
exposure targets or substitutes for opening the images. Existing global coverage,
night-token, signal, motion and performance limits are unchanged.

`npm run rooms:tones` renders nine themes × two appearances × two renderers,
checks exact colour→monochrome restoration, and requires crushed-furniture,
flattened-wall and flattened-table mutations of actual renders to fail in each
renderer. Shader composition/restoration remains in `rooms:materials`. CI and
`rooms:verify` invoke the new tonal check. Reports start incomplete and only pass
at the end; baseline capture mode explicitly never marks a check passed.
CI invokes the new material/tonal checks through the established room browser
entry point; its shared protected workflow file is unchanged. Seed input and
performance startup actions allow 60 seconds for cold shader/PMREM compilation in
the software-GPU runner and record `coldSeedMs` / `coldLoadMs`. This is a test load deadline; visual limits and separate
render-frame budgets remain unchanged.

Review all theme captures, eye 0°/90°/180°, true isometric and phone controls. Use
the unchanged room-colour, figure and material checks for surrounding regressions.
The first local figure run found hover change 0.00108 below the unchanged 0.0012
minimum; the stronger fill addresses the interaction rather than weakening its
threshold. Two initial dev-server browser attempts timed out during mounting;
record subsequent production-preview outcomes separately from these attempts.

Commands: `npm run check`, `npm run rooms:materials`, `npm run rooms:lighting`,
`npm run rooms:tones`, `npm run build`, `npm run figure -- pixel-still --url=…`,
`npm run rooms:colour -- --url=…`. Read actual command exits and final reports.
