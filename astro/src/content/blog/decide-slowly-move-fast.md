---
title: "Decide slowly, then move fast"
excerpt: "Before you build is the cheapest window you will ever have. Lay everything out while being wrong costs an edit, then go. A Toyota idea, read through chip projects and agents."
category: thoughts
date: 2026-10-18
cover: workflow~7
readTime: "6 min"
tags: ["Planning", "Chip design", "Agents", "Process"]
---

| | |
| --- | --- |
| **What** | Why I spend the start of a project laying everything out, and what that buys later. |
| **Why** | Being wrong is cheap at the start and expensive at the end. Most firefighting is a decision that was made too fast. |
| **Who** | Anyone starting a project, a chip or a piece of software, alone or with agents. |
| **When** | Before the first line of RTL or code, and again whenever a big feature arrives. |
| **Where** | In the plan, the template you start from, and the logs you keep while you work. |

Toyota has a rule for this, and it's the thirteenth of the fourteen principles in *The Toyota Way*: make decisions slowly, by consensus, thoroughly considering all options; then implement them rapidly. I'd heard it before. I only understood it after a few projects where I did the opposite.

## The cheap window

Here is the idea in the words I first wrote it down in. Do the prototyping, do the analysis, and lay out everything you can think of: every thought counts, right or wrong. Lay out your workflows, your plans, your milestones and your system at the start. Before you build is the inexpensive window. As the project ramps up, the cost of being wrong goes up, and you end up in a firefighting cycle where every mistake costs more.

A kitchen already knows this. Before service, a cook sets out *mise en place*: every ingredient cut, measured and in its bowl, in the order it will be needed. It looks slow. It isn't. Once the pan is hot, a missing ingredient doesn't cost a minute of chopping; it costs the dish. The prep table is the cheap window. The hot pan is the project.

Chip design makes the curve very steep. A wrong line in the architecture spec costs an edit. The same mistake found in RTL costs a re-verification. Found after place and route, it costs a schedule slip. Found after tape-out, it costs a respin: months and a great deal of money, for a change that was one sentence at the start.

## Lay it all out, right or wrong

The point of laying everything out isn't to get it right first time. It's to put it where everyone can see it, while moving things around is free.

When the whole plan is on the page, people can say "this doesn't fit" or "this looks wrong" at a low stake. Everyone sees everything, so everyone feeds back. You cut what you don't need and add what you missed. In a chip project that page is the architecture exploration and the early floorplan: every block, interface, clock and power domain drawn before any RTL exists, so someone can point at a clash while fixing it still costs nothing.

"Right or wrong" matters. A half-formed idea that gets written down and killed in week one is a success. The same idea left unsaid comes back in month six, as a bug.

## Start from last time's blueprint

You rarely lay things out from nothing. The previous project is a blueprint: the flow, the checklists, the sign-off list. Start from it and do three things: cut what you don't need, change what is different, add what is new. Then feed those changes back, so the template learns how different projects approach the same step.

A derivative chip already works this way. It starts from the previous chip's flow, not a blank page. What I'd add is keeping the variations as named options of the same step, a different recipe for a different technology node or block type, instead of a copy of the whole flow that drifts on its own.

## Estimate from what actually happened

The same layout gives you a schedule. With data from a previous project you know its happy path, the critical path that set the end date, and its worst path. Add an uncertainty margin and scale for the size of the new project.

The catch is where that data comes from. A ticket tracker records what someone typed: status, owner, done. It doesn't record what happened: say, that synthesis took nine hours and failed twice before the run that's marked done. That gap is why estimates are off and blind spots appear. Activity logs, written by the machine as the work runs, close it. And reading a pile of logs used to be the expensive part. With AI it costs almost nothing.

I'll be honest about the limits, because they're real. One earlier project is one sample, and scale doesn't multiply evenly: twice the gates is not twice the verification. The estimate gets honest with several projects and with ranges, not with one number times a factor.

## Silence is not good news

Toyota's other idea that stuck with me is that a quiet line isn't a healthy line. Taiichi Ohno is often quoted as saying that having no problems is the biggest problem of all. Silence is the absence of reporting, not the absence of problems.

In a chip project, a block with no regression results isn't a passing block. It's an unknown. If the plan was laid out properly, you know every block that should be reporting, so you can see the ones that are quiet. Without the layout, a quiet block just looks finished. I've written more on this in [Unknown is not zero](/blog/unknown-is-not-zero).

## Where I didn't follow my own advice

The project I'm proudest of at work, a strict ledger that tracks a project from requirement to result, is also where I broke this rule. I built first and laid it out afterwards. I'm now backfilling the full map of what it does, node by node, which is the slow, expensive version of the work I skipped.

The second lesson from that is about scope. "Lay everything out" doesn't mean "build everything you laid out". Lay out wide and cheap; build narrow. The layout is a sketch you're meant to cut, and the first thing to build is the smallest demo that proves the core promise end to end. Breadth comes after the demo.

## Why this matters more with agents

Agents have made building fast. A prototype that took a week now takes an afternoon. So the expensive part of a project has moved: it's no longer typing the thing, it's knowing what the thing should be, and agreeing on it.

That makes the slow half of Toyota's rule more important, not less. An agent will happily build the wrong thing at full speed. The cheap window is still at the start, and it's now the only part of the project that agents can't rush for you. So decide slowly. Then let them move fast.
