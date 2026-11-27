---
title: "SiliconForge: a chip design agent that the tools are allowed to overrule"
date: 2026-11-27
summary: "SiliconForge lets a model propose RTL and lets formal proof, equivalence checking and layout decide, and it publishes its null results."
---

The rarest thing in an AI chip design repo is a table that says the clever part did not help, and SiliconForge has several.

## A model that proposes and tools that decide

[SiliconForge](https://github.com/PundarikakshNTripathi/silicon-forge) is an open toolkit for digital chip design that does two jobs. It takes RTL you wrote, the hardware description that becomes a chip's logic, and runs it through a free open-source flow to a finished layout, with no model involved. And it lets a language model propose RTL, then refuses to believe it until formal proof, equivalence checking and layout all agree. The problem it exists to solve is that a model writes Verilog that looks right far more often than it writes Verilog that is right.

It is for anyone designing on open process kits, the free design libraries for real manufacturing processes such as SkyWater's 130 nm. A concrete case is a small counter or a UART block. You write a short spec, the model proposes RTL, a formal tool finds an input sequence that breaks it, and only the failing piece of logic goes back to the model, with the waveform around the failing cycle. The loop ends when the proof holds, not when the model sounds sure.

## How a design moves through it

Every stage is a gate, and every gate is a tool verdict. First a contract fixes the ports. Then come guardrails, which are cheap pattern checks, a linter and allowlists of the cells and flow settings a design may use. Then formal verification runs bounded model checking, which tries every input for a fixed number of cycles, plus full proofs and cover checks. Then Yosys, an open synthesis tool, turns the RTL into gates and proves the gates do the same thing as the RTL. Last, OpenROAD places and routes the design and reports timing, area and rule checks across process corners.

Two habits run through the whole project. A gate is pass, fail or not reported, and a missing number is never a pass. And every result says what produced it. A solid stamp means a real tool ran, and a hatched outline means a stand-in did.

## Getting it running

It installs as a Python package from the repo, and a simulated backend runs the bundled examples with no EDA tools at all. Real results need the open tools, which the docs say take about 15 minutes to set up without root, natively on Linux or through WSL2 on Windows. A model can be local, on a GPU, or a cloud provider with a key.

## What state it is in

It is under the AGPL licence, with a commercial licence offered for closed or hosted use. It had five stars on GitHub when I checked, the repo was created a week ago, and it is one person's work. It has CI and about eighty test files.

What sets it apart is the results section. Every number names its source file. It reports that a repair loop made more answers compile but not more of them correct, that retrieved guidance gave no gain it could tell from zero, and that a Gaussian-process optimiser did not beat random search. On a hidden-test benchmark of 40 tasks, giving a model a Yosys check as a tool did not beat a single reply. One run that scored 20 out of 20 was thrown away because the agent had read the answer file.

## Where it stops

The pipeline results are four designs, one run each. There is no SRAM or hierarchical macro support. The clock-domain crossing check is a heuristic on the text, not signoff, and the guardrails match patterns rather than parse SystemVerilog. The Tiny Tapeout path has not been run locally.

## Where I stand

On a first read this is built the way I think AI should be used in hardware. I trained as an ASIC designer, correctness is the foundation for me, and I want agents doing bounded steps inside a mostly deterministic flow. Here the model only proposes, and Yosys, the formal tools and OpenROAD decide.

The first experiment I would run uses no model. I would put one small block of my own through the plain flow on sky130 and check two things. Does the equivalence proof hold, and does the report really mark a missing metric as not reported rather than passed? If both hold, the scaffold is trustworthy, whatever the model does inside it.

The idea worth stealing is the evidence stamp. Labelling every result with whether a real tool or a stand-in produced it is cheap, and it stops a demo being read as a measurement. What I would question is the scope. A cockpit, a desktop app, an agent benchmark and fine-tuning in one young repo is a lot for one maintainer, so I would watch whether the core flow stays this careful.

Verdict: study.

## Also on the radar

- [xyjoey/Veri-Sure](https://github.com/xyjoey/Veri-Sure), research agents that generate RTL and check it with simulation and formal tools. Study, licence unconfirmed.
- [stable-lab/Pro-V](https://github.com/stable-lab/Pro-V), research agents that write testbenches to verify RTL. Study, no licence.
- [DebarghaG/formalkit](https://github.com/DebarghaG/formalkit), one interface from models to many formal tools. Study.
- [jemkox/agent-riscv](https://github.com/jemkox/agent-riscv), a RISC-V CPU said to be designed by a local agent. Watch.
- [SiliCAD/DV_MCP](https://github.com/SiliCAD/DV_MCP), an MCP server into remote EDA clusters. Watch, review carefully.
- [Promise-HIT/digital-ic-design-verification-skills](https://github.com/Promise-HIT/digital-ic-design-verification-skills), agent skills for RTL and UVM work. Watch.
