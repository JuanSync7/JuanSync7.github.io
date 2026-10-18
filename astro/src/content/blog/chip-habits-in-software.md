---
title: "What chip design taught me about software, and where it lies"
excerpt: "The habits I brought from chip design mostly help, and the few that lie look exactly like the ones that don't."
category: thoughts
date: 2026-10-18
cover: pixel-fabric~12
readTime: "6 min"
tags: ["Chip design", "SystemVerilog", "Software", "Agents"]
---

Whatever I'm building, I still start the same way. Before any code, before any prompt to an agent, I draw boxes and the wires between them. Inputs on the left, outputs on the right, state in its own corner. It's how I was taught to design chips, and I've never stopped.

I trained as an ASIC designer. My first years were SystemVerilog, lint runs and waveforms. These days most of what I build is software and AI tooling, and I mostly direct agents rather than type code myself. The work changed. The way I think didn't, and for a while I didn't notice. A habit you never name is a habit you never question, so this is me naming them.

## What came with me

Most of what I brought over has served me well.

**Ports first.** In RTL, a module declares every input and output, with its width, before a single line of logic. You can see how two blocks connect without running anything. When I moved to Python, type hints felt like coming home: they're port declarations for functions, an interface you can check before the code runs. I don't accept untyped Python from my agents, for the same reason I'd never leave a port's width to chance.

**State in its own corner.** In hardware, logic with no memory is the easy part to check; you can write out its truth table. The bugs live in the flip-flops, so you keep them in their own block where you can watch them. I build software the same way: pure functions in the middle, state pushed out to the edges.

**If you can't draw it, you don't understand it.** A chip's floorplan mirrors its block diagram, so you know where everything is without searching. I want code laid out like that, and when I can't choose between two designs, I pick the one that's easier to draw.

**Random inputs, plus the corners.** Verification throws random but legal inputs at a design to find what nobody thought of, then adds directed tests for the corners everyone knows about. I still test that way.

**The standard lives one level up.** Teams that each write RTL their own way pay for it at integration, so you put the standard in a shared lint deck that runs on every block, and nobody has to remember the rules. I build agents the same way. The rule lives in a check the agent runs, not in a sentence it might forget.

So most of it carries over. But some of it lies, and it lies in ways that look exactly like good habits.

## Where it lies

The first one I felt was time. In a simulator, time is exact. "Wait ten nanoseconds, then check the output" is a perfectly good test, and my test setups kept that shape for longer than I'd like to admit: start this, wait a bit, check that. They passed on my machine. Then they ran on a busy shared compute farm and started failing at random, and the failures looked like bugs in the code. They weren't. They were bugs in my sense of time. A `sleep` before the next step is a test that passes on a quiet day. Now I chain on events instead: a file appearing, a port answering, a message arriving, and when I must wait, I wait for a condition, with a limit.

The second was randomness. Constrained random works in verification because a reference model knows the right answer for every input. Throw a million packets at a design, and the model tells you which outputs were wrong. Most software has no such model, and an LLM's output certainly doesn't. Random inputs on their own tell you nothing if nothing knows the answer, so you have to build the answer key yourself: an eval set with known answers, a judge, or a deliberately simple second version that shares no code with the first. Where even that's too much, relations still work: whatever `A` is, `A AND B` must always sit inside `A`.

The third took me longest to feel. A chip's interface is like a printed book. Once it's printed, the text is fixed, so you proofread it to death and live with whatever got through. Software is a website. You fix a typo the moment you see it, and the links have to keep working while you do. Design a software interface as if it's been printed, and it breaks all at once the first time anything changes. So the version goes in from the start, and both sides learn to cope with the old shape for a while.

And there's a quieter one about concurrency. In hardware, every block runs at once, all the time, reacting to its inputs. Software that copies that shape, with everything reacting to everything, becomes very hard to follow. Who fired first? Which update won? I now prefer one clear order of steps, and concurrency only where it pays for itself.

## Ink or pencil

There's one habit I've had to argue with myself about. Chip teams design everything carefully up front, because tape-out is final and a respin costs months. Carry that into software whole, and you over-design: weeks of planning before the first working slice, for something that's cheap to change. Yet I'm also the person who keeps saying to decide slowly before you build.

The way out, for me, is to sort decisions by how hard they are to undo. Some software decisions really are like tape-out: the shape of data you've already written to disk, an interface other teams depend on, anything you'd need a migration to change. Those I decide slowly. Everything behind them, the libraries and the internals, is cheap to swap, and I swap them often. If I can describe a design without naming a single library, swapping one later costs very little.

## What agents changed

The part I didn't expect is what happened when agents arrived. I thought they'd make my hardware habits feel old. They did the opposite.

Agents do their best work on a job with a clear edge: this module, these inputs, these outputs, this test. Typed ports and block boundaries are exactly what make work splittable between agents. And between agents, prose is a poor wire. Every hand-off in plain language loses a little meaning. A typed contract, the port declaration again, loses none.

So I still start with the boxes and the wires. I've just learned which lines on that drawing are printed in ink and which are written in pencil.
