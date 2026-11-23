#!/usr/bin/env bash
# Draws the library archive's baked figures with the art playbooks' kernel, in the site's own
# token palette, checks them, writes the 1x and 2x WebP the page loads into public/library/ and
# each plate's manifest into src/figures/plates/. Run from anywhere; needs Python 3.10+,
# numpy, Pillow and rsvg-convert. The site's CI never runs this: the plates are committed.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
pub="$here/../../public/library"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
cd "$here"
mkdir -p "$work/src" "$work/out"
python3 -m kernel.scenes "$work/src"
python3 checks/check_penwash.py "$work/src/shelf-unit-light.svg" "$work/src/shelf-unit-dark.svg" --tile-width 760
python3 checks/check_penwash.py "$work/src/table-light.svg" "$work/src/table-dark.svg"
python3 checks/check_graphite.py "$work/src/table-light.svg"
python3 checks/check_graphite.py "$work/src/table-dark.svg" --background "$(python3 -c "from kernel.tokens import palette; print(palette('dark')['ground'])")"
for theme in light dark; do
  bg="$(python3 -c "from kernel.tokens import palette; print(palette('$theme')['ground'])")"
  python3 -m kernel.render "$work/src/shelf-unit-$theme.svg" "$work/out" "shelf-$theme" --tile-width 760 --background "$bg"
  python3 -m kernel.render "$work/src/table-$theme.svg" "$work/out" "desk-$theme" --tile-width 1440 --background "$bg"
  python3 checks/check_render.py "$work/src/shelf-unit-$theme.svg" "$work/out" "shelf-$theme" --tile-width 760 --background "$bg"
  python3 checks/check_render.py "$work/src/table-$theme.svg" "$work/out" "desk-$theme" --tile-width 1440 --background "$bg"
  for f in box bookend books; do
    w="$(python3 -c "from kernel.scenes import FILLERS; print(FILLERS['library-$f'][1])")"
    python3 checks/check_penwash.py "$work/src/library-$f-light.svg" "$work/src/library-$f-dark.svg"
    python3 -m kernel.render "$work/src/library-$f-$theme.svg" "$work/out" "filler-$f-$theme" --tile-width "$w"
    python3 checks/check_render.py "$work/src/library-$f-$theme.svg" "$work/out" "filler-$f-$theme" --tile-width "$w" --background "$bg"
    for k in 1 2; do cp "$work/out/filler-$f-$theme@${k}x.webp" "$pub/filler-$f-$theme-${k}x.webp"; done
  done
  for plate in shelf desk; do
    for k in 1 2; do cp "$work/out/$plate-$theme@${k}x.webp" "$pub/$plate-$theme-${k}x.webp"; done
  done
done
python3 -m kernel.plate "$pub" "$here/../../src/figures/plates"
(cd "$here/../.." && npx prettier --write src/figures/plates/*.json > /dev/null)
echo "plates written to public/library/, manifests to src/figures/plates/"
