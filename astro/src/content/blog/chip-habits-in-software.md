---
title: "What chip design taught me about software, and where it lies"
excerpt: "Typed ports, stateless logic and constrained random followed me from RTL into software and agents. Most of them help. Five of them quietly mislead."
category: thoughts
date: 2026-10-18
cover: pixel-fabric~12
readTime: "6 min"
tags: ["Chip design", "SystemVerilog", "Software", "Agents"]
---

| | |
| --- | --- |
| **What** | The habits I carried from RTL design into software, and the places they go wrong. |
| **Why** | Habits you don't name, you can't question. Most of these help me; a few have bitten. |
| **Who** | Hardware engineers moving into software, and software people curious how we think. |
| **When** | Whenever I start a new system, which is most weeks now. |
| **Where** | Python services, TypeScript frontends, and the agents I build to run them. |

I trained as an ASIC designer. I spent my first years writing SystemVerilog, running lint, and staring at waveforms. These days most of what I build is software and AI tooling, and I mostly direct agents rather than type code. But I still think like a chip designer. When I look at a system, I draw the block diagram first and the code second.

That habit has served me well. It's also worth being honest about, because a habit you never name is a habit you never question. So here are the ones I brought over, and the five places they lie.

## What came with me

**Modules with typed ports.** In RTL, a module declares every input and output, with its width, before any logic runs. You can see how two blocks connect without simulating anything. Type hints are the software version of a port declaration: the interface is explicit and checkable before the code runs. I don't accept untyped Python from my agents, for the same reason I'd never leave a port's width implicit.

**Stateless logic is the easy logic.** Combinational logic has no memory, so you check it with a truth table. State lives in flip-flops, kept in its own block, and that's where the bugs hide. I write software the same way: pure functions in the middle, state pushed to the edges, where I can watch it.

**If you can't draw it, you don't understand it.** A chip is a set of blocks joined by wires, and the floorplan mirrors the block diagram. I want code laid out the same way, so a reader knows where to look without searching. When I'm stuck between two designs, I pick the one that's easier to draw.

**Constrained random, plus directed corners.** Verification throws random but legal stimulus at a design to find what nobody thought of, then adds directed tests for the corners everyone knows about. I test software that way too.

**Enforce the standard one level up.** Teams that write RTL their own way pay for it at integration. A shared lint deck that runs on every block fixes what review keeps missing, and nobody has to remember the rules. I build agents the same way: the rule lives in a check the agent runs, not in a sentence it might forget.

## Where they lie

Here are the five places those habits mislead, with what I do instead.

### 1. Chaining by delay

In a simulator, time is exact. "Wait ten nanoseconds, then check the output" is a perfectly good test. In software, a `sleep` before the next step is a flaky test: it passes on a quiet machine and fails on a busy one, and the failure looks random.

Chain on an event instead: a file existing, a port answering, a message arriving. If you must wait, wait for a condition with a timeout, not for a fixed amount of time.

### 2. Random inputs need a golden model

Constrained random works in verification because a reference model knows the right answer for every input. Throw a million random packets at a design and the model says which outputs were wrong.

Most software has no golden model, and an LLM's output certainly doesn't. Random inputs alone tell you nothing if nothing knows the answer. So you build one: an eval set with known answers, a judge, or, where it's cheap, a deliberately simple second implementation that shares no code with the first. Where none of those exist, relations still work. `A AND B` must always be inside `A`, whatever `A` is.

### 3. Ports freeze at tape-out; software interfaces don't

This is the one that took me longest to feel.

A chip's interface is like a printed book. Once it's printed, the text is fixed, so you proofread it to death beforehand and live with whatever got through. A website is different: you fix a typo the moment you see it, and your links have to keep working while you do. Software interfaces are websites. They keep changing after release, so they need a version, and both sides have to cope with the old shape for a while.

When I designed software interfaces as if they'd never change, I got brittle systems that broke all at once. Now the version goes in from the start.

### 4. Everything runs at once

In hardware, every `always` block runs in parallel, all the time, reacting whenever its inputs change. It's natural, and the tools are built to reason about it.

Software that copies that shape, with many components all reacting to every change, gets very hard to follow. Who fired first? Which update won? Prefer one clear order of steps, and add concurrency only where it pays for itself, with the order of events written down.

### 5. Design everything up front, because tape-out is final

A respin costs months, so chip teams design very carefully before committing. Carry that into software whole and you over-design: too much planning before the first working slice, for a thing that's cheap to change.

This sounds like it contradicts [Decide slowly, then move fast](/blog/decide-slowly-move-fast). It doesn't, once you split the decisions by how expensive they are to undo. Some decisions are like tape-out even in software: the shape of data you've already written to disk, an interface other teams depend on, anything you'd need a migration to change. Decide those slowly. Everything behind them, the components, libraries and internals, is cheap to swap, and I swap them often. A design I can describe without naming a single library is a design where swapping one costs little.

## Why the good habits matter more now

Here's the part I didn't expect. Working with agents has made the chip habits more valuable, not less.

Agents do best with work that has a clear edge: this module, these inputs, these outputs, this test. Typed ports and block boundaries are exactly what make a job splittable between agents. And between agents, prose is a poor wire. Every hand-off in plain language loses a little meaning. A typed contract, the software port declaration again, doesn't.

So I keep the block diagram, the ports and the lint deck. I've dropped the delays, the frozen interfaces and the urge to design all of it before any of it runs. That trade has worked for me so far.
