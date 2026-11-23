"""Writes each baked figure's manifest, the record the site registers it by.

Read this index; do not read the code under it.

    python3 -m kernel.plate PUBLIC_DIR PLATES_DIR   writes PLATES_DIR/<id>.json for every plate
    PLATES                                          id -> title, alt, style, file stem, public path

A manifest says what the plate is (id, title, alt, group, style, the playbooks that drew it),
where its images are per theme and scale, how big it is, where things stand on it (anchors(),
from the constants it is drawn with), and which tokens it was drawn in with their digest. The
site's plate audit reads it: a digest that no longer matches the token file fails as stale.
"""
import json
import os
import sys
from .scenes import anchors
from .tokens import TOKENS, digest

PLATES = {
    "library-wall": {
        "title": "Library wall unit",
        "alt": "One bay of a built-in library wall: a shelf with four levels between two panelled wall bays, each with a candle sconce and a crest.",
        "stem": "shelf",
    },
    "library-desk": {
        "title": "Library desk",
        "alt": "A reading desk below damask wallpaper with three framed pencil landscapes and two candle sconces.",
        "stem": "desk",
    },
}
SCALES = (1, 2)
WEB_PATH = "/library"


def manifest(pid, public_dir):
    meta = PLATES[pid]
    sources, sizes = {}, {}
    for theme in ("light", "dark"):
        sources[theme] = {}
        for k in SCALES:
            name = f"{meta['stem']}-{theme}-{k}x.webp"
            sources[theme][f"{k}x"] = f"{WEB_PATH}/{name}"
            sizes[f"{theme}-{k}x"] = os.path.getsize(os.path.join(public_dir, name))
    return {
        "schema": "plate/1",
        "id": pid,
        "title": meta["title"],
        "alt": meta["alt"],
        "group": "library",
        "style": "pen-and-wash",
        "playbooks": ["pen-and-wash", "graphite-pencil", "art-render"],
        "kernel": "scripts/library-art",
        "sources": sources,
        "bytes": sizes,
        "tokens": sorted(set(TOKENS.values())),
        "palette": digest(),
        "anchors": anchors()[pid],
    }


def main(public_dir, plates_dir):
    os.makedirs(plates_dir, exist_ok=True)
    for pid in PLATES:
        with open(os.path.join(plates_dir, f"{pid}.json"), "w", encoding="utf-8") as f:
            json.dump(manifest(pid, public_dir), f, indent=2)
            f.write("\n")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
