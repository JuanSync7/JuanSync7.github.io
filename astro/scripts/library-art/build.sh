#!/usr/bin/env bash
# Draws the library archive's plates with the art playbooks' kernel, checks them, and writes the
# 1x and 2x WebP the page loads into public/library/. Run from anywhere; needs Python 3.10+,
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
python3 checks/check_graphite.py "$work/src/table-dark.svg" --background "#16191E"
for theme in light dark; do
  bg=$([ "$theme" = light ] && echo "#F3ECDF" || echo "#16191E")
  python3 -m kernel.render "$work/src/shelf-unit-$theme.svg" "$work/out" "shelf-$theme" --tile-width 760 --background "$bg"
  python3 -m kernel.render "$work/src/table-$theme.svg" "$work/out" "desk-$theme" --tile-width 1440 --background "$bg"
  python3 checks/check_render.py "$work/src/shelf-unit-$theme.svg" "$work/out" "shelf-$theme" --tile-width 760 --background "$bg"
  python3 checks/check_render.py "$work/src/table-$theme.svg" "$work/out" "desk-$theme" --tile-width 1440 --background "$bg"
  for plate in shelf desk; do
    for k in 1 2; do cp "$work/out/$plate-$theme@${k}x.webp" "$pub/$plate-$theme-${k}x.webp"; done
  done
done
echo "plates written to public/library/"
