---
title: "Decide slowly, then move fast"
excerpt: "Before you build is the cheapest window a project will ever have, and it's the one we rush."
category: thoughts
date: 2026-10-18
cover: zoom-dive~1
readTime: "6 min"
tags: ["Planning", "Chip design", "Agents", "Process"]
---

Most of the fires I've fought on a project were lit in its first week.

Not by anyone being careless. By someone, often me, deciding something quickly because it felt small at the time. A folder layout. The shape of a config file. Which team owns which check. None of it looked important on day three. By month three, each one was holding up something else, and changing it meant pulling half the project apart while it was still running.

For a long time I thought the answer was to get faster at fighting the fires. It isn't. The answer is to be slower at the start, which sounds like the wrong way round until you look at what a mistake costs at each point in a project.

In chip design that cost climbs very steeply. A wrong line in the architecture spec costs an edit. The same mistake found in RTL costs a re-verification. Found after place and route, it costs a schedule slip. Found after tape-out, it costs a respin: months of time and a great deal of money, for a change that was one sentence at the start. Software is gentler, but the curve has the same shape. Every week you wait, the same mistake gets dearer to fix.

So why do we rush the one part of the project where being wrong is cheap?

Toyota has a rule for this, and it's become the one I come back to most. It's the thirteenth of the fourteen principles in *The Toyota Way*: make decisions slowly, by consensus, thoroughly considering all options; then implement them rapidly. Or, the way I say it to myself: decide slowly, then move fast.

A kitchen already lives by it. Before service, a cook sets out *mise en place*: every ingredient cut, measured and in its bowl, in the order it will be needed. To someone watching, it looks like the slow way to cook. It isn't. Once the pan is hot, a missing ingredient doesn't cost a minute of chopping; it costs the dish. The prep table is the cheap window. The hot pan is the project.

## Lay it all out, right or wrong

What does the prep table look like for a project? For me it means doing the prototyping and the analysis, and then laying out everything I can think of: the workflows, the plans, the milestones, the whole system, right or wrong. Especially the wrong parts.

When everything is on the page, anyone can point at it and say "this doesn't fit" while moving it still costs nothing. Everyone sees everything, so everyone feeds back. You cut what you don't need, and you add what you missed. A half-formed idea that gets written down and killed in week one is a success. The same idea left unsaid comes back in month six as a bug. In a chip project, that page is the architecture exploration and the early floorplan: every block, interface, clock and power domain drawn before any RTL exists.

You almost never start that page from nothing, either. The last project is a blueprint. Its flow, its checklists and its sign-off list are already there, and you only need to cut what doesn't apply, change what's different and add what's new. If you keep feeding those changes back, as named variants of the same step rather than copies of the whole flow, the template starts to remember how different projects handle the same thing, and the next start is faster still.

## Estimate from what actually happened

The same page gives you a schedule, if you kept the right records. From a previous project you can read off its happy path, the critical path that set the end date, and its worst path. Add a margin for uncertainty, scale for the size of the new project, and you have an estimate built on something real.

The catch is where those records come from. A ticket tracker remembers what people typed: owner, status, done. It doesn't remember what happened, like the synthesis run that took nine hours and failed twice before the one marked done. Activity logs do, because the machine writes them while the work runs. And reading a mountain of logs, which used to be the expensive part, now costs almost nothing with AI.

One earlier project is still only one sample, and twice the gates is never simply twice the verification, so I'd trust a range from several projects over one number times a factor. But a range from real logs beats a guess from tickets every time.

There's a second Toyota idea hiding in this. Taiichi Ohno is often quoted as saying that having no problems is the biggest problem of all. A quiet project isn't a healthy project; it might just be a project that isn't reporting. When the plan is laid out properly, you know every block that should be sending results, so you can see the ones that have gone quiet. Without the plan, a quiet block just looks finished.

## Where I broke my own rule

I know all of this well. I still didn't do it on the project I'm proudest of.

At work I'm building a strict ledger that follows a project from its requirements to its results, so nothing gets called done without evidence. It's a system whose whole job is to make a project lay itself out properly. And I built it the other way round. I started building, it grew, and only later did I sit down to map out everything it does, node by node. I'm still backfilling that map now. It's the slow, expensive version of the week I skipped at the start, and I'm paying for it in exactly the way the curve says I would.

It taught me the half of the rule that I'd been missing. Laying everything out doesn't mean building everything you laid out. The layout is wide and cheap on purpose: it's a sketch you're meant to cut. What you build first should be narrow, the smallest demo that proves the core promise end to end. Breadth comes after the demo.

## Why agents make the slow half worth more

Then the speed of the work changed under me. With agents, a prototype that took a week takes an afternoon. Typing the thing is no longer the slow part. Knowing what the thing should be, and getting everyone to agree on it, is. An agent will happily build the wrong idea at full speed, all night, and hand it to you in the morning with a cheerful summary.

That makes the slow half of Toyota's rule worth more than it used to be, not less. The cheap window is still at the start, and it's now the one part of the project that nobody can rush for you.

So I've gone back to the kitchen. Everything cut, measured and laid out before the heat goes on. Then turn it up, and move fast.
