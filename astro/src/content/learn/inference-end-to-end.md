---
title: "Inference, End to End"
summary: "Prefill and decode, why one decode is memory-bound, precision and the KV cache, speculative decoding, the memory hierarchy, and where the CPU re-enters the picture."
eyebrow: "Field guide · how inference actually runs"
tracker: "inference-engines"
date: 2026-06-16
---

Prefill and decode, why one decode is memory-bound, precision and the KV cache, speculative decoding, the memory hierarchy, and where the CPU re-enters the picture — with diagrams and a KV-cache reference table.

- **2 stages** — prefill + decode
- **1x token** per decode pass
- **~320 KiB** KV / token · Llama-70B FP16
- **8x smaller** weights · FP4 vs FP32

## The two stages: prefill & decode

Every LLM request runs in two very different phases. **Prefill** ingests your entire prompt in a single parallel pass, building the KV cache and emitting the first token. **Decode** then generates the rest one token at a time, each new token feeding back in as input. The first phase sets your *time-to-first-token*; the second sets your *time-per-output-token*.

> Diagram: The full request path: tokenize → prefill (one parallel pass that fills the KV cache) → first token (TTFT) → the autoregressive decode loop → detokenize. [Whimsical source](https://whimsical.com/F137moPA8KVnqXqKBSPWVU)

1. Request — system prompt, chat history, new turn
2. Tokenize to token IDs
3. PREFILL (compute-bound) — all prompt tokens in one parallel pass, writing K/V for every prompt token
4. First token (TTFT)
5. DECODE (memory-bound) — one token per pass, reading the whole cache and appending new K/V
6. Loop until EOS or max tokens, then detokenize to text and stream the response

### Prefill

All prompt tokens go through every layer at once — large matrix–matrix multiplies that saturate the Tensor Cores. Cost grows with prompt length (and with length² for attention). This is where the KV cache is born.

### Decode

One forward pass per token: embed the last token, attend over the *whole* KV cache, sample, append the new K/V, repeat. The matmuls shrink to matrix–vector products — small, frequent, and bandwidth-hungry.

## GPU utilization: why one decode is memory-bound

To produce a *single* decode token the GPU must stream every model weight — and the entire KV cache — out of HBM and through the compute units exactly once. That is a tiny number of FLOPs per byte moved, so the **arithmetic intensity** sits far below the GPU's FLOP-to-byte ratio. You are pinned to the memory-bandwidth side of the roofline, and the Tensor Cores idle while waiting on HBM. Prefill is the opposite: each weight read is reused across hundreds of prompt tokens, so it is compute-bound.

> Diagram: Same weights, same math — but prefill reuses each weight across many tokens (compute-bound) while decode re-reads everything to make one token (memory-bound). [Whimsical source](https://whimsical.com/EmHFheRQ2haQYzpBicq9s8)

- PREFILL — one pass over N prompt tokens; each weight reused across N tokens (FLOPs ≫ bytes) → **compute-bound**, limited by FLOPs.
- DECODE — one pass per single token; re-reads all weights and KV per token (bytes ≫ FLOPs) → **memory-bound**, limited by HBM bandwidth.
- Fix: batch requests so one weight-read serves many tokens.

### The lever: batching

Batch B requests together and a single weight read now serves B tokens — arithmetic intensity rises ~B×, dragging decode back toward the compute-bound regime. This is why throughput-oriented servers run large continuous batches, and why your per-request latency improves when the server is *busy*, not idle.

## Precision: the bits behind every number

A parameter is just a number; precision is how many bits you spend on it. Fewer bits means less VRAM, less bandwidth to move (which is the decode bottleneck), and higher throughput — at the cost of rounding error. Precision decides three things at once: whether the model *fits*, how *fast* decode runs, and how much VRAM is left for KV cache (longer context, more users).

| Format | Bytes/param | Sign·Exp·Mantissa | 70B weights | Notes |
| --- | --- | --- | --- | --- |
| **FP32** | 4 B | 1·8·23 | **280 GB** | Full precision. Reference accuracy, rarely used to serve. |
| **TF32** | 4 B | 1·8·10 | **280 GB** | NVIDIA matmul format — FP32 range, ~FP16 mantissa. |
| **FP16** | 2 B | 1·5·10 | **140 GB** | Half precision. Narrow range → can overflow without care. |
| **BF16** | 2 B | 1·8·7 | **140 GB** | Same range as FP32, fewer mantissa bits. The training default. |
| **FP8 (E4M3)** | 1 B | 1·4·3 | **70 GB** | Modern serving sweet spot on Hopper/Blackwell. Great quality. |
| **FP8 (E5M2)** | 1 B | 1·5·2 | **70 GB** | Wider range, less precision — used for gradients/activations. |
| **INT8** | 1 B | int | **70 GB** | Integer quant (SmoothQuant/AWQ-style). Needs calibration. |
| **MXFP4** | 0.5 B | 1·2·1 | **35 GB** | 4-bit float, block size 32, power-of-two shared scale. |
| **NVFP4** | 0.5 B | 1·2·1 | **35 GB** | Block 16 + FP8 per-block scale + FP32 per-tensor scale → near-FP8 accuracy. |
| **INT4** | 0.5 B | int | **35 GB** | GPTQ/AWQ 4-bit. Smallest footprint, most aggressive. |

### Block floating point (the 4-bit trick)

Plain 4-bit floats lose too much range. **MXFP4** shares one power-of-two scale across a block of 32 values; **NVFP4** uses a 16-value block with an FP8 per-block scale plus an FP32 per-tensor scale — getting near-FP8 accuracy at half the bytes.

### How good is 4-bit now?

On Blackwell, DeepSeek-R1's MMLU moved just 90.8% → 90.7% going FP8 → NVFP4, with ~2–3× higher math throughput. Mixed precision (4-bit weights, higher-precision outliers/KV) is the 2026 production default.

## The KV cache: how it works

Attention needs the key and value vectors of *every* previous token. Recomputing them each step would be quadratic, so we cache them. Prefill fills the cache for the whole prompt; each decode step appends one new row and reads the whole thing back. The cache holds three things: the **system prompt** (static, so its KV can be reused across requests), the **chat history** (grows every turn), and the **generated tokens**.

> Diagram: Prefill writes K/V for the whole prompt; the cache holds the system prompt, the chat history and generated tokens — and grows linearly with every token. [Whimsical source](https://whimsical.com/4sCfkcQ5ssPYxCGiDj1sAM)

The cache grows linearly with context, so it competes with model weights for VRAM. That forces a real product trade-off in how much history you keep:

### Stuff the full history

Best recall and fewest mistakes — but a huge cache, slow prefill on every turn, and real OOM risk as conversations grow.

### System prompt only

Tiny, fast, cheap cache — but the model forgets earlier turns and feels amnesiac in long sessions.

### The balance

Always keep the system prompt (and reuse its cached prefix), keep the most recent turns verbatim, and fold older turns into a running summary. Quality of recent context, bounded cost.

## The KV-cache formula (and a model reference table)

Bytes of KV cache, exactly:

```
KV bytes/token = 2 × n_layers × n_kv-heads × d_head × bytes_elem
total = KV bytes/token × sequence-length × batch-size
```

- **2** — one tensor for keys, one for values
- **n_layers** — every transformer block keeps its own cache
- **n_kv-heads** — with GQA this is the *grouped* count, far smaller than query heads; MLA compresses it further into a latent
- **d_head** — per-head dimension (hidden size ÷ query heads)
- **bytes_elem** — 2 for FP16/BF16, 1 for FP8, 0.5 for FP4

Per-token KV cache for five reference models, computed at FP16 (2 bytes per element) with `perToken = 2 × layers × kv-heads × head-dim × 2`:

| Model | Layers | KV heads | Head dim | Attn | KV/token (FP16) |
| --- | --- | --- | --- | --- | --- |
| Llama 3.1 8B | 32 | 8 | 128 | GQA | 128.0 KiB |
| Llama 3.1 70B | 80 | 8 | 128 | GQA | 320.0 KiB |
| Llama 3.1 405B | 126 | 8 | 128 | GQA | 504.0 KiB |
| Mistral 7B | 32 | 8 | 128 | GQA | 128.0 KiB |
| GPT-3 175B (no GQA) | 96 | 96 | 128 | MHA | 4.5 MiB |

Dropping precision halves the cache (FP8 → half of FP16, FP4 → a quarter), and a model *without* GQA (GPT-3 175B) explodes the number — that is exactly why grouped-query attention became standard.

## Inference strategies

The toolbox that turns a model into a fast, dense, multi-tenant service.

- **Continuous batching** — Add and retire requests every step instead of waiting for a whole batch to finish. One weight-read serves many sequences — the single biggest decode-throughput win.
- **PagedAttention** — Store the KV cache in fixed-size blocks (like OS paging) so sequences need not be contiguous. Kills fragmentation and packs far more concurrent users. (vLLM)
- **GQA / MQA / MLA** — Share K/V heads across query heads (GQA), collapse to one (MQA), or compress K/V into a small latent (MLA, DeepSeek). Directly cuts cache bytes per token.
- **Quantization** — Serve weights — and often the KV cache itself — in FP8/INT8/FP4. Less VRAM and less bandwidth, which is exactly what memory-bound decode needs.
- **Chunked prefill** — Slice a long prompt into chunks and interleave them with ongoing decode steps so one giant prefill cannot stall everyone else's token stream.
- **Prefix / prompt caching** — A shared system prompt is identical across requests — compute its KV once and reuse the prefix, skipping that prefill entirely on every later call.
- **Disaggregated serving** — Run compute-bound prefill and memory-bound decode on separate GPU pools, transferring the KV cache between them. Tune each pool independently.
- **FlashAttention** — Tile attention through fast on-chip SRAM and never write the full N×N scores to HBM. A memory-aware kernel — it is why long context is affordable.
- **CUDA graphs** — Capture the per-step kernel launches once and replay them as a single graph, removing host launch overhead that otherwise dominates tiny decode steps.
- **Speculative decoding** — A small draft model proposes several tokens; the big model verifies them in one pass. Multiple tokens per expensive forward — same output distribution.

## Speculative & speculative-speculative decoding

Because decode is memory-bound, the GPU can verify several tokens for almost the same cost as generating one. **Speculative decoding** exploits that: a cheap **draft** model proposes k tokens, the big **target** model checks them all in a single parallel pass, accepts the longest correct prefix, and corrects the first mismatch. The output distribution is provably identical to the target alone — you just get there in fewer expensive passes.

> Diagram: A small draft model proposes tokens; the big target verifies them in one pass. SSD goes further — drafting the next guesses while verification is still running. [Whimsical source](https://whimsical.com/Du7J9wEP9KrnFLwhVmgZZL)

### Speculative speculative decoding (SSD)

Ordinary spec-decoding still serializes *draft → verify → draft*. SSD parallelizes it: while the target is still verifying, the draft pre-computes speculations for the *likely* verification outcomes. If the real outcome lands in that predicted set, the next speculation is returned instantly — drafting latency hidden entirely behind verification compute. With the draft on separate hardware, the *Saguaro* implementation reports up to 2× over optimized spec-decoding and 5× over plain autoregressive decoding.

*— Kumar, Dao & May, arXiv 2603.03251*

## The memory hierarchy

Inference is a story about moving bytes. Registers and on-chip SRAM are blistering but tiny — FlashAttention lives here, tiling attention so the full score matrix never touches HBM. Model weights and the KV cache sit in **HBM/VRAM**. When VRAM runs out, modern servers spill the KV cache *down* the hierarchy across the PCIe/NVLink bridge into CPU DRAM, then NVMe, then the network.

> Diagram: Registers → SRAM → L2 → HBM on the GPU, then across the PCIe/NVLink bridge to CPU DRAM, NVMe and the network. Each step down: slower, bigger, cheaper. [Whimsical source](https://whimsical.com/Kmxbqfc78xQk9Xtenja2Je)

- GPU Registers — ~100 TB/s · KBs
- GPU SRAM / L1 — ~20 TB/s · MBs · FlashAttention
- GPU L2 — multi-TB/s · ~50 MB
- GPU HBM / VRAM — 3.35 to 8 TB/s · weights + KV
- PCIe / NVLink bridge — 64 GB/s and 900 GB/s (spill when VRAM full)
- CPU DRAM — 200 to 500 GB/s · KV offload
- NVMe SSD — 3 to 14 GB/s · KV spill
- Network / object store — tens of GB/s · PBs

## Why inference is becoming CPU-dependent again

For a decade the GPU was the whole story. But decode kernels are tiny and memory-bound, and GPUs have gotten dramatically faster — so the *host* work between kernels (scheduling, Python, kernel launches, sampling, tokenization, KV paging) can now take longer than the GPU compute it surrounds. The bottleneck has partly moved back to the CPU.

> Diagram: The CPU schedules the batch, launches kernels, samples, and pages the KV cache; the GPU does the matmuls. On tiny decode steps the host work can outrun the GPU. [Whimsical source](https://whimsical.com/SKWyBxD1UTYJX3t2CiJEkr)

### What the CPU now owns

Continuous-batching scheduler, sampling and stop-string logic, tokenize/detokenize, KV-cache paging and **offload** to DRAM/SSD, MoE routing bookkeeping, and sometimes the speculative draft itself.

### How servers fight back

CUDA graphs to erase launch overhead, C++/Rust runtimes instead of Python loops, overlapped scheduling that prepares the next batch while the GPU runs, and offload engines (LMCache, NVIDIA Dynamo) that tier the cache.

## Balancing VRAM: weights vs KV cache

Your VRAM is a fixed budget shared four ways:

```
VRAM = weights + KV cache + activations + overhead
KV budget = VRAM − weights − overhead  →  max concurrent tokens = KV budget ÷ (KV bytes/token)
```

### Worked example — one 80 GB H100, Llama-3 70B

BF16 weights need ~140 GB and won't even fit on one card. Quantize to **FP8** (~70 GB) and ~8 GB goes to runtime overhead, leaving only ~2 GB of KV — a handful of short sessions. Quantize to **FP4** (~35 GB) and suddenly ~37 GB is free for KV: at ~320 KiB/token that is well over 100k cached tokens — long context or many concurrent users. Every bit you shave off the weights is context you hand back to users.

## The research frontier

What is new, upcoming, and changing how inference is served.

- **NVFP4 + QAD** — 4-bit serving with quantization-aware distillation recovering nearly all lost accuracy — 4-bit is becoming the default, not the fallback.
- **Memory layers at scale** — Meta's trainable key–value lookup adds knowledge capacity without adding FLOPs — sparse memory that complements dense FFNs and cuts hallucination on factual tasks.
- **LMCache · NVIDIA Dynamo** — Tier the KV cache across HBM → DRAM → SSD → network and reuse it across requests; reported 3–10× latency cuts on shared-prefix workloads.
- **Disaggregated serving** — Split prefill and decode onto separate, independently-scaled pools — protecting interactive token streams from heavy prompts.
- **MoE inference** — Mixture-of-experts activates a few experts per token — huge parameter counts, modest per-token FLOPs, with expert routing and placement as the new challenge.
- **EAGLE · Medusa · MTP** — Self-speculation: extra heads or feature-level drafters predict multiple tokens from the model itself — and SSD hides the drafting cost entirely.

## How the big labs serve at scale

Production stacks combine almost everything above. Prompts are deduplicated with **prefix caching** (millions of requests share one system prompt), weights run in **FP8/FP4**, requests flow through huge **continuous batches**, prefill and decode are **disaggregated** across pools, and the KV cache is **paged and offloaded** across a memory hierarchy. Under the hood it is usually vLLM, SGLang or TensorRT-LLM, frequently on custom silicon (TPU, Trainium/Inferentia, MTIA) where the economics favor it. The art is keeping expensive GPUs busy with useful matmuls while the CPU, the network and the storage tier feed them fast enough.

## Sources & further reading

- [Speculative Speculative Decoding — Kumar, Dao & May (arXiv 2603.03251)](https://arxiv.org/abs/2603.03251)
- [Introducing NVFP4 for Efficient and Accurate Low-Precision Inference — NVIDIA](https://developer.nvidia.com/blog/introducing-nvfp4-for-efficient-and-accurate-low-precision-inference/)
- [Memory Layers at Scale — Meta FAIR (arXiv 2412.09764)](https://arxiv.org/abs/2412.09764)
- [LMCache: An Efficient KV Cache Layer for Enterprise-Scale LLM Inference](https://arxiv.org/abs/2510.09665)
- [NVIDIA tiered KV caching & the Dynamo engine](https://blocksandfiles.com/2025/07/07/nvidia-and-memory-storage-tiering-for-ai-vectors/)
- [KV cache offloading — LLM Inference Handbook](https://bentoml.com/llm/inference-optimization/kv-cache-offloading)
