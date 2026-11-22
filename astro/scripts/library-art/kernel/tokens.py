"""The palette a baked figure is drawn in, read from the site's own token file.

Read this index; do not read the code under it.

    palette(theme)        -> {key: hex}   the colours for "light" or "dark", by kernel key
    digest()              -> str          sha256 of the raw declarations this kernel reads
    TOKENS                                kernel key -> CSS token name (the only colour source)
    css_path()            -> str          the token file: $PLATE_TOKENS, or the site's paper.css

Gotchas: only declarations of the form `--name: light-dark(#light, #dark);` in the file's first
:root block are read; a token written any other way is an error, never a guess. The digest is
over the raw text (`name=value` lines, sorted), so the site's plate audit can compute the same
digest in Node from the same file and fail a plate baked with values that have since changed.
"""
import hashlib
import os
import re

TOKENS = {
    "ground": "--pp-ground",
    "a": "--pp-art-a",
    "b": "--pp-art-b",
    "c": "--pp-art-c",
    "deep": "--pp-art-deep",
    "ink": "--pp-art-ink",
    "muted": "--pp-ink-muted",
    "signal": "--pp-signal",
    "paper": "--pp-art-paper",
    "shade": "--pp-art-shade",
    "hatch": "--pp-art-hatch",
    "hatch2": "--pp-art-hatch-deep",
    "outline": "--pp-art-outline",
    "flame": "--pp-art-flame",
}

_PAIR = re.compile(r"^light-dark\(\s*(#[0-9a-fA-F]{6})\s*,\s*(#[0-9a-fA-F]{6})\s*\)$")


def css_path():
    here = os.path.dirname(os.path.abspath(__file__))
    return os.environ.get("PLATE_TOKENS") or os.path.join(here, "..", "..", "..", "src", "styles", "tokens", "paper.css")


def _root_block(text):
    start = text.index(":root {")
    depth, i = 0, text.index("{", start)
    for j in range(i, len(text)):
        depth += {"{": 1, "}": -1}.get(text[j], 0)
        if depth == 0:
            return text[i + 1 : j]
    raise ValueError("unclosed :root block")


def _declarations():
    block = _root_block(open(css_path(), encoding="utf-8").read())
    block = re.sub(r"/\*.*?\*/", "", block, flags=re.S)
    return {m.group(1): m.group(2).strip() for m in re.finditer(r"(--[\w-]+)\s*:\s*([^;]+);", block)}


def raw():
    decl = _declarations()
    missing = [n for n in TOKENS.values() if n not in decl]
    if missing:
        raise KeyError(f"tokens missing from {css_path()}: {', '.join(missing)}")
    return {n: decl[n] for n in sorted(set(TOKENS.values()))}


def digest():
    lines = "\n".join(f"{n}={v}" for n, v in raw().items())
    return hashlib.sha256(lines.encode("utf-8")).hexdigest()


def palette(theme):
    values = raw()
    out = {}
    for key, name in TOKENS.items():
        m = _PAIR.match(values[name])
        if not m:
            raise ValueError(f"{name} is not light-dark(#hex, #hex): {values[name]}")
        out[key] = (m.group(1) if theme == "light" else m.group(2)).upper()
    return out
