---
title: "open-diagram: a diagram that fails its build when a line runs through a box"
date: 2026-11-28
summary: "open-diagram treats a diagram like code that must pass its checks, and names each layout problem instead of leaving it for a reviewer to spot."
---

Most diagram tools let you draw a mess and leave you to notice it, but open-diagram refuses to finish until the mess is gone.

## Diagrams with a build step

[open-diagram](https://github.com/lukendeasy/open-diagram) is a Python library for drawing architecture diagrams, such as a system map, a release pipeline or a stack of layers, from a short script. The problem it solves is old and dull. Boxes collide, lines cut through boxes they do not join, and labels land on top of things. A human reviewer catches some of it. An AI agent drawing the diagram usually catches none of it, because it never looks at the picture.

It is for engineers who keep diagrams beside their code, and for agents asked to draw them. Say a design doc needs a picture of a request moving through four services. An agent writes a dozen lines of Python, runs it, and gets back either an SVG and a PNG, or a list of named problems to fix first.

## How it works

You describe the picture in blocks. A panel is a box with a header and a list of items, a tile is an item that can carry a status such as planned or building, and groups gather panels into shaded areas. You place blocks relative to each other, to the right of this one or below that one, and then link them with lines that can be marked as planned or given a label.

The library then does three things in order. First it measures every label from the font's own spacing, so each box is sized to fit its words before anything is placed. Next it lays the blocks out and routes the lines. Last it checks the result. Two panels that overlap or sit closer than a minimum gap fail. A line that crosses a panel it does not join fails, unless you route it through a lane or mark it as allowed to pass behind. A label sitting on a box fails, and so does a line that leaves a box from the side facing away from its target. The build still writes the files, then raises an error listing every problem by name, for example that two named panels are only 9 pixels apart when the minimum is 16.

Text is drawn as shapes, so the SVG looks the same in a browser, a slide deck or a design tool. Diagrams can also be written as JSON or imported from Mermaid, a popular text format for diagrams.

## Getting it running

`pip install open-diagram` installs it with two dependencies, a font library and the MCP toolkit, which lets AI apps call it as a tool. It needs Python 3.10 or newer. PNG output needs Chrome, Chromium or Edge, while the SVG is written without a browser. It also ships a `check` command, a GitHub Action, an MCP server and a skill that maps each error to its fix.

## What state it is in

It is under the MIT licence, had about 430 stars on GitHub when I checked, and was last pushed three days earlier. The repo is ten days old and at version 0.6.2. It has about a hundred unit tests across layout, the MCP server, portability and cloud icons.

## Where it stops

It checks that the layout is clean, not that the diagram is true. Whether every service is shown and every line points the right way is still a reading job, as its own agent skill admits. Crossings can be waved through with a flag, and I did not see a check on how short a line may get.

## Where I stand

I already hold my own diagrams to written rules. Lines have a minimum length, and when they do not fit, the box grows rather than the line shrinking. A line keeps clear of boxes it does not join, crossings stay few and are drawn as bridges, and a label is never cut by a line or sat on a box. So on a first read this repo is close to how I think. It turns rules like these into checks that fail the build, which is where I want rules to live.

The first experiment would be to redraw one of my diagrams in it and run `open-diagram check`. If it catches a line through a box and a label on a box, by name, it earns a place. Then I would compare its error list with my own rules, line by line, and see which of mine it misses.

The idea worth stealing is the named error with the fix next to it. A message that says which two panels are too close, and what to change, is something an agent can act on without looking at the picture. What I would question is the escape hatch. A flag that lets a line pass behind is useful, but it is also how a crossing budget quietly stops meaning anything, so I would want those counted.

Verdict: study.

## Also on the radar

- [alesha-pro/inference-optimization-playbook](https://github.com/alesha-pro/inference-optimization-playbook), a ledger of tested speed-ups for big models on consumer GPUs. Study.
- [dangxingyu/megakernel-zoo](https://github.com/dangxingyu/megakernel-zoo), agent-written fused GPU kernels for decoding. Study.
- [thu-nics/uni3sim](https://github.com/thu-nics/uni3sim), a simulator for LLM serving at scale. Watch.
- [enwove/flyx](https://github.com/enwove/flyx), a single-binary local inference engine. Watch.
- [jakubkrehel/outtrue](https://github.com/jakubkrehel/outtrue), lint rules that keep Tailwind code on a design system. Skip.
