---
title: "How Inference Chips Are Built"
summary: "Why GPUs are inefficient for LLM inference, how ASICs go from RTL to silicon, and what Cerebras, Fractile, Groq, Etched, and Tenstorrent are doing differently to overcome the memory wall."
eyebrow: "Chip design deep-dive"
tracker: "inference-silicon"
date: 2026-06-16
---

Why GPUs are inefficient for LLM inference, how ASICs go from RTL to silicon, and what Cerebras, Fractile, Groq, Etched, and Tenstorrent are doing differently to overcome the memory wall. A few numbers frame the whole story:

- **~70%** of inference power goes to data movement, not compute.
- **21 PB/s** — Cerebras WSE-3 on-chip bandwidth.
- **$50–200M** — NRE cost for a frontier ASIC at 3–5 nm.
- **100×** — Fractile's claimed speedup over GPU inference.

## The memory wall — why moving data kills inference

The core bottleneck in LLM inference isn't compute — it's shuttling billions of weight bytes from memory to arithmetic units on **every single token generated**.

When a GPU generates one token, it must load the **entire model's weight matrices** from HBM into the compute cores. For a 70B-parameter model in FP16, that is ~140 GB of data — fetched every token, at up to 3.35 TB/s on an H100. The GPU's tensor cores can do arithmetic far faster than HBM can deliver the data to feed them. You are *memory-bound*, not compute-bound.

```
Arithmetic Intensity = FLOPs ÷ bytes accessed
Ridge point = Peak TFLOPS ÷ Peak BW (TB/s)
LLM decode sits far LEFT of this ridge → memory bound
```

- **H100 ridge point:** 989 TFLOPS ÷ 3.35 TB/s = ~295 FLOPs/byte. Decode has ~2 FLOPs/byte. 150× below the ridge.
- **B200 ridge point:** 2,250 TFLOPS (BF16) ÷ 8.0 TB/s = ~281 FLOPs/byte. Same problem, different numbers.
- **The fix:** raise arithmetic intensity (batching), reduce bytes-accessed (quantisation), or eliminate off-chip hops entirely (ASIC on-chip SRAM).

> Diagram: Every decode token requires a full sweep of all model weights through HBM. The GPU compute sits idle waiting for data — adding FLOPs doesn't help.

The decode path runs: generate 1 token (autoregressive decode) → load ALL weight matrices from HBM (140 GB for 70B FP16) → hit the H100 HBM bandwidth ceiling of 3.35 TB/s → matrix-vector multiply (tiny FLOPs, enormous bytes) → GPU tensor cores >98% idle, waiting for data → 1 token emitted. Core insight: adding more CUDA cores does NOT help. The three fixes branch from here — Fix A (Batching): 1 weight read serves B tokens → intensity × B; Fix B (Quantisation): FP4 halves bytes → 2× effective BW; Fix C (On-chip SRAM, ASIC): weights never leave the chip.

### Why batching helps

Batch B requests together: one weight read now serves B tokens simultaneously. Arithmetic intensity rises ~B×, dragging decode toward the compute-bound regime. Continuous batching (vLLM, SGLang) is the single biggest throughput win on GPUs — and the reason ASICs must also support it.

### Why ASICs win

On-chip SRAM sits nanometres from compute units with 1000× higher bandwidth than HBM. Cerebras WSE-3 delivers 21 PB/s on-chip vs 3.35 TB/s HBM on an H100 — a 6,250× bandwidth advantage. Weights live on-chip permanently; the memory wall does not exist.

## How a GPU handles inference — and why it's wasteful

GPUs were designed for highly parallel, compute-intensive workloads — graphics rendering, then deep learning training. LLM autoregressive inference is neither.

An H100 has 528 Streaming Multiprocessors (SMs), each with 128 CUDA cores — 67,584 cores total. They execute via **SIMT** (Single Instruction, Multiple Threads): one instruction fans out to many threads in parallel. For training matrix multiplications across a batch of thousands of examples, this is excellent. For generating one token per decode step, you are running a handful of threads on silicon built for tens of thousands.

> Diagram: SIMT (GPU) vs dataflow (LPU): the GPU decides at runtime; the LPU compiler decides everything statically. The result is deterministic latency and zero stalls on the LPU.

The contrast, side by side:

- **GPU — SIMT model:** runtime scheduler decides each cycle what runs; 67,584 CUDA cores, most idle during decode; cache hierarchy with frequent HBM misses; non-deterministic latency, variable per request.
- **Groq LPU — dataflow model:** compiler schedules everything at compile time; all compute units always busy, no idle cores; ~230 MB on-chip SRAM, data always present; deterministic latency, same every invocation.

### The GPU's real moat: software, not silicon

CUDA, PyTorch, vLLM, SGLang, TensorRT-LLM — a decade of optimisation that no ASIC startup can replicate overnight. Any challenger must either build an equivalent stack (years of work) or offer a cloud API that hides the software problem entirely. This is why Cerebras, Groq, and SambaNova all lead with managed cloud services, not bare silicon.

## How inference ASICs are designed — from idea to silicon

Building a custom chip is a multi-year, $50M–$200M endeavour. Here is the pipeline every inference ASIC startup has to run before shipping a single chip.

1. **Architecture Definition** — Decide memory hierarchy, compute paradigm (systolic, dataflow, in-memory), and target workloads. Months of simulation in Python/MATLAB before any RTL is written.
2. **RTL Design** — Register Transfer Level code (Verilog / SystemVerilog / Chisel) describes the chip logic cycle-by-cycle. The architecture becomes a formal hardware description.
3. **Verification (DV)** — Simulation and formal verification against a golden spec. Design Verification consumes ~50% of total engineering effort. Bugs here cost weeks; post-tapeout bugs cost $20M+.
4. **Synthesis** — EDA tools (Synopsys Design Compiler, Cadence Genus) translate RTL into a gate-level netlist from the foundry's standard cell library at the target process node.
5. **Place & Route** — Physical layout: every transistor, wire, via placed on the die. Timing closure ensures signals propagate within one clock cycle. Takes weeks on large EDA server clusters.
6. **DRC / LVS / Sign-off** — Design Rule Check verifies geometries meet fab rules. Layout vs Schematic checks layout matches netlist. Power, timing, and signal integrity sign-off required.
7. **Tape-out** — Final GDSII file sent to the foundry (TSMC, Samsung). Mask set costs $5M–$20M at 3–5 nm. Point of no return — any bug found after this costs a full re-spin.
8. **Fab, Package & Test** — 12–18 months lead time at TSMC. Wafer-level test, singulation, packaging (OSAT), final system test. First silicon characterisation and bring-up begins.

> Diagram: The full ASIC pipeline: architecture → RTL → verification → synthesis → place & route → sign-off → tape-out → fab → test. Every stage compounds risk; tape-out is the $20M point of no return.

### NRE cost reality

Non-Recurring Engineering for a frontier ASIC at 3–5 nm — including EDA tool licences ($5M+/year), mask sets ($5–20M per tapeout), engineering staff (~50–200 engineers × 2–3 years), and validation — runs $50–200M before the first chip ships. This is why Fractile needed $220M before having a product.

### Foundry concentration risk

TSMC (Taiwan) produces virtually all leading-edge inference chips: Cerebras WSE-3 (5 nm), Groq 3 (~4 nm), Etched Sohu (3 nm), Fractile (likely 3 nm). TSMC's process nodes are licensed to no one else at the frontier — creating the geopolitical risk driving UK, EU, and US domestic semiconductor investment.

## Five architectural bets against the memory wall

Every inference ASIC company is attacking the memory wall from a different angle. Here is the taxonomy.

> Diagram: Six different architectural responses to the same root problem. Each sacrifices something different — flexibility, manufacturability, model capacity, or software maturity — to close the gap.

The memory wall (weights too far from compute — every decode token pays the HBM tax) spawns six responses: Wafer-Scale (eliminate chip boundaries entirely — Cerebras); Dataflow (compile away the runtime scheduler — Groq, SambaNova); SRAM Memory-Compute Fusion (fuse storage and ALUs on the same die — Fractile); Digital In-Memory Compute (compute inside the DRAM cell array — d-Matrix); Fixed-Function Silicon (hardwire the transformer math permanently — Etched); RISC-V Mesh (open programmable tiles with local SRAM — Tenstorrent).

### Eliminate chip boundaries

*Wafer-Scale · Cerebras WSE-3.* The full 300 mm silicon wafer becomes one chip — 46,225 mm², 4 trillion transistors. No PCB traces, no HBM stacks. 44 GB of SRAM sits on-die with 21 PB/s bandwidth. Weights are always local to compute. Cost: manufacturing yield is brutal and the chip requires a full CS-3 system, not a PCIe card.

### Replace the scheduler with a compiler

*Dataflow / LPU · Groq, SambaNova.* Instead of a runtime scheduler (GPU's SIMT), a dataflow processor compiles all scheduling statically. Data flows through compute units in a fixed pipeline — no stalls, no cache misses, deterministic latency. Hundreds of MB of on-chip SRAM stores weights close to the pipeline, permanently. SambaNova's RDU adds reconfigurability: the dataflow graph reloads per-model.

### Fuse memory and compute on the same die

*SRAM Memory-Compute Fusion · Fractile.* SRAM arrays and MAC units sit side-by-side on the die, with no bus between them. Data never moves — compute happens where weights live. Eliminates the off-chip memory bottleneck at the physics level. The constraint: SRAM is ~50× more expensive per bit than DRAM, so die area is enormous and model capacity is limited.

### Compute inside the DRAM cells

*Digital In-Memory Compute · d-Matrix.* Logic gates placed directly inside the DRAM die — MAC operations execute in-situ within the memory array. Weights are never fetched to a separate compute unit. DRAM density gives 128 GB capacity (vs SRAM's high cost per bit), making this practical for large models that would not fit in an SRAM-only design.

### Hardwire the transformer into silicon

*Fixed-Function Silicon · Etched Sohu.* The transformer IS the chip. Attention heads, MLP layers, and layer normalisation are physical circuits — no instruction fetch, no scheduling, no general-purpose pipeline. The claimed 20× throughput advantage over GPU baselines is physically plausible. The catch: if you run anything other than a standard transformer (SSMs, MoE variants), the chip is a paperweight.

### Open, programmable compute tiles

*RISC-V Mesh · Tenstorrent Blackhole.* Each Tensix tile is a self-contained RISC-V processor with local SRAM and dedicated matrix units, connected via a 2D mesh NoC. Data moves short distances within the mesh. TT-Metal SDK is fully open-source; Tenstorrent licenses the IP so third parties can build derivative chips. Jim Keller's bet on open hardware commoditising AI compute.

## The companies — who's building inference silicon in 2026

Eleven companies. Six architectural bets. One common enemy: the memory wall. The full company profile for each — what they're doing, why they think it wins, and what the risks are.

### NVIDIA

*GPU · GA.* Product line: H100 SXM5 · B200 / GB200 NVL72. The incumbent — CUDA moat and generational hardware dominance. Founded 1993, Santa Clara, CA, market cap ~$3.5T.

NVIDIA built the AI compute stack from scratch. The H100 SXM5 remains the default production chip for almost all AI inference — not because GPUs are optimal for the task, but because 20+ years of CUDA investment means every framework, library, and engineer defaults to NVIDIA silicon. The B200 "Blackwell" generation pushes HBM3e bandwidth to 8 TB/s and ships in NVL72 rack systems (72 GPUs, 13.8 TB total memory) to hyperscalers.

In December 2025, NVIDIA acquired Groq for $20B — absorbing the LPU dataflow architecture and 1M+ GroqCloud developers into the NVIDIA NIM ecosystem. Groq 3 debuted at GTC 2026 as a "NIM Accelerator", giving NVIDIA a sub-millisecond latency offering alongside its GPU throughput story.

> **The bet:** Continuous generational HBM bandwidth improvement (3.35 → 8.0 → ~15+ TB/s next gen) + CUDA software lock-in makes the memory wall "manageable" without requiring a new paradigm. Acquisitions neutralise the best challengers.

Key numbers:

- **3.35 TB/s** — H100 HBM3 bandwidth
- **8.0 TB/s** — B200 HBM3e bandwidth
- **4,500 TFLOPS** — B200 FP4 peak
- **$20B** — Groq acquisition (Dec 2025)

**Strengths**

- Total ecosystem dominance — CUDA, PyTorch, vLLM, TensorRT-LLM
- Same hardware for training and inference
- TSMC manufacturing scale and priority access
- Acquisitions absorb top challengers (Groq $20B)

**Risks**

- Inference-specific ASICs erode efficiency margin at scale
- US export controls cut off Chinese market
- Antitrust scrutiny over CUDA bundling practices

Latest moves:

- B200 / NVL72 rack systems shipping to hyperscalers (2026)
- Groq acquired for $20B (Dec 2025); Groq 3 LPU at GTC 2026
- Rubin (R100) architecture in development for 2027

[nvidia.com](https://www.nvidia.com/en-us/ai-data-center/)

### AMD

*GPU · GA.* Product line: MI325X (GA) · MI350X (late 2026). The GPU challenger — memory capacity moat and maturing ROCm ecosystem. Founded 1969, Santa Clara, CA, revenue ~$25B.

AMD is the only credible GPU alternative to NVIDIA for AI inference. The MI325X offers 288 GB HBM3e — the largest capacity of any GPU — at 5.3 TB/s, making it the chip of choice when memory capacity matters more than raw throughput (very large models, long-context workloads). ROCm 6.x now has production-grade PyTorch and vLLM support, closing significant gaps with CUDA.

AMD's strategy is competing where NVIDIA is weakest: the B200's 192 GB HBM falls short for 70B+ models at high batch sizes; the MI325X's 288 GB fills that gap. The MI350X on TSMC 3nm is expected late 2026, targeting 6+ TB/s bandwidth.

> **The bet:** Win the memory-capacity axis where NVIDIA's B200 falls short + ROCm ecosystem maturation → a "good enough" CUDA alternative for inference-only deployments where VRAM capacity is the binding constraint.

Key numbers:

- **5.3 TB/s** — MI325X HBM3e BW
- **288 GB** — HBM capacity (GPU record)
- **1,307 TFLOPS** — MI325X FP16 peak

**Strengths**

- Memory capacity leader — 288 GB vs B200's 192 GB
- ROCm 6.x production-grade for inference (vLLM, SGLang)
- EPYC CPU synergy for rack-level deployments

**Risks**

- CUDA software gravity — engineers still default to NVIDIA
- ROCm operator coverage gaps remain for some model ops
- Training workload mindshare heavily NVIDIA-dominated

Latest moves:

- MI350X on TSMC 3nm — expected late 2026
- ROCm gaining ground; vLLM and SGLang now production-grade on ROCm
- AMD-powered nodes appearing in select hyperscaler inference clusters

[amd.com](https://www.amd.com/en/products/accelerators/instinct.html)

### Cerebras

*Wafer · GA.* Product line: WSE-3 (CS-3 system) · Condor Galaxy clusters. Wafer-scale — eliminate the chip boundary and the memory wall simultaneously. Founded 2016, Sunnyvale, CA, IPO CBRS (late 2024), ~$750M raised.

Cerebras took the most radical approach to the memory wall: make the entire 300mm silicon wafer one chip. The WSE-3 is 46,225 mm² — 57× larger than an H100 (815 mm²). With 44 GB of on-chip SRAM and 21 PB/s bandwidth, transformer weights live permanently on chip with sub-nanosecond access. The memory wall does not exist on this architecture.

The CS-3 system houses the WSE-3 in a water-cooled unit (~23 kW) and connects to external weight-streaming servers for model swap. Condor Galaxy clusters (9–54 CS-3 systems) are deployed with Abu Dhabi's G42, University of Texas, and others. The company completed its IPO (CBRS) in late 2024.

> **The bet:** Wafer-scale integration physically eliminates the HBM/bandwidth bottleneck. 21 PB/s on-chip is 6,250× H100's HBM3 bandwidth. Models that are memory-bound on GPUs run at full arithmetic throughput on WSE-3. There is no incremental fix — only a different paradigm.

Key numbers:

- **21 PB/s** — on-chip SRAM bandwidth
- **44 GB** — on-chip SRAM total
- **46,225 mm²** — die area (57× H100)
- **6.7×** — faster vs GPU cloud on 1T model

**Strengths**

- Fastest single-chip inference for large models — no close second
- Sub-10 ms TTFT on 405B+ models
- No HBM stacks — weights always on-chip
- Public company — balance sheet visible and reasonably stable

**Risks**

- 44 GB SRAM limits native model capacity (weight streaming mitigates but adds latency)
- ~23 kW per CS-3 — massive power and cooling infrastructure requirement
- Cluster economics prohibitive for small-scale deployments

Latest moves:

- Condor Galaxy 3 (9× CS-3) operational — 21,000 tokens/sec on Llama 3 405B
- CBRS IPO completed late 2024; trading publicly
- Expanding enterprise inference cloud offering

[cerebras.ai](https://www.cerebras.ai)

### Groq

*Dataflow · NVIDIA-acquired.* Product line: Groq LPU · Groq 3 (NIM Accelerator). Deterministic dataflow — sub-millisecond first-token latency that GPUs cannot match. Founded 2016, Mountain View, CA, acquired by NVIDIA for $20B (Dec 2025).

Groq was founded by ex-Google TPU engineers with a single goal: eliminate unpredictable GPU latency. The LPU (Language Processing Unit) uses statically-compiled dataflow — all scheduling decisions made at compile time, so the chip never stalls. The result is deterministic latency every invocation, and a first-token time below 1 ms — physically impossible on a GPU's runtime-scheduled SIMT model.

NVIDIA acquired Groq for $20B in December 2025, the largest AI chip startup acquisition ever. Groq 3 debuted at GTC 2026 as a "NIM Accelerator" integrated into NVIDIA's inference serving platform. GroqCloud (1M+ registered developers) is now accessible through NVIDIA NIM endpoints.

> **The bet (pre-acquisition):** Compile-time static scheduling → deterministic, stall-free dataflow → sub-ms TTFT → ideal for interactive and agentic applications where latency matters more than throughput. The $20B acquisition validated the thesis — NVIDIA bought it rather than outcompete it.

Key numbers:

- **<1 ms** — TTFT on 7B models
- **500+ tok/s** — 7B FP8 throughput
- **$20B** — NVIDIA acquisition price
- **1M+** — GroqCloud developers
